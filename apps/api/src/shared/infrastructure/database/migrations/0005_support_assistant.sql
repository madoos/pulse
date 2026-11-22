CREATE SCHEMA "assistant";
--> statement-breakpoint
CREATE TABLE "assistant"."conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assistant"."messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"question" text NOT NULL,
	"question_embedding" vector(384) NOT NULL,
	"answer" text,
	"outcome" text NOT NULL,
	"enough_information" boolean NOT NULL,
	"sources" text[] NOT NULL,
	"model" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assistant"."steps" (
	"message_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"kind" text NOT NULL,
	"detail" jsonb NOT NULL,
	CONSTRAINT "steps_message_id_position_pk" PRIMARY KEY("message_id","position")
);
--> statement-breakpoint
CREATE TABLE "support_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"firm_id" integer NOT NULL,
	"date" date NOT NULL,
	"type" text NOT NULL,
	"category" text NOT NULL,
	"priority" text NOT NULL,
	"status" text NOT NULL,
	"title" text NOT NULL,
	"text" text NOT NULL,
	"tags" text[] NOT NULL,
	"content_hash" text NOT NULL,
	"embedding" vector(384) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assistant"."conversations" ADD CONSTRAINT "conversations_firm_id_advisory_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."advisory_firms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant"."conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant"."messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "assistant"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant"."steps" ADD CONSTRAINT "steps_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "assistant"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_documents" ADD CONSTRAINT "support_documents_firm_id_advisory_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."advisory_firms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "messages_conversation_id_idx" ON "assistant"."messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "support_documents_firm_id_date_idx" ON "support_documents" USING btree ("firm_id","date");