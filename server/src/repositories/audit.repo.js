import { AuditEvent } from '../models/AuditEvent.js';

export const auditRepository = Object.freeze({
  create(data) {
    return AuditEvent.create(data);
  },
});
