import type { Handle } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';

export const handle: Handle = async ({ event, resolve }) => {
    const sessionToken = event.cookies.get('session');
    console.log('Hooks.server.ts - Session token:', sessionToken);
    console.log('Hooks.server.ts - All cookies:', event.request.headers.get('cookie'));

    if (sessionToken) {
        try {
            const userToken = await verifySessionToken(sessionToken);
            console.log('Hooks.server.ts - Verified token:', userToken);

            if (userToken) {
                const userData = await db
                    .select()
                    .from(user)
                    .where(eq(user.id, userToken.id))
                    .limit(1);

                if (userData.length > 0) {
                    event.locals.user = userData[0];
                    console.log('Hooks.server.ts - User set to locals:', userData[0].username);
                }
            }
        } catch (error) {
            console.error('Session verification failed:', error);
        }
    }

    return resolve(event);
};

async function verifySessionToken(token: string): Promise<{ id: number; username: string; displayName: string; hashedPassword: string; avatar: string | null } | null> {
    try {
        const secret = env.JWT_SECRET;
        const decoded = jwt.verify(token, secret) as { id: number; username: string; displayName: string; hashedPassword: string; avatar: string | null };
        return decoded;
    } catch (error) {
        console.error('Session verification failed:', error);
        return null;
    }
}