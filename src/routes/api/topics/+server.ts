import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { topic, user, comment, commentRead } from '$lib/server/db/schema';
import { eq, desc, count, sql, and, isNull } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
    try {
        const topics = await db
            .select({
                id: topic.id,
                title: topic.title,
                createdBy: user.displayName,
                createdAt: topic.createdAt,
                avatar: user.avatar,
            })
            .from(topic)
            .leftJoin(user, eq(topic.createdBy, user.id))
            .orderBy(desc(topic.createdAt));

        // Fetch comment counts AND unread counts in a single query
        // Uses LEFT JOIN on commentRead to find which comments the user has read
        const userId = locals.user?.id ?? null;

        const commentStats = await db
            .select({
                topicId: comment.topicId,
                commentCount: count(comment.id),
                unreadCount: userId
                    ? sql<number>`SUM(CASE WHEN ${commentRead.commentId} IS NULL THEN 1 ELSE 0 END)`
                    : sql<number>`0`,
            })
            .from(comment)
            .leftJoin(
                commentRead,
                userId
                    ? and(eq(commentRead.commentId, comment.id), eq(commentRead.userId, userId))
                    : sql`FALSE`
            )
            .groupBy(comment.topicId);

        // Transform to the format expected by the frontend
        const comments = commentStats.map(s => ({ topicId: s.topicId, count: s.commentCount }));
        const unreadCounts = commentStats.map(s => ({ topicId: s.topicId, count: Number(s.unreadCount) }));

        return json({ topics, comments, unreadCounts });
    } catch (error) {
        console.error('Error fetching topics:', error);
        return json({ error: 'Failed to fetch topics' }, { status: 500 });
    }
};

export const POST: RequestHandler = async ({ request, locals }) => {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { title, commentText } = await request.json();
        if (!title) {
            return json({ error: 'Topic title is required' }, { status: 400 });
        }

        // Insert new topic
        const newTopic = await db
            .insert(topic)
            .values({
                title,
                createdBy: locals.user.id,
                createdAt: Date.now()
            })
            .returning();

        if (!newTopic || newTopic.length === 0) {
            return json({ error: 'Failed to create topic' }, { status: 500 });
        }

        console.log(commentText);

        // Insert new comment
        const newComment = await db
            .insert(comment)
            .values({
                topicId: newTopic[0].id,
                content: commentText,
                createdBy: locals.user.id,
                createdAt: Date.now(),
            })
            .returning();

        if (global.io) {
            console.log('blah blah blah')
            global.io.emit('newTopic', { topic: { ...newTopic[0], createdBy: locals.user.displayName }, comment: newComment[0] });
        }

        return json({ topic: newTopic[0], comment: newComment[0] });
    } catch (error) {
        console.error('Error creating topic:', error);
        return json({ error: 'Failed to create topic' }, { status: 500 });
    }
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await request.json();
        console.log('id', id);

        if (!id) {
            return json({ error: 'Topic ID is required' }, { status: 400 });
        }

        const topicsToDelete = await db
            .select()
            .from(topic)
            .where(eq(topic.id, id))
            .limit(1);

        if (topicsToDelete.length === 0) {
            return json({ error: 'Topic not found' }, { status: 404 });
        }

        if (topicsToDelete[0].createdBy !== locals.user.id) {
            return json({ error: 'Forbidden' }, { status: 403 });
        }

        //delete commendRead entries associated with comments of the topic
        const commentsToDelete = await db
            .select()
            .from(comment)
            .where(eq(comment.topicId, id));

        for (const comm of commentsToDelete) {
            await db.delete(commentRead).where(eq(commentRead.commentId, comm.id));
        }

        //delete comments associated with the topic

        await db.delete(comment).where(eq(comment.topicId, id));

        await db.delete(topic).where(eq(topic.id, id));

        if (global.io) {
            global.io.emit('deleteTopic', { id });
        }

        return json({ message: 'Topic deleted successfully' });
    } catch (error) {
        console.error('Error deleting topic:', error);
        return json({ error: 'Failed to delete topic' }, { status: 500 });
    }
};