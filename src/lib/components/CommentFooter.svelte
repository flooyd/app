<script lang="ts">
	import { user, topicComments } from '$lib/stores';

	let loading = $state<boolean>(false);
	let commentContent = $state<string>('');

	const handlePostComment = async () => {
		console.log('Posting comment:', commentContent);
		loading = true;
		try {
			const response = await fetch('/api/comments', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					content: commentContent,
					topicId: window.location.pathname.split('/')[2]
				})
			});

			if (response.ok) {
				commentContent = '';
				//the new comment will be added via the socket event in routes/topics/[id]/+page.svelte
			} else {
				alert('Failed to post comment');
			}
		} catch (error) {
			console.error('Error posting comment:', error);
			alert('An error occurred while posting the comment');
		} finally {
			loading = false;
		}
	};
</script>

<div class="comment-footer">
	<textarea disabled={loading} bind:value={commentContent}></textarea>
	<button disabled={loading || commentContent.trim() === ''} onclick={handlePostComment}
		>Post</button
	>
	<button disabled={loading}>Editor</button>
</div>

<style>
	.comment-footer {
		position: fixed;
		padding: 8px;
		bottom: 0;
		left: 0;
		width: 100%;
		display: flex;
		align-items: center;
		gap: 8px;
		border-top: 3px solid lightgreen;
		background: black;
		z-index: 10;
	}

	.comment-footer textarea {
		flex: 1;
		padding: 4px;
		display: flex;
		border: 1px solid brown;
		resize: none;
		height: 38px;
	}
</style>
