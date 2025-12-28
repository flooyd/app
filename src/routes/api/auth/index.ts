import jwt from 'jsonwebtoken';

export const generateSessionToken = (user: any): string => {
    console.log('generating token for user:', user);
    return jwt.sign({ id: user.id, username: user.username, displayName: user.displayName }, 'your_secret_key', { expiresIn: '30d' });
}