import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import { Server } from 'socket.io';
import { get } from 'svelte/store';

const webSocketServer = {
	name: 'webSocketServer',
	configureServer(server: any) {
		if (!server.httpServer) return;

		const io = new Server(server.httpServer, {
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
		});

		// Make io globally available
		(global as any).io = io;
	}
}

export default defineConfig({
	plugins: [sveltekit(), webSocketServer],
	test: {
		expect: { requireAssertions: true },

		projects: [
			{
				extends: './vite.config.ts',

				test: {
					name: 'client',

					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},

					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',

				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
