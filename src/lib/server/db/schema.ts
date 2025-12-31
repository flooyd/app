import { pgTable, serial, integer, varchar, bigint, unique } from 'drizzle-orm/pg-core';

export const user = pgTable('user',
    {
        id: serial('id').primaryKey(),
        username: varchar('username', { length: 42, }).notNull().unique(),
        displayName: varchar('display_name', { length: 42 }).notNull(),
        hashedPassword: varchar('hashed_password', { length: 256 }).notNull(),
        avatar: varchar('avatar', { length: 1000 }),
    });

export const topic = pgTable('topic',
    {
        id: serial('id').primaryKey(),
        title: varchar('title', { length: 100 }).notNull(),
        createdBy: integer('created_by').notNull().references(() => user.id),
        createdAt: bigint('created_at', { mode: 'number' }).notNull(),
    });

export const favorite = pgTable('favorite',
    {
        id: serial('id').primaryKey(),
        userId: integer('user_id').notNull().references(() => user.id),
        topicId: integer('topic_id').notNull().references(() => topic.id),
        favoritedAt: bigint('favorited_at', { mode: 'number' }).notNull(),
    },
    (table) => ({
        uniqueUserTopic: unique().on(table.userId, table.topicId),
    })
);

export const comment = pgTable('comment',
    {
        id: serial('id').primaryKey(),
        topicId: integer('topic_id').notNull().references(() => topic.id),
        content: varchar('content').notNull(),
        createdBy: integer('created_by').notNull().references(() => user.id),
        createdAt: bigint('created_at', { mode: 'number' }).notNull(),
    });

export const commentRead = pgTable('comment_read',
    {
        id: serial('id').primaryKey(),
        userId: integer('user_id').notNull().references(() => user.id),
        commentId: integer('comment_id').notNull().references(() => comment.id),
        readAt: bigint('read_at', { mode: 'number' }).notNull(),
    },
    (table) => ({
        uniqueUserComment: unique().on(table.userId, table.commentId),
    })
);

