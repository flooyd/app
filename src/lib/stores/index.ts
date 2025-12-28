import { writable } from 'svelte/store';

export const user = writable<
    {
        id: number;
        username: string;
        displayName: string;
    } | null>(null);

export const page = writable<string>('home');

export const topics = writable<Array<{
    commentCount: any;
    id: number;
    title: string;
    createdBy: string;
    createdAt: Date;
    avatar: string | null;
}>>([]);

export const topicComments = writable<Array<{
    id: number;
    content: string;
    createdBy: string;
    createdAt: Date;
    avatar: string | null;
    isRead?: boolean;
}>>([])