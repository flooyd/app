<script lang="ts">
	import { goto } from '$app/navigation';
	import { user, page } from '$lib/stores';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	$page = 'profile';
	let ready = $state<boolean>(false);
	let editing = $state<boolean>(false);
	let username = $state<string>($user?.username ?? '');
	let displayName = $state<string>($user?.displayName ?? '');
	let avatar = $state<string>($user?.avatar ?? '');
	const initialUsername = username;
	const initialDisplayName = displayName;
	const initialAvatar = avatar;
	let dirty = $state<boolean>(false);

	const handleLogout = () => {
		$user = null;
		$page = 'login';
	};

	const handleEdit = () => {
		editing = !editing;
		if (!editing) {
			// Reset fields if cancelling edit
			username = initialUsername;
			displayName = initialDisplayName;
			avatar = initialAvatar;
		}
	};

	const handleSave = async () => {
		if (!$user) return;

		const response = await fetch('/api/profile', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ displayName, avatar })
		});

		if (response.ok) {
			$user = { ...$user, displayName, avatar };
			editing = false;
		} else {
			alert('Failed to update profile');
		}
	};

	onMount(() => {
		ready = true;
	});

	$effect(() => {
		dirty =
			username !== initialUsername ||
			displayName !== initialDisplayName ||
			avatar !== initialAvatar;
	});
</script>

{#if ready}
	<div class="profile-container" transition:fade={{duration: 250}}>
		{#if $user}
			<h1>Profile</h1>
			<button class='edit-button' type="button" onclick={handleEdit}>
				{#if editing}Cancel Edit{:else}Edit Profile{/if}
			</button>
			{#if dirty}
				<button class='edit-button' type="button" onclick={handleSave}>
					Save Changes
				</button>
			{/if}
			<div class="profile">
				<label for="username">Username:</label>
				<input id="username" type="text" value={$user.username} disabled/>
				<label for="displayName">Display Name:</label>
				<input id="displayName" type="text" bind:value={displayName} disabled={!editing} />
				<label for="avatar">Avatar URL:</label>
				<input id="avatar" type="text" bind:value={avatar} disabled={!editing} />
				<img
					src={$user.avatar ||
						'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSMVruv2fzEJ-7rpjvgRqLsLBb98euBrF7_-g&s'}
					alt="Avatar"
					width="100"
					height="100"
				/>
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

	.edit-button {
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
