CREATE TABLE "setup_examples" (
	"id" serial PRIMARY KEY NOT NULL,
	"setup_id" integer NOT NULL,
	"image_path" text,
	"description" text DEFAULT '' NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"search" "tsvector" GENERATED ALWAYS AS (to_tsvector('simple', description)) STORED,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "setups" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "setups_title_unique" UNIQUE("title")
);
--> statement-breakpoint
ALTER TABLE "setup_examples" ADD CONSTRAINT "setup_examples_setup_id_setups_id_fk" FOREIGN KEY ("setup_id") REFERENCES "public"."setups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "setup_examples_setup_idx" ON "setup_examples" USING btree ("setup_id");--> statement-breakpoint
CREATE INDEX "setup_examples_tags_gin" ON "setup_examples" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "setup_examples_search_gin" ON "setup_examples" USING gin ("search");