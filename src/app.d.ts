import type { user } from '$lib/server/db/schema';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user?: typeof user.$inferSelect;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	var io: import('socket.io').Server | undefined;

}

export { };
