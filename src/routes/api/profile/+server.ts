import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const PUT: RequestHandler = async ({ request, locals }) => {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { displayName, avatar } = await request.json();
        if (!displayName) {
            return json({ error: 'Display name is required' }, { status: 400 });
        }
        // Update user profile
        const updatedUsers = await db
            .update(user)
            .set({
                displayName: displayName,
                avatar: avatar,
            })
            .where(eq(user.id, locals.user.id))
            .returning();

        if (updatedUsers.length === 0) {
            return json({ error: 'Failed to update profile' }, { status: 500 });
        }

        return json({ user: updatedUsers[0] });
    } catch (error) {
        console.error('Error updating profile:', error);
        return json({ error: 'Failed to update profile' }, { status: 500 });
    }
};