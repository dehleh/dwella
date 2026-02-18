import { pgTable, uuid, text, timestamp, boolean, integer, jsonb, numeric, unique, index, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// ENUMS
// ============================================

export const userStatusEnum = pgEnum('user_status', ['ACTIVE', 'SUSPENDED', 'BANNED']);

export const verificationStatusEnum = pgEnum('verification_status', [
  'NOT_STARTED',
  'PENDING',
  'APPROVED',
  'REJECTED',
  'NEEDS_REVIEW'
]);

export const verificationLevelEnum = pgEnum('verification_level', ['STANDARD', 'ENHANCED']);

export const listingStatusEnum = pgEnum('listing_status', [
  'DRAFT',
  'PUBLISHED',
  'PAUSED',
  'TAKEN',
  'REMOVED'
]);

export const roomTypeEnum = pgEnum('room_type', [
  'ENSUITE',
  'SHARED_BATH',
  'STUDIO_ROOM'
]);

export const conversationStatusEnum = pgEnum('conversation_status', [
  'ACTIVE',
  'BLOCKED',
  'CLOSED'
]);

export const messageTypeEnum = pgEnum('message_type', ['TEXT', 'IMAGE']);

export const unlockRequestStatusEnum = pgEnum('unlock_request_status', [
  'PENDING_HOST_APPROVAL',
  'APPROVED',
  'DECLINED',
  'PAYMENT_PENDING',
  'PAID',
  'CONTACT_REVEALED',
  'REFUNDED'
]);

export const paymentTypeEnum = pgEnum('payment_type', ['UNLOCK_FEE', 'REFUND']);

export const paymentStatusEnum = pgEnum('payment_status', [
  'INITIATED',
  'SUCCESS',
  'FAILED',
  'REFUNDED',
  'CHARGEBACK'
]);

export const viewingStatusEnum = pgEnum('viewing_status', [
  'PROPOSED',
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED',
  'NO_SHOW'
]);

export const reportCategoryEnum = pgEnum('report_category', [
  'SCAM',
  'HARASSMENT',
  'IMPERSONATION',
  'INAPPROPRIATE_CONTENT',
  'SAFETY_RISK',
  'OTHER'
]);

export const reportStatusEnum = pgEnum('report_status', [
  'OPEN',
  'IN_REVIEW',
  'RESOLVED',
  'DISMISSED'
]);

export const reportPriorityEnum = pgEnum('report_priority', [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
]);

// ============================================
// CORE TABLES
// ============================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique(),
  phone: text('phone').unique(),
  passwordHash: text('password_hash'),
  roles: jsonb('roles').$type<{ host?: boolean; seeker?: boolean }>().notNull().default({ seeker: true }),
  status: userStatusEnum('status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  phoneIdx: index('users_phone_idx').on(table.phone),
}));

export const userProfiles = pgTable('user_profiles', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  displayName: text('display_name').notNull(),
  bio: text('bio'),
  occupation: text('occupation'),
  neighborhood: text('neighborhood'),
  city: text('city'),
  photos: jsonb('photos').$type<Array<{ url: string; moderation_status: string }>>().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const verificationRequests = pgTable('verification_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  level: verificationLevelEnum('level').notNull().default('STANDARD'),
  status: verificationStatusEnum('status').notNull().default('NOT_STARTED'),
  providerRef: text('provider_ref'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  decisionReasonCode: text('decision_reason_code'),
  decisionNote: text('decision_note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index('verification_requests_user_idx').on(table.userId),
  statusIdx: index('verification_requests_status_idx').on(table.status, table.submittedAt),
}));

export const verificationArtifacts = pgTable('verification_artifacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  verificationRequestId: uuid('verification_request_id').references(() => verificationRequests.id, { onDelete: 'cascade' }).notNull(),
  artifactType: text('artifact_type').notNull(), // ID_FRONT, ID_BACK, SELFIE, LIVENESS_RESULT
  secureUri: text('secure_uri').notNull(), // encrypted or tokenized reference
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const listings = pgTable('listings', {
  id: uuid('id').primaryKey().defaultRandom(),
  hostUserId: uuid('host_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  status: listingStatusEnum('status').notNull().default('DRAFT'),
  city: text('city').notNull(),
  neighborhood: text('neighborhood').notNull(),
  geoHash: text('geo_hash'), // optional, for approximate location
  priceMonthly: integer('price_monthly').notNull(),
  deposit: integer('deposit'),
  roomType: roomTypeEnum('room_type').notNull(),
  furnished: boolean('furnished').notNull().default(false),
  utilitiesIncluded: boolean('utilities_included').notNull().default(false),
  minStayMonths: integer('min_stay_months').notNull().default(1),
  availableFrom: timestamp('available_from', { withTimezone: true }).notNull(),
  rules: jsonb('rules').$type<{
    guests?: string;
    quietHours?: string;
    smoking?: boolean;
    pets?: boolean;
    cooking?: boolean;
  }>().notNull().default({}),
  photos: jsonb('photos').$type<string[]>().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  cityNeighborhoodIdx: index('listings_city_neighborhood_idx').on(table.city, table.neighborhood, table.status),
  hostIdx: index('listings_host_idx').on(table.hostUserId),
  priceIdx: index('listings_price_idx').on(table.priceMonthly),
}));

export const preferences = pgTable('preferences', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  hardConstraints: jsonb('hard_constraints').$type<{
    city?: string;
    neighborhoods?: string[];
    budgetMin?: number;
    budgetMax?: number;
    moveInFrom?: string;
    moveInTo?: string;
    minStayMonths?: number;
    roomTypes?: string[];
    utilitiesIncluded?: boolean;
  }>().notNull().default({}),
  compatibility: jsonb('compatibility').$type<{
    cleanliness?: number; // 1-5
    choresExpectation?: string;
    guestsPolicy?: string;
    quietHours?: string;
    workSchedule?: string;
    smoking?: string;
    alcohol?: string;
    cookingFrequency?: string;
    pets?: string;
    conflictHandling?: string;
  }>().notNull().default({}),
  dealbreakers: jsonb('dealbreakers').$type<string[]>().notNull().default([]),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const matchCache = pgTable('match_cache', {
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  listingId: uuid('listing_id').references(() => listings.id, { onDelete: 'cascade' }).notNull(),
  score: numeric('score', { precision: 5, scale: 2 }).notNull(),
  reasons: jsonb('reasons').$type<string[]>().notNull().default([]),
  computedAt: timestamp('computed_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  pk: { name: 'match_cache_pkey', columns: [table.userId, table.listingId] },
  scoreIdx: index('match_cache_score_idx').on(table.userId, table.score),
}));

// ============================================
// MESSAGING
// ============================================

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  listingId: uuid('listing_id').references(() => listings.id, { onDelete: 'cascade' }).notNull(),
  hostUserId: uuid('host_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  seekerUserId: uuid('seeker_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  status: conversationStatusEnum('status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueConversation: unique('unique_conversation').on(table.listingId, table.hostUserId, table.seekerUserId),
  hostIdx: index('conversations_host_idx').on(table.hostUserId),
  seekerIdx: index('conversations_seeker_idx').on(table.seekerUserId),
}));

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }).notNull(),
  senderUserId: uuid('sender_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  messageType: messageTypeEnum('message_type').notNull().default('TEXT'),
  body: text('body'),
  mediaUrl: text('media_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  conversationIdx: index('messages_conversation_idx').on(table.conversationId, table.createdAt),
}));

export const blocks = pgTable('blocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  blockerUserId: uuid('blocker_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  blockedUserId: uuid('blocked_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  context: jsonb('context').$type<{ listingId?: string; conversationId?: string }>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueBlock: unique('unique_block').on(table.blockerUserId, table.blockedUserId),
}));

// ============================================
// UNLOCKS & PAYMENTS
// ============================================

export const unlockRequests = pgTable('unlock_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  listingId: uuid('listing_id').references(() => listings.id, { onDelete: 'cascade' }).notNull(),
  hostUserId: uuid('host_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  seekerUserId: uuid('seeker_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  status: unlockRequestStatusEnum('status').notNull().default('PENDING_HOST_APPROVAL'),
  unlockFee: integer('unlock_fee').notNull().default(500), // in kobo (NGN)
  hostAutoApprove: boolean('host_auto_approve').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueUnlock: unique('unique_unlock').on(table.listingId, table.hostUserId, table.seekerUserId),
  statusIdx: index('unlock_requests_status_idx').on(table.status, table.createdAt),
}));

export const paymentTransactions = pgTable('payment_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  unlockRequestId: uuid('unlock_request_id').references(() => unlockRequests.id, { onDelete: 'cascade' }),
  type: paymentTypeEnum('type').notNull(),
  provider: text('provider').notNull().default('paystack'),
  providerTxRef: text('provider_tx_ref').notNull(),
  amount: integer('amount').notNull(),
  currency: text('currency').notNull().default('NGN'),
  status: paymentStatusEnum('status').notNull().default('INITIATED'),
  rawWebhook: jsonb('raw_webhook'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  providerRefIdx: index('payment_transactions_provider_ref_idx').on(table.providerTxRef),
  statusIdx: index('payment_transactions_status_idx').on(table.status, table.createdAt),
}));

export const contactReveals = pgTable('contact_reveals', {
  id: uuid('id').primaryKey().defaultRandom(),
  unlockRequestId: uuid('unlock_request_id').references(() => unlockRequests.id, { onDelete: 'cascade' }).notNull(),
  revealedToUserId: uuid('revealed_to_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  revealedFields: jsonb('revealed_fields').$type<{ whatsapp?: boolean; phone?: boolean }>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueReveal: unique('unique_reveal').on(table.unlockRequestId, table.revealedToUserId),
}));

// ============================================
// VIEWING & REPORTS
// ============================================

export const viewings = pgTable('viewings', {
  id: uuid('id').primaryKey().defaultRandom(),
  listingId: uuid('listing_id').references(() => listings.id, { onDelete: 'cascade' }).notNull(),
  hostUserId: uuid('host_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  seekerUserId: uuid('seeker_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  status: viewingStatusEnum('status').notNull().default('PROPOSED'),
  proposedSlots: jsonb('proposed_slots').$type<string[]>().notNull().default([]),
  confirmedSlot: timestamp('confirmed_slot', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  reporterUserId: uuid('reporter_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  reportedUserId: uuid('reported_user_id').references(() => users.id, { onDelete: 'cascade' }),
  reportedListingId: uuid('reported_listing_id').references(() => listings.id, { onDelete: 'cascade' }),
  reportedMessageId: uuid('reported_message_id').references(() => messages.id, { onDelete: 'cascade' }),
  category: reportCategoryEnum('category').notNull(),
  description: text('description').notNull(),
  evidenceUrls: jsonb('evidence_urls').$type<string[]>().default([]),
  status: reportStatusEnum('status').notNull().default('OPEN'),
  priority: reportPriorityEnum('priority').notNull().default('MEDIUM'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  statusPriorityIdx: index('reports_status_priority_idx').on(table.status, table.priority, table.createdAt),
}));

export const adminActionLogs = pgTable('admin_action_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  adminUserId: uuid('admin_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  action: text('action').notNull(), // VERIFY_APPROVE, VERIFY_REJECT, USER_BAN, LISTING_TAKEDOWN, REFUND_ISSUED, etc.
  targetType: text('target_type').notNull(), // USER, LISTING, REPORT, UNLOCK, PAYMENT
  targetId: uuid('target_id').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  targetIdx: index('admin_action_logs_target_idx').on(table.targetType, table.targetId),
}));

// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  listings: many(listings),
  verificationRequests: many(verificationRequests),
  preferences: one(preferences, {
    fields: [users.id],
    references: [preferences.userId],
  }),
}));

export const listingsRelations = relations(listings, ({ one, many }) => ({
  host: one(users, {
    fields: [listings.hostUserId],
    references: [users.id],
  }),
  conversations: many(conversations),
  unlockRequests: many(unlockRequests),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  listing: one(listings, {
    fields: [conversations.listingId],
    references: [listings.id],
  }),
  host: one(users, {
    fields: [conversations.hostUserId],
    references: [users.id],
  }),
  seeker: one(users, {
    fields: [conversations.seekerUserId],
    references: [users.id],
  }),
  messages: many(messages),
}));

export const unlockRequestsRelations = relations(unlockRequests, ({ one, many }) => ({
  listing: one(listings, {
    fields: [unlockRequests.listingId],
    references: [listings.id],
  }),
  host: one(users, {
    fields: [unlockRequests.hostUserId],
    references: [users.id],
  }),
  seeker: one(users, {
    fields: [unlockRequests.seekerUserId],
    references: [users.id],
  }),
  paymentTransactions: many(paymentTransactions),
}));
