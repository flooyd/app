<script lang="ts">
	import CommentFooter from '$lib/components/CommentFooter.svelte';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { topicComments, user } from '$lib/stores/index';
	import { getSocket } from '$lib/stores/socket';

	let props = $props();
	let { id } = props.params;
	let topicDetails = $state<any>(null);
	let ready = $state<boolean>(false);

	const fetchTopicDetails = async () => {
		const response = await fetch(`/api/topics/${id}`);
		if (response.ok) {
			const data = await response.json();
			topicDetails = data.topic;
			$topicComments = data.comments;
			console.log(data);
		} else {
			alert('Failed to fetch topic details');
		}
	};

	const handleDeleteComment = (commentId: number) => async () => {
		const response = await fetch(`/api/comments`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ commentId })
		});
		if (response.ok) {
			console.log('Comment deleted:', commentId);
		} else {
			alert('Failed to delete comment');
		}
	};

	onMount(() => {
		fetchTopicDetails().then(() => {
			ready = true;
		});

		const socket = getSocket();

		if (socket) {
			socket.on('newComment', (data) => {
				console.log('newComment received:', data);
				if (data.createdBy === $user?.displayName) return;
				console.log('Adding new comment to list:', data);
				$topicComments = [...$topicComments, data.comment];
			});

			socket.on('deleteComment', (data) => {
				console.log('deleteComment received:', data);
				$topicComments = $topicComments.filter((comment) => comment.id !== data.commentId);
			});
		}

		return () => {
			if (socket) {
				socket.off('newComment');
				socket.off('deleteComment');
			}
			$topicComments = [];
			topicDetails = null;
		};
	});
</script>

<svelte:head>
	<title>Topic Details</title>
	<meta name="description" content={topicDetails?.title} />
</svelte:head>

{#if ready}
	<div class="comments-container" transition:fly={{ x: -1000, duration: 150 }}>
		<h1>{topicDetails?.title}</h1>
		{#if $topicComments.length > 0}
			<ul>
				{#each $topicComments as comment}
					<div class="comment">
						<p>{comment.content}</p>
						<div class="comment-footer">
							<div>
								<span>By: <span class="comment-created-by">{comment.createdBy}</span></span>
								<img
									src={comment.avatar ||
										'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSMVruv2fzEJ-7rpjvgRqLsLBb98euBrF7_-g&s'}
									alt="User Avatar"
								/>
								at <span>{new Date(comment.createdAt).toLocaleString()}</span>
							</div>
							{#if $user?.username === comment.createdBy}
								<button onclick={handleDeleteComment(comment.id)}>Delete</button>
							{/if}
						</div>
					</div>
				{/each}
			</ul>
		{:else}
			<p>No comments yet.</p>
		{/if}
	</div>
	<CommentFooter />
{/if}

<style>
	h1 {
		margin-bottom: 8px;
	}

	.comments-container {
		height: calc(100vh - 102px);
		overflow-y: auto;
		padding: 8px;
	}

	.comment {
		display: flex;
		flex-direction: column;
		gap: 8px;
		border: 1px solid brown;
		padding: 8px;
		margin-bottom: 8px;
	}

	button {
		align-self: flex-end;
		padding: 8px;
		border: none;
		cursor: pointer;
		border: 3px solid brown;
	}

	.comment-footer {
		border-top: 1px solid brown;
		padding-top: 8px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 4px;
	}

	img {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		vertical-align: middle;
		margin-right: 8px;
	}
</style>
