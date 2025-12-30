<script lang="ts">
	import CommentFooter from '$lib/components/CommentFooter.svelte';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { topicComments, user } from '$lib/stores/index';
	import { getSocket } from '$lib/stores/socket';

	let props = $props();
	let { id } = props.params;
	let topicDetails = $state<any>(null);
	let ready = $state<boolean>(false);

	// Track comments pending to be marked as read (for debouncing)
	let pendingReadIds = $state<Set<number>>(new Set());
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	// Intersection Observer instance (module scope so we can observe new comments)
	let observer: IntersectionObserver | null = null;

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

	const markCommentsAsRead = async (commentIds: number[]) => {
		if (commentIds.length === 0 || !$user) return;

		try {
			await fetch('/api/comments/read', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ commentIds })
			});

			// Update local state to mark comments as read
			$topicComments = $topicComments.map((c) =>
				commentIds.includes(c.id) ? { ...c, isRead: true } : c
			);
		} catch (error) {
			console.error('Error marking comments as read:', error);
		}
	};

	const flushPendingReads = () => {
		if (pendingReadIds.size > 0) {
			const ids = Array.from(pendingReadIds);
			pendingReadIds = new Set();
			markCommentsAsRead(ids);
		}
	};

	const queueCommentAsRead = (commentId: number) => {
		pendingReadIds = new Set([...pendingReadIds, commentId]);

		// Debounce: wait 500ms before sending to batch multiple reads
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(flushPendingReads, 500);
	};

	const observeNewComment = (commentId: number) => {
		if (!observer) return;

		// Wait for DOM to update, then observe the new comment
		setTimeout(() => {
			const el = document.querySelector(`.comment[data-comment-id="${commentId}"]`);
			if (el && observer) {
				observer.observe(el);
			}
		}, 50);
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

			// Set up Intersection Observer after DOM is ready
			setTimeout(() => {
				observer = new IntersectionObserver(
					(entries) => {
						entries.forEach((entry) => {
							if (entry.isIntersecting) {
								const commentId = parseInt(entry.target.getAttribute('data-comment-id') || '0');
								const comment = $topicComments.find((c) => c.id === commentId);

								// Only mark as read if not already read
								if (comment && !comment.isRead) {
									queueCommentAsRead(commentId);
								}
								observer?.unobserve(entry.target);
							}
						});
					},
					{ threshold: 0.5 }
				);

				document.querySelectorAll('.comment[data-comment-id]').forEach((el) => {
					observer?.observe(el);
				});
			}, 100);
		});

		const socket = getSocket();

		if (socket) {
			socket.on('newComment', (data) => {
				console.log('newComment received:', data);
				if (data.createdBy === $user?.displayName) return;
				console.log('Adding new comment to list:', data);
				// New comments from others start as unread
				$topicComments = [...$topicComments, { ...data.comment, isRead: false }];
				// Observe the new comment for read tracking
				observeNewComment(data.comment.id);
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
			if (debounceTimer) clearTimeout(debounceTimer);
			if (observer) observer.disconnect();
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
	<div class="comments-container" transition:fade>
		<h1>{topicDetails?.title}</h1>
		{#if $topicComments.length > 0}
			<ul>
				{#each $topicComments as comment}
					<div class="comment" class:unread={!comment.isRead} data-comment-id={comment.id}>
						<p class="comment-content">{comment.content}</p>
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
		padding: 20px;
	}

	.comment {
		display: flex;
		flex-direction: column;
		gap: 8px;
		border: 1px solid brown;
		padding: 8px;
		margin-bottom: 8px;
		transition: border-left 0.2s ease;
	}

	.comment.unread {
		border-left: 4px solid lightgreen;
	}

	.comment-content {
		white-space: pre-wrap;
		word-wrap: break-word;
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
