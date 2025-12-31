import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user, favorite } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topicId } = await request.json();

    try {
        const results = await db.insert(favorite).values({
            userId: locals.user.id,
            topicId: topicId,
            favoritedAt: Date.now()
        }).returning();

        return json({ favorite: results[0] }, { status: 201 });

    } catch (error) {
        console.error('Error favoriting topic:', error);
        return json({ error: 'Failed to favorite topic' }, { status: 500 });
    }
};

export const GET: RequestHandler = async ({ locals }) => {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const favoritesList = await db.select().from(favorite).where(eq(favorite.userId, locals.user.id));
        return json({ favorites: favoritesList }, { status: 200 });
    } catch (error) {
        console.error('Error fetching favorites:', error);
        return json({ error: 'Failed to fetch favorites' }, { status: 500 });
    }
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topicId } = await request.json();

    try {
        const deleted = await db.delete(favorite)
            .where(
                and(
                    eq(favorite.userId, locals.user.id),
                    eq(favorite.topicId, topicId)
                )
            )
            .returning();

        if (deleted.length === 0) {
            return json({ error: 'Favorite not found' }, { status: 404 });
        }

        return json({ message: 'Favorite removed successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error removing favorite:', error);
        return json({ error: 'Failed to remove favorite' }, { status: 500 });
    }
};