import { createServer } from 'http';
import { Server } from 'socket.io';
import { handler } from './build/handler.js';
import express from 'express';

const port = process.env.PORT || 3000;
const app = express();
const server = createServer(app);

// Initialize Socket.IO with proper CORS and credentials
const origin = process.env.ORIGIN || 'http://localhost:5173';
const io = new Server(server, {
    cors: {
        origin: origin,
        methods: ['GET', 'POST'],
        credentials: true,
        allowedHeaders: ['Content-Type']
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

// Parse request bodies and set trust proxy
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', true);

// Let SvelteKit handle everything else
app.use(handler);

server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
