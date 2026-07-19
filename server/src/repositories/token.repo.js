import { AuthToken } from '../models/AuthToken.js';
import { RefreshToken } from '../models/RefreshToken.js';

export const tokenRepository = Object.freeze({
  createRefresh(data) {
    return RefreshToken.create(data);
  },
  findActiveRefresh(tokenHash) {
    return RefreshToken.findOne({ tokenHash, revokedAt: null, expiresAt: { $gt: new Date() } });
  },
  revokeRefresh(tokenHash, at) {
    return RefreshToken.findOneAndUpdate({ tokenHash, revokedAt: null }, { revokedAt: at });
  },
  revokeAllRefreshForUser(userId, at) {
    return RefreshToken.updateMany({ userId, revokedAt: null }, { revokedAt: at });
  },
  createAuthToken(data) {
    return AuthToken.create(data);
  },
  consumeAuthToken(tokenHash, type, at) {
    return AuthToken.findOneAndUpdate(
      { tokenHash, type, usedAt: null, expiresAt: { $gt: at } },
      { usedAt: at },
      { new: true },
    );
  },
});
