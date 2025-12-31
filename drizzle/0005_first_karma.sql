CREATE TABLE "favorite" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"topic_id" integer NOT NULL,
	"favorited_at" bigint NOT NULL,
	CONSTRAINT "favorite_user_id_topic_id_unique" UNIQUE("user_id","topic_id")
);
--> statement-breakpoint
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_topic_id_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topic"("id") ON DELETE no action ON UPDATE no action;