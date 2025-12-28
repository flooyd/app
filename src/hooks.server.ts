import type { Handle } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

export const handle: Handle = async ({ event, resolve }) => {
    const sessionToken = event.cookies.get('session');
    console.log('handle', sessionToken);
    if (sessionToken) {
        try {
            const userToken = await verifySessionToken(sessionToken);

            if (userToken) {
                const userData = await db
                    .select()
                    .from(user)
                    .where(eq(user.id, userToken.id))
                    .limit(1);

                if (userData.length > 0) {
                    event.locals.user = userData[0];
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
        const decoded = jwt.verify(token, 'your_secret_key') as { id: number; username: string; displayName: string; hashedPassword: string; avatar: string | null };
        return decoded;
    } catch (error) {
        console.error('Session verification failed:', error);
        return null;
    }
}