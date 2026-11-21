import { date, integer, pgTable, smallint, text } from 'drizzle-orm/pg-core';

export const autonomousCommunities = pgTable('autonomous_communities', {
  id: smallint('id').primaryKey(),
  name: text('name').notNull().unique(),
});

export const provinces = pgTable('provinces', {
  id: smallint('id').primaryKey(),
  name: text('name').notNull().unique(),
  autonomousCommunityId: smallint('autonomous_community_id')
    .notNull()
    .references(() => autonomousCommunities.id),
});

export const specialties = pgTable('specialties', {
  code: text('code').primaryKey(),
  name: text('name').notNull(),
});

export const advisoryFirms = pgTable('advisory_firms', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  taxId: text('tax_id').notNull().unique(),
  provinceId: smallint('province_id')
    .notNull()
    .references(() => provinces.id),
  city: text('city').notNull(),
  specialtyCode: text('specialty_code')
    .notNull()
    .references(() => specialties.code),
  onboardedOn: date('onboarded_on').notNull(),
  employees: smallint('employees').notNull(),
});
