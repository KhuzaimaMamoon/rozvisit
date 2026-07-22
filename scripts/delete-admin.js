import mongoose from 'mongoose';
import { env } from '../server/src/config/env.js';
import { ROLES } from '../server/src/config/constants.js';
import { AuditEvent } from '../server/src/models/AuditEvent.js';
import { User } from '../server/src/models/User.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value, name) {
  const email = value?.trim().toLowerCase();
  if (!email || !EMAIL_PATTERN.test(email)) {
    throw new Error(`${name} must be a valid email address.`);
  }
  return email;
}

function readInput() {
  const args = process.argv.slice(2);
  const commandLineEmail = args.find((value) => !value.startsWith('--'));
  const actorArgument = args
    .find((value) => value.startsWith('--actor-email='))
    ?.slice('--actor-email='.length);

  return {
    actorEmail: actorArgument ?? process.env.ACTOR_ADMIN_EMAIL,
    targetEmail: normalizeEmail(
      commandLineEmail ?? process.env.DELETE_ADMIN_EMAIL,
      'Admin email to delete',
    ),
  };
}

async function resolveActor(targetId, actorEmail, session) {
  if (actorEmail) {
    const normalizedActorEmail = normalizeEmail(actorEmail, 'ACTOR_ADMIN_EMAIL');
    const actor = await User.findOne({ email: normalizedActorEmail, role: ROLES.ADMIN }).session(
      session,
    );

    if (!actor) throw new Error(`The audit actor ${normalizedActorEmail} is not an admin.`);
    if (actor._id.equals(targetId)) {
      throw new Error('The admin being deleted cannot be the audit actor.');
    }
    return actor;
  }

  const remainingAdmins = await User.find({
    _id: { $ne: targetId },
    role: ROLES.ADMIN,
  })
    .select('_id email')
    .session(session);

  if (remainingAdmins.length === 1) return remainingAdmins[0];
  throw new Error(
    'ACTOR_ADMIN_EMAIL is required when more than one admin would remain, so the audit event names the correct actor.',
  );
}

async function deleteAdmin() {
  const { actorEmail, targetEmail } = readInput();

  await mongoose.connect(env.mongoUri);
  const session = await mongoose.startSession();
  try {
    let actor;

    await session.withTransaction(async () => {
      const target = await User.findOne({ email: targetEmail }).session(session);
      if (!target) throw new Error(`No account exists for ${targetEmail}.`);
      if (target.role !== ROLES.ADMIN) {
        throw new Error(`Refusing to delete ${targetEmail} because the account is not an admin.`);
      }

      const adminCount = await User.countDocuments({ role: ROLES.ADMIN }).session(session);
      if (adminCount <= 1) {
        throw new Error('Refusing to delete the last admin account.');
      }

      actor = await resolveActor(target._id, actorEmail, session);

      await AuditEvent.create(
        [
          {
            action: 'admin.deleted',
            actorId: actor._id,
            at: new Date(),
            detail: {
              source: 'scripts/delete-admin.js',
              targetEmail: target.email,
              targetName: target.name,
            },
            targetId: target._id,
            targetType: 'user',
          },
        ],
        { session },
      );

      const result = await User.deleteOne({ _id: target._id, role: ROLES.ADMIN }).session(session);
      if (result.deletedCount !== 1) throw new Error('Admin deletion did not complete.');
    });

    process.stdout.write(
      `Deleted admin account ${targetEmail}; audit actor: ${actor.email}. No other records were changed.\n`,
    );
  } finally {
    await session.endSession();
    await mongoose.disconnect();
  }
}

try {
  await deleteAdmin();
} catch (error) {
  process.stderr.write(`Admin deletion failed: ${error.message}\n`);
  process.exitCode = 1;
}
