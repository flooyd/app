import {writable} from 'svelte/store';
import {io, Socket} from 'socket.io-client';
import { browser } from '$app/environment';

let socket: Socket | null = null;

export const getSocket = () => {
    return socket;
}

export const initSocket = () => {
    if(!browser) return;

    if(socket) {
        socket.disconnect();
    }

    socket = io();

    socket.on('connect', () => {
        console.log('Connected to WebSocket server with ID:', socket?.id);
    });
}

export const disconnectSocket = () => {
    if(socket) {
        socket.disconnect();
        socket = null;
    }
}