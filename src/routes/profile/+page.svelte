<script lang="ts">
	import { goto } from '$app/navigation';
	import { user, page } from '$lib/stores';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';

	$page = 'profile';
    let ready = $state<boolean>(false);

	const handleLogout = () => {
		$user = null;
		$page = 'login';
	};

    onMount(() => {
        ready = true;
    });
</script>

{#if ready}
	<div class='profile-container' transition:fly={{ x: -1000, duration: 150 }}>
		{#if $user}
			<h1>Profile</h1>
			<div class="profile">
				<label for="username">Username:</label>
				<input id="username" type="text" value={$user.username} disabled />
				<label for="displayName">Display Name:</label>
				<input id="displayName" type="text" value={$user.displayName} disabled />
				<button type="button" onclick={handleLogout}><h3>Logout</h3></button>
			</div>
		{:else}
			<h1>Please <button onclick={() => goto('/login')}>login</button> to view your profile.</h1>
		{/if}
	</div>
{/if}

<style>
	.profile-container {
		padding: 20px;
	}
	h1 {
		margin-bottom: 8px;
	}
	.profile {
		display: flex;
		flex-direction: column;
		gap: 8px;
		max-width: 300px;
		border: 3px solid brown;
		padding: 8px;
	}

	.profile input:disabled {
		background: none;
		border: none;
		color: white;
	}
</style>
