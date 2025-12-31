import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { comment, topic, user, commentRead } from '$lib/server/db/schema';
import { eq, asc, and, inArray } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, locals }) => {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const topicId = parseInt(params.id || '0', 10);
        if (isNaN(topicId) || topicId <= 0) {
            return json({ error: 'Invalid topic ID' }, { status: 400 });
        }

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
        
        let readCommentIds: number[] = [];
        if (locals.user) {
            const commentIds = comments.map(c => c.id);
            if (commentIds.length > 0) {
                const readComments = await db
                    .select({ commentId: commentRead.commentId })
                    .from(commentRead)
                    .where(and(
                        eq(commentRead.userId, locals.user.id),
                        inArray(commentRead.commentId, commentIds)
                    ));
                readCommentIds = readComments.map(r => r.commentId);
            }
        }

        // Add isRead flag to each comment
        const commentsWithReadStatus = comments.map(c => ({
            ...c,
            isRead: readCommentIds.includes(c.id),
        }));

        return json({ topic: topics[0], comments: commentsWithReadStatus });
    } catch (error) {
        console.log(error);
        return json({ error: 'Server error' }, { status: 500 });
    }
};
