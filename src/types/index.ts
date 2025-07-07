export * from './referral';
export * from './profit-share';
export * from './user-group';
export * from './user';
export * from './cooperative';
export * from './contribution';
export * from './loan';
export * from './payment';
export * from './repayment';

export enum STATUS {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  SENT = 'SENT',
  PAID = 'PAID',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DEACTIVATED = 'DEACTIVATED',
  APPROVED = 'APPROVED'
}

export enum ROLES {
  ADMIN = 'ADMIN',
  COOP_MEMBER = 'COOP_MEMBER',
  COOP_ADMIN = 'COOP_ADMIN',
  USER = 'USER',
  SUPER_ADMIN = 'SUPER_ADMIN',
  SYSTEM = 'SYSTEM'
}