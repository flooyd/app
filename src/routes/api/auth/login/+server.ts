import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { generateSessionToken } from '..';

export const POST: RequestHandler = async ({ request, cookies }) => {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return json({ error: 'Username and password are required' }, { status: 400 });
        }

        const existingUsers = await db.select().from(user).where(eq(user.username, username)).limit(1);

        if (existingUsers.length === 0) {
            return json({ error: 'Invalid username or password' }, { status: 401 });
        }

        const passwordMatch = await bcrypt.compare(password, existingUsers[0].hashedPassword);

        if (!passwordMatch) {
            return json({ error: 'Invalid username or password' }, { status: 401 });
        }

        const sesionToken = generateSessionToken(existingUsers[0]);

        cookies.set('session', sesionToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30,
            path: '/',
        });

        cookies.set('user', JSON.stringify(existingUsers[0]), {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30,
            path: '/',
        })

        return json({ message: 'Login successful', user: { id: existingUsers[0].id, username: existingUsers[0].username, displayName: existingUsers[0].displayName } });
    } catch (error) {
        console.log(error);
        return json({ error: 'Invalid request body' }, { status: 400 });
    }
};