import { writable } from 'svelte/store';

export const user = writable<
    {
        id: number;
        username: string;
        displayName: string;
        avatar: string | null;
    } | null>(null);

export const page = writable<string>('home');

export interface Topic {
    commentCount: any;
    unreadCount: number;
    id: number;
    title: string;
    createdBy: string;
    createdAt: Date;
    avatar: string | null;
}

export const topics = writable<Array<Topic>>([]);

export const topicComments = writable<Array<{
    id: number;
    content: string;
    createdBy: string;
    createdAt: Date;
    avatar: string | null;
    isRead?: boolean;
}>>([])

export interface Favorite {
    id: number;
    userId: number;
    topicId: number;
    favoritedAt: Date;
}

export const favorites = writable<Array<Favorite>>([]);