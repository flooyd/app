CREATE TABLE "comment_read" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"comment_id" integer NOT NULL,
	"read_at" bigint NOT NULL,
	CONSTRAINT "comment_read_user_id_comment_id_unique" UNIQUE("user_id","comment_id")
);
--> statement-breakpoint
ALTER TABLE "comment_read" ADD CONSTRAINT "comment_read_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_read" ADD CONSTRAINT "comment_read_comment_id_comment_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comment"("id") ON DELETE no action ON UPDATE no action;