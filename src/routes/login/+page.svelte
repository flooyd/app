<script lang="ts">
	import { user, page } from '$lib/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';

	let loginOrRegister = $state<'login' | 'register'>('login');
	let username = $state('');
	let password = $state('');
	let displayName = $state('');
	let ready = $state<boolean>(false);

	$page = 'login';

	const handleLogin = async () => {
		const body =
			loginOrRegister === 'login' ? { username, password } : { username, password, displayName };

		try {
			const res = await fetch(`/api/auth/${loginOrRegister}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(body)
			});

			if (res.ok) {
				const data = await res.json();
				$user = data.user;
				goto('/');
			} else {
				alert(`${loginOrRegister === 'login' ? 'Login' : 'Registration'} failed.`);
			}
		} catch (error) {
			console.error('Error:', error);
			alert('An error occurred. Check the console.');
		}
	};

	onMount(() => {
		ready = true;
	});
</script>

{#if ready}
	<div class='login-container' transition:fly={{ x: -1000, duration: 150 }}>
		{#if loginOrRegister === 'login'}
			<h1>Login</h1>
			<form onsubmit={handleLogin}>
				<label for="username">Username:</label>
				<input type="text" id="username" name="username" bind:value={username} required />

				<label for="password">Password:</label>
				<input type="password" id="password" name="password" bind:value={password} required />

				<button type="submit"><h3>Login</h3></button>
			</form>
			<p>
				Don't have an account?
				<button type="button" onclick={() => (loginOrRegister = 'register')}>Register here.</button>
			</p>
		{:else}
			<h1>Register</h1>
			<form onsubmit={handleLogin}>
				<label for="username">Username:</label>
				<input type="text" id="username" name="username" bind:value={username} required />

				<label for="displayName">Display Name:</label>
				<input type="text" id="displayName" name="displayName" bind:value={displayName} required />

				<label for="password">Password:</label>
				<input type="password" id="password" name="password" bind:value={password} required />

				<button type="submit"><h3>Register</h3></button>
			</form>
			<p>
				Already have an account?
				<button type="button" onclick={() => (loginOrRegister = 'login')}>Login here.</button>
			</p>
		{/if}
	</div>
{/if}

<style>

	.login-container {
		padding: 20px;
	}
	
	h1 {
		margin-bottom: 8px;
		width: fit-content;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 8px;
		max-width: 300px;
		border: 3px solid brown;
		padding: 8px;
	}

	input {
		padding: 8px;
		font-size: 14px;
	}

	p {
		margin-top: 8px;
	}
</style>
