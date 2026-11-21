import { advisoryFirms } from '@advisory-firms/infrastructure/repository/postgres/schema';
import { sql } from 'drizzle-orm';
import { date, index, integer, numeric, pgTable, primaryKey, smallint } from 'drizzle-orm/pg-core';

export const monthlyMetrics = pgTable(
  'monthly_metrics',
  {
    firmId: integer('firm_id')
      .notNull()
      .references(() => advisoryFirms.id),
    month: date('month').notNull(),
    fiscalYear: smallint('fiscal_year')
      .notNull()
      .generatedAlwaysAs(sql`(extract(year from "month" - interval '3 months'))::smallint`),
    activeClients: integer('active_clients').notNull(),
    newClients: integer('new_clients').notNull(),
    churnedClients: integer('churned_clients').notNull(),
    filingsIncomeTax: integer('filings_income_tax').notNull(),
    filingsVat: integer('filings_vat').notNull(),
    filingsCorporateTax: integer('filings_corporate_tax').notNull(),
    filingsOther: integer('filings_other').notNull(),
    revenueAdvisory: integer('revenue_advisory').notNull(),
    revenueManagement: integer('revenue_management').notNull(),
    revenueConsulting: integer('revenue_consulting').notNull(),
    hoursWorked: integer('hours_worked').notNull(),
    queriesReceived: integer('queries_received').notNull(),
    queriesResolved: integer('queries_resolved').notNull(),
    taxAgencyIncidents: integer('tax_agency_incidents').notNull(),
    documentsProcessed: integer('documents_processed').notNull(),
    satisfaction: numeric('satisfaction', { precision: 2, scale: 1, mode: 'number' }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.firmId, table.month] }),
    index('monthly_metrics_fiscal_year_month_idx').on(table.fiscalYear, table.month),
  ],
);
