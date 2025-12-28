CREATE TABLE "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(42) NOT NULL,
	"display_name" varchar(42) NOT NULL,
	"hashed_password" varchar(256) NOT NULL,
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
