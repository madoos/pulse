CREATE TABLE "advisory_firms" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"tax_id" text NOT NULL,
	"province_id" smallint NOT NULL,
	"city" text NOT NULL,
	"specialty_code" text NOT NULL,
	"onboarded_on" date NOT NULL,
	"employees" smallint NOT NULL,
	CONSTRAINT "advisory_firms_tax_id_unique" UNIQUE("tax_id")
);
--> statement-breakpoint
CREATE TABLE "autonomous_communities" (
	"id" smallint PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "autonomous_communities_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "provinces" (
	"id" smallint PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"autonomous_community_id" smallint NOT NULL,
	CONSTRAINT "provinces_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "specialties" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monthly_metrics" (
	"firm_id" integer NOT NULL,
	"month" date NOT NULL,
	"fiscal_year" smallint GENERATED ALWAYS AS ((extract(year from "month" - interval '3 months'))::smallint) STORED NOT NULL,
	"active_clients" integer NOT NULL,
	"new_clients" integer NOT NULL,
	"churned_clients" integer NOT NULL,
	"filings_income_tax" integer NOT NULL,
	"filings_vat" integer NOT NULL,
	"filings_corporate_tax" integer NOT NULL,
	"filings_other" integer NOT NULL,
	"revenue_advisory" integer NOT NULL,
	"revenue_management" integer NOT NULL,
	"revenue_consulting" integer NOT NULL,
	"hours_worked" integer NOT NULL,
	"queries_received" integer NOT NULL,
	"queries_resolved" integer NOT NULL,
	"tax_agency_incidents" integer NOT NULL,
	"documents_processed" integer NOT NULL,
	"satisfaction" numeric(2, 1) NOT NULL,
	CONSTRAINT "monthly_metrics_firm_id_month_pk" PRIMARY KEY("firm_id","month")
);
--> statement-breakpoint
ALTER TABLE "advisory_firms" ADD CONSTRAINT "advisory_firms_province_id_provinces_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advisory_firms" ADD CONSTRAINT "advisory_firms_specialty_code_specialties_code_fk" FOREIGN KEY ("specialty_code") REFERENCES "public"."specialties"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provinces" ADD CONSTRAINT "provinces_autonomous_community_id_autonomous_communities_id_fk" FOREIGN KEY ("autonomous_community_id") REFERENCES "public"."autonomous_communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_metrics" ADD CONSTRAINT "monthly_metrics_firm_id_advisory_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."advisory_firms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "monthly_metrics_fiscal_year_month_idx" ON "monthly_metrics" USING btree ("fiscal_year","month");