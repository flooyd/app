import jwt from 'jsonwebtoken';

export const generateSessionToken = (user: any): string => {
    console.log('generating token for user:', user);
    const secret = process.env.JWT_SECRET || 'your_secret_key';
    return jwt.sign({ id: user.id, username: user.username, displayName: user.displayName }, secret, { expiresIn: '30d' });
}