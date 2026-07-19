import mongoose from 'mongoose';
import { env } from '../server/src/config/env.js';
import { PLAN_REFERENCE_DATA } from '../server/src/config/planReferenceData.js';
import { planRepository } from '../server/src/repositories/plan.repo.js';

async function seed() {
  await mongoose.connect(env.mongoUri);
  await planRepository.upsertReferencePlans(PLAN_REFERENCE_DATA);
  await mongoose.disconnect();
  process.stdout.write('Seeded the three care-plan reference documents.\n');
}

seed().catch(async (error) => {
  process.stderr.write(`Seed failed: ${error.message}\n`);
  await mongoose.disconnect();
  process.exit(1);
});
