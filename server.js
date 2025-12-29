import { createServer } from 'http';
import { Server } from 'socket.io';
import { handler } from './build/handler.js';
import express from 'express';

const port = process.env.PORT || 3000;
const app = express();
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
    console.log('a user connected:', socket.id);

    socket.on('message', (msg) => {
        console.log('message received:', msg);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected:', socket.id);
    });
});

// Make io globally available (same as dev setup)
global.io = io;

// Let SvelteKit handle everything else
app.use(handler);

server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
