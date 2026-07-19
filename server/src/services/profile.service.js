import { CONSENT_STATE, PARENT_STATUS, ROLES } from '../config/constants.js';
import { parentRepository } from '../repositories/parent.repo.js';
import { ForbiddenError, NotFoundError } from '../utils/AppError.js';
import { decrypt, encrypt } from '../utils/crypto.js';

function decryptOptional(value) {
  return value ? decrypt(value) : null;
}

function serializeParent(profile) {
  return {
    id: profile._id.toString(),
    clientId: profile.clientId.toString(),
    linkedFamilyMembers: profile.linkedFamilyMembers.map((member) => member.toString()),
    name: profile.name,
    age: profile.age,
    phone: profile.phone,
    addressText: decrypt(profile.addressText),
    location: { lng: profile.location.coordinates[0], lat: profile.location.coordinates[1] },
    careNotes: decryptOptional(profile.careNotes),
    emergencyContacts: profile.emergencyContacts,
    consent: { state: profile.consent.state },
    status: profile.status,
  };
}

function encryptFields(data) {
  const update = { ...data };
  if (data.addressText !== undefined) update.addressText = encrypt(data.addressText);
  if (data.careNotes !== undefined && data.careNotes !== null)
    update.careNotes = encrypt(data.careNotes);
  if (data.location)
    update.location = { type: 'Point', coordinates: [data.location.lng, data.location.lat] };
  return update;
}

export const profileService = Object.freeze({
  async createParent(clientId, data) {
    const profile = await parentRepository.create({
      clientId,
      linkedFamilyMembers: [],
      ...encryptFields(data),
      status: PARENT_STATUS.PENDING_CONSENT,
    });
    return serializeParent(profile);
  },

  async listParents(clientId) {
    const profiles = await parentRepository.findByClientId(clientId);
    return profiles.map((profile) => ({
      id: profile._id.toString(),
      name: profile.name,
      status: profile.status,
    }));
  },

  async getParent(actor, parentId) {
    const profile = await parentRepository.findById(parentId);
    if (!profile) throw new NotFoundError();
    if (actor.role !== ROLES.ADMIN && profile.clientId.toString() !== actor.sub)
      throw new ForbiddenError();
    return serializeParent(profile);
  },

  async updateParent(clientId, parentId, data) {
    const existing = await parentRepository.findById(parentId);
    if (!existing) throw new NotFoundError();
    if (existing.clientId.toString() !== clientId) throw new ForbiddenError();

    const profile = await parentRepository.updateOwned(parentId, clientId, encryptFields(data));
    return serializeParent(profile);
  },

  async withdrawConsent(actor, parentId) {
    const existing = await parentRepository.findById(parentId);
    if (!existing) throw new NotFoundError();
    if (actor.role !== ROLES.ADMIN && existing.clientId.toString() !== actor.sub) {
      throw new ForbiddenError();
    }

    const profile = await parentRepository.withdrawConsent(parentId, {
      $set: {
        'consent.state': CONSENT_STATE.WITHDRAWN,
        status: PARENT_STATUS.PAUSED,
      },
      $push: {
        'consent.history': { state: CONSENT_STATE.WITHDRAWN, at: new Date() },
      },
    });
    return serializeParent(profile);
  },
});
