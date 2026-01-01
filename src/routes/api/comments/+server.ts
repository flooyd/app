import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { comment, commentRead, topic } from '$lib/server/db/schema';
import { eq, desc} from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { content, topicId } = await request.json();
        if (!content || !topicId) {
            return json({ error: 'Comment content and topic ID are required' }, { status: 400 });
        }

        // Insert new comment
        const newComments = await db
            .insert(comment)
            .values({
                content: content,
                topicId: topicId,
                createdBy: locals.user.id,
                createdAt: Date.now(),
            })
            .returning();

        const emittedComment = { ...newComments[0], createdBy: locals.user.displayName, avatar: locals.user.avatar };
        global.io?.emit('newComment', { comment: emittedComment });

        // Notify topic activity so other clients can reorder topics by last activity
        global.io?.emit('topicActivity', { topicId: newComments[0].topicId, lastActivity: newComments[0].createdAt });

        return json({ comment: newComments[0] });
    } catch (error) {
        console.error('Error creating comment:', error);
        return json({ error: 'Failed to create comment' }, { status: 500 });
    }
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { commentId } = await request.json();

        if (!commentId) {
            return json({ error: 'Comment ID is required' }, { status: 400 });
        }

        //select the comment to verify ownership
        const existingComment = await db
            .select()
            .from(comment)
            .where(eq(comment.id, commentId))
            .limit(1);

        if (existingComment.length === 0) {
            return json({ error: 'Comment not found' }, { status: 404 });
        }

        if (existingComment[0].createdBy !== locals.user.id) {
            return json({ error: 'Forbidden' }, { status: 403 });
        }

        //fetch the topic and set lastActivity to the latest comment's createdAt if needed. order by comment createdAt desc limit 1
        const commentsToDelete = await db
            .select()
            .from(comment)
            .where(eq(comment.id, commentId))
            .limit(1);
            
        const topicToFind = await db
            .select()
            .from(topic)
            .where(eq(topic.id, commentsToDelete[0].topicId))
            .limit(1);


        // Delete all commentRead entries first (foreign key constraint)
        await db
            .delete(commentRead)
            .where(eq(commentRead.commentId, commentId));

        await db
            .delete(comment)
            .where(eq(comment.id, commentId));

         const latestComment = await db
            .select()
            .from(comment)
            .where(eq(comment.topicId, topicToFind[0].id))
            .orderBy(desc(comment.createdAt))
            .limit(1);

        global.io?.emit('topicActivity', { topicId: topicToFind[0].id, lastActivity: latestComment.length > 0 ? latestComment[0].createdAt : topicToFind[0].createdAt });

        global.io?.emit('deleteComment', { commentId, topicId: existingComment[0].topicId });
        return json({ success: true });
    } catch (error) {
        console.error('Error deleting comment:', error);
        return json({ error: 'Failed to delete comment' }, { status: 500 });
    }
};

