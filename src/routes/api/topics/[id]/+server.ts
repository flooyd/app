import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { comment, topic, user } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
    try {
        const topicId = parseInt(params.id || '0', 10);
        if (isNaN(topicId) || topicId <= 0) {
            return json({ error: 'Invalid topic ID' }, { status: 400 });
        }
        
        //get tpoic and comments
        const topics = await db
            .select()
            .from(topic)
            .where(eq(topic.id, topicId))

        const comments = await db
            .select({
                id: comment.id,
                content: comment.content,
                createdBy: user.username,
                createdAt: comment.createdAt,
                avatar: user.avatar,
            })
            .from(comment)
            .leftJoin(user, eq(comment.createdBy, user.id))
            .where(eq(comment.topicId, topicId))
            .orderBy(asc(comment.createdAt));

        if (topics.length === 0) {
            return json({ error: 'Topic not found' }, { status: 404 });
        }

        return json({ topic: topics[0], comments });
    } catch (error) {
        console.log(error);
        return json({ error: 'Server error' }, { status: 500 });
    }
};