import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { comment, commentRead } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

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

        global.io?.emit('newComment', { comment: { ...newComments[0], createdBy: locals.user.displayName, avatar: locals.user.avatar } });

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

        // Delete all commentRead entries first (foreign key constraint)
        await db
            .delete(commentRead)
            .where(eq(commentRead.commentId, commentId));

        await db
            .delete(comment)
            .where(eq(comment.id, commentId));

        global.io?.emit('deleteComment', { commentId });
        return json({ success: true });
    } catch (error) {
        console.error('Error deleting comment:', error);
        return json({ error: 'Failed to delete comment' }, { status: 500 });
    }
};

