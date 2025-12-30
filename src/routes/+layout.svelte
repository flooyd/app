<script lang="ts">
	import { user, page } from '$lib/stores';
	import { getSocket, initSocket, disconnectSocket } from '$lib/stores/socket';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	let { children, data } = $props();
	let ready = $state<boolean>(false);

	initSocket();
	const socket = getSocket();

	if (socket) {
		socket.emit('message', 'Hello from layout!');
	}

	$effect(() => {
		if (data?.user) {
			$user = data.user;
		} else {
			$user = null;
		}
	});

	onMount(() => {
		ready = true;
	});
</script>

{#if ready}
	<nav transition:fade>
		<a href="/"><h2>App</h2></a>
		{#if $user}
			<a href="/profile" style={$page === 'profile' ? 'color: lightgreen;' : ''}
				><h3>{$user.displayName}</h3></a
			>
		{:else}
			<a href="/login" style={$page === 'login' ? 'color: lightgreen;' : ''}><h3>Login</h3></a>
		{/if}
	</nav>

	<section class="app">
		{@render children()}
	</section>
{/if}

<style>
	:global(*) {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
		font-family: 'Roboto', sans-serif;
		font-size: 13.33px;
	}

	:global(h1) {
		font-size: 23.04px;
		color: brown;
	}

	:global(h2) {
		font-size: 19.2px;
	}

	:global(h3) {
		font-size: 16px;
	}

	:global(h1, h2, h3) {
		font-weight: 700;
		font-family: 'Nunito', sans-serif;
	}

	:global(button) {
		background: white;
		padding: 8px;
		border: none;
		cursor: pointer;
		border: 3px solid brown;
		border-radius: 8px;
	}

	:global(button:hover) {
		background: brown;
		color: white;
	}

	:global(label) {
		font-weight: bold;
	}

	:global(.flex-section) {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	:global(input, textarea) {
		padding: 8px;
		border: 1px solid brown;
	}

	nav {
		display: flex;
		gap: 20px;
		justify-content: space-between;
		width: 100%;
		padding: 8px 20px;
		background: black;
		color: white;
		border-bottom: 3px solid lightgreen;
	}

	:global(a) {
		text-decoration: none;
		color: white;
		font-weight: 700;
	}

	:global(a:hover) {
		color: lightgreen;
	}

	nav a {
		font-size: 19.2px;
		color: white;
	}
	.app {
		height: calc(100vh - 46px);
		background: black;
		color: white;
	}
</style>
