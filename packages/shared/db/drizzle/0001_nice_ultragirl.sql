CREATE TABLE "categorization_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"pattern" text NOT NULL,
	"match_type" text DEFAULT 'contains' NOT NULL,
	"match_field" text DEFAULT 'any' NOT NULL,
	"category_id" text NOT NULL,
	"priority" integer DEFAULT 100 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"is_built_in" boolean DEFAULT false NOT NULL,
	"times_applied" integer DEFAULT 0 NOT NULL,
	"last_applied_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categorization_rules" ADD CONSTRAINT "categorization_rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categorization_rules" ADD CONSTRAINT "categorization_rules_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categorization_rules_user_id_idx" ON "categorization_rules" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "categorization_rules_category_id_idx" ON "categorization_rules" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "categorization_rules_priority_idx" ON "categorization_rules" USING btree ("priority");