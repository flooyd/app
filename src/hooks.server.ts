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
                let userData = [];
                let retries = 3;
                while (retries > 0 && userData.length === 0) {
                    try {
                        userData = await db
                            .select()
                            .from(user)
                            .where(eq(user.id, userToken.id))
                            .limit(1);

                        if (userData.length > 0) {
                            event.locals.user = userData[0];
                            console.log('Hooks.server.ts - User set to locals:', userData[0].username);
                            break;
                        } else {
                            console.log(`Hooks.server.ts - User lookup returned empty. Retries left: ${retries}`);
                        }
                    } catch (err) {
                        console.error(`Hooks.server.ts - DB Error (Retry ${4 - retries}):`, err);
                    }

                    retries--;
                    if (retries > 0 && userData.length === 0) {
                        await new Promise(r => setTimeout(r, 500)); // Wait 500ms before retry
                    }
                }

                if (!event.locals.user) {
                    console.error('Hooks.server.ts - Failed to load user after retries. Token was valid:', userToken.id);
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