import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';

export const generateSessionToken = (user: any): string => {
    console.log('generating token for user:', user);
    const secret = env.JWT_SECRET;
    return jwt.sign({ id: user.id, username: user.username, displayName: user.displayName }, secret, { expiresIn: '30d' });
}