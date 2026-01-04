// Job States
export const JOB_STATES = {
  DRAFT: 'DRAFT',
  ESCROW_PENDING: 'ESCROW_PENDING',
  ESCROW_HELD: 'ESCROW_HELD',
  STARTED: 'STARTED',
  COMPLETED_PENDING: 'COMPLETED_PENDING',
  PAYOUT_SUCCESS: 'PAYOUT_SUCCESS',
  DISPUTED: 'DISPUTED',
  CANCELLED: 'CANCELLED',
};

// Job State Colors (for badges)
export const JOB_STATE_COLORS = {
  [JOB_STATES.DRAFT]: 'grey',
  [JOB_STATES.ESCROW_PENDING]: 'grey',
  [JOB_STATES.ESCROW_HELD]: 'mint',
  [JOB_STATES.STARTED]: 'indigo',
  [JOB_STATES.COMPLETED_PENDING]: 'coral',
  [JOB_STATES.PAYOUT_SUCCESS]: 'mint',
  [JOB_STATES.DISPUTED]: 'coral',
  [JOB_STATES.CANCELLED]: 'grey',
};

// Job State Labels
export const JOB_STATE_LABELS = {
  [JOB_STATES.DRAFT]: 'Draft',
  [JOB_STATES.ESCROW_PENDING]: 'Payment Pending',
  [JOB_STATES.ESCROW_HELD]: 'Funds Locked',
  [JOB_STATES.STARTED]: 'In Progress',
  [JOB_STATES.COMPLETED_PENDING]: 'Awaiting Review',
  [JOB_STATES.PAYOUT_SUCCESS]: 'Completed',
  [JOB_STATES.DISPUTED]: 'Under Review',
  [JOB_STATES.CANCELLED]: 'Cancelled',
};

// User Roles
export const USER_ROLES = {
  ARTISAN: 'artisan',
  CLIENT: 'client',
};

// MoMo Networks
export const MOMO_NETWORKS = {
  MTN: 'mtn',
  TELECEL: 'vod',
  ATMoney: 'atl',
};

// Export emails
export { EMAILS } from './emails';
