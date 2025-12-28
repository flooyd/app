import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { username, displayName, password } = await request.json();

        if (!username || !displayName || !password) {
            return json({ error: 'Username, display name, and password are required' }, { status: 400 });
        }

        const existingUser = await db.select().from(user).where(eq(user.username, username)).limit(1);

        if (existingUser.length > 0) {
            return json({ error: 'Username already taken' }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const result = await db.insert(user).values({
            username,
            displayName,
            hashedPassword
        }).returning({ id: user.id, username: user.username, displayName: user.displayName });

        return json({ message: 'Registration successful', user: result[0] });
    } catch (error) {
        return json({ error: 'Invalid request body' }, { status: 400 });
    }
};