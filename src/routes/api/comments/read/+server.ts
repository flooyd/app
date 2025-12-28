import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { commentRead } from '$lib/server/db/schema';

export const POST: RequestHandler = async ({ request, locals }) => {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { commentIds } = await request.json();

        if (!commentIds || !Array.isArray(commentIds) || commentIds.length === 0) {
            return json({ error: 'Comment IDs array is required' }, { status: 400 });
        }

        // Mark each comment as read (ignore duplicates)
        const now = Date.now();
        const values = commentIds.map((commentId: number) => ({
            userId: locals.user!.id,
            commentId,
            readAt: now,
        }));

        await db
            .insert(commentRead)
            .values(values)
            .onConflictDoNothing();

        return json({ success: true });
    } catch (error) {
        console.error('Error marking comments as read:', error);
        return json({ error: 'Failed to mark comments as read' }, { status: 500 });
    }
};
