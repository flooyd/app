<script lang="ts">
	import { goto } from '$app/navigation';
	import { page, user } from '$lib/stores';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	$page = 'create-topic';

	let title = $state<string>('');
	let comment = $state<string>('');
	let ready = $state<boolean>(false);
    let loading = $state<boolean>(false);

	const handleSubmit = async (event: Event) => {
		event.preventDefault();
        loading = true;
		const response = await fetch('/api/topics', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ title, commentText: comment })
		});
		if (response.ok) {
			goto('/');
		} else {
			alert('Failed to create topic');
		}

        loading = false;
	};

	onMount(() => {
		ready = true;
	});
</script>

<svelte:head>
	<title>Create Topic</title>
	<meta name="description" content="Create a new topic" />
</svelte:head>

{#if ready}
	<div class='create-topic-container' transition:fade>
		{#if $user}
			<h1>Create a New Topic</h1>
			<form onsubmit={(event) => handleSubmit(event)}>
				<label for="title">Topic Title:</label>
				<input bind:value={title} type="text" id="title" name="title" required />
				<label for="comment">Initial Comment:</label>
				<textarea bind:value={comment} id="comment" name="comment" required></textarea>
				<button type="submit">Create Topic</button>
			</form>
		{:else}
			<p>Please <button disabled={loading} onclick={() => goto('/login')}>login</button> to create a new topic.</p>
		{/if}
	</div>
{/if}

<style>
	.create-topic-container {
		padding: 8px;
	}
	
	h1 {
		margin-bottom: 8px;
	}

	form {
		display: flex;
		flex-direction: column;
		max-width: 600px;
		gap: 8px;
	}
</style>
