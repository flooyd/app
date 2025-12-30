<script lang="ts">
	import { goto } from '$app/navigation';
	import { user, page, topics } from '$lib/stores';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { getSocket } from '$lib/stores/socket';
	import MoveUp from '@lucide/svelte/icons/move-up';
	import MoveDown from '@lucide/svelte/icons/move-down';
	import type { Topic } from '$lib/stores';

	$page = 'home';

	let showAvatars = $state<boolean>(true);
	let ready = $state<boolean>(false);
	let showSettings = $state<boolean>(false);
	let cellPadding = $state<number>(8);
	let cellAlign = $state<string>('left');
	let sortColumn = $state<string>('');
	let sortDirection = $state<string>('asc');
	let cardView = $state<boolean>(false);

	const handleColumnSort = (columnName: string) => {
		const column = columnName.replace(' ', '').toLowerCase();
		if (sortColumn === column) {
			if (sortDirection === 'asc') {
				sortDirection = 'desc';
			} else {
				sortColumn = '';
				sortDirection = 'desc';
			}
		} else {
			sortColumn = column;
			sortDirection = 'asc';
		}

		sortTopics();
	};

	const sortTopics = () => {
		$topics.sort((a: Topic, b: Topic) => {
			let aValue: any;
			let bValue: any;

			switch (sortColumn) {
				case 'title':
					aValue = a.title.toLowerCase();
					bValue = b.title.toLowerCase();
					break;
				case 'createdby':
					aValue = a.createdBy.toLowerCase();
					bValue = b.createdBy.toLowerCase();
					break;
				case 'comments':
					aValue = a.commentCount || 0;
					bValue = b.commentCount || 0;
					break;
				case 'unread':
					aValue = a.unreadCount || 0;
					bValue = b.unreadCount || 0;
					break;
				case 'createdat':
					aValue = new Date(a.createdAt).getTime();
					bValue = new Date(b.createdAt).getTime();
					break;
				default:
					aValue = new Date(a.createdAt).getTime();
					bValue = new Date(b.createdAt).getTime();
			}

			if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
			if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
			return 0;
		});
		$topics = $topics;
	};

	const handleDelete = async (id: number) => {
		const response = await fetch(`/api/topics`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ id })
		});
		if (response.ok) {
			$topics = $topics.filter((topic: Topic) => topic.id !== id);
		} else {
			alert('Failed to delete topic');
		}
	};

	onMount(async () => {
		const response = await fetch('/api/topics');
		const data = await response.json();

		$topics = data.topics;
		$topics.forEach((topic: Topic) => {
			topic.commentCount = data.comments.find((c: any) => c.topicId === topic.id)?.count || 0;
			topic.unreadCount = data.unreadCounts?.find((u: any) => u.topicId === topic.id)?.count || 0;
		});
		$topics = $topics;
		console.log($topics);
		ready = true;

		const socket = getSocket();

		if (socket) {
			socket.on('newTopic', (data) => {
				console.log('newTopic received:', data);
				if (data.createdBy === $user?.displayName) return;
				console.log('Adding new topic to list:', data);
				$topics = [data.topic, ...$topics] as Topic[];
				console.log($topics);
			});

			socket.on('deleteTopic', (data) => {
				console.log('deleteTopic received:', data);
				$topics = $topics.filter((topic) => topic.id !== data.id);
			});
		}
	});

	$effect(() => {
		console.log(`Sorting by ${sortColumn} ${sortDirection}`);
	});
</script>

<svelte:head>
	<title>App</title>
	<meta name="description" content="App" />
</svelte:head>

{#if ready}
	<div class="topics-container" transition:fade>
		{#if $user}
			<div class="top-bar">
				<div class="flex-section">
					<h1>Topics</h1>
					<button onclick={() => goto('/topics/create-topic')}>Create Topic</button>
					<button onclick={() => (cardView = !cardView)}>
						{cardView ? 'Table View' : 'Card View'}
					</button>
				</div>
				<button onclick={() => (showSettings = !showSettings)}>
					{showSettings ? 'Hide Settings' : 'Show Settings'}
				</button>
			</div>

			{#if $topics.length === 0}
				<p>
					No topics yet. <button onclick={() => goto('/topics/create-topic')}>Create one</button>
				</p>
			{/if}

			{#if cardView}
				<div class="card-view">
					{#each $topics as topic}
						<button class="topic-card" onclick={() => goto(`/topics/${topic.id}`)}>
							<h2>{topic.title}</h2>
							<div class="card-flex">
								Created By:
								{#if showAvatars}
									<img
										src={topic.avatar ||
											'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSMVruv2fzEJ-7rpjvgRqLsLBb98euBrF7_-g&s'}
										alt="avatar"
										width="40"
										height="40"
									/>
								{/if}
								{topic.createdBy}
							</div>
							<p>Comments: {topic.commentCount || 0}</p>
							<p>
								Unread:{' '}
								{#if topic.unreadCount > 0}
									<span class="unread-badge">{topic.unreadCount}</span>
								{:else}
									0
								{/if}
							</p>
							<p>Created at: {new Date(topic.createdAt).toLocaleString()}</p>
						</button>
					{/each}
				</div>
			{/if}

			{#if !cardView}
				{#if showSettings}
					<div class="settings" transition:fade>
						<button type="button" onclick={() => (showAvatars = !showAvatars)}>
							{showAvatars ? 'Hide Avatars' : 'Show Avatars'}
						</button>
						<div class="flex-section">
							Cell Padding: {cellPadding}px
							<input type="number" min="0" max="32" bind:value={cellPadding} />
						</div>
						<div class="flex-section">
							Cell Align: {cellAlign}
							<input type="text" bind:value={cellAlign} />
						</div>
					</div>
				{/if}

				{#if $topics.length > 0}
					<div
						class="table-container"
						style="--cell-padding: {cellPadding}px; --cell-align: {cellAlign}"
					>
						<table>
							<thead>
								<tr>
									<th onclick={() => handleColumnSort('Title')}>
										<span class='td-flex'>
											Title
											{#if sortColumn === 'title'}
												{#if sortDirection === 'asc'}
													<MoveUp color="lightgreen" />
												{:else}
													<MoveDown color="lightgreen" />
												{/if}
											{/if}
										</span>
									</th>
									<th onclick={() => handleColumnSort('Created By')}>
										<span class='td-flex'>
											Created By
											{#if sortColumn === 'createdby'}
												{#if sortDirection === 'asc'}
													<MoveUp color="lightgreen" />
												{:else}
													<MoveDown color="lightgreen" />
												{/if}
											{/if}
										</span>
									</th>
									<th onclick={() => handleColumnSort('Comments')}>
										<span class='td-flex'>
											Comments
											{#if sortColumn === 'comments'}
												{#if sortDirection === 'asc'}
													<MoveUp color="lightgreen" />
												{:else}
													<MoveDown color="lightgreen" />
												{/if}
											{/if}
										</span>
									</th>
									<th onclick={() => handleColumnSort('Unread')}>
										<span class='td-flex'>
											Unread
											{#if sortColumn === 'unread'}
												{#if sortDirection === 'asc'}
													<MoveUp color="lightgreen" />
												{:else}
													<MoveDown color="lightgreen" />
												{/if}
											{/if}
										</span>
									</th>
									<th onclick={() => handleColumnSort('Created At')}>
										<span class='td-flex'>
											Created At
											{#if sortColumn === 'createdat'}
												{#if sortDirection === 'asc'}
													<MoveUp color="lightgreen" />
												{:else}
													<MoveDown color="lightgreen" />
												{/if}
											{/if}
										</span>
									</th>
									<th class='td-flex'>Actions</th>
								</tr>
							</thead>
							<tbody>
								{#each $topics as topic}
									<tr class="topic" onclick={() => goto(`/topics/${topic.id}`)}>
										<td>{topic.title}</td>
										<td>
											<div class="td-flex">
												{#if showAvatars}
													<img
														src={topic.avatar ||
															'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSMVruv2fzEJ-7rpjvgRqLsLBb98euBrF7_-g&s'}
														alt="avatar"
														width="40"
														height="40"
													/>
												{/if}
												{topic.createdBy}
											</div>
										</td>
										<td>{topic.commentCount}</td>
										<td class:has-unread={topic.unreadCount > 0}>
											{#if topic.unreadCount > 0}
												<span class="unread-badge">{topic.unreadCount}</span>
											{:else}
												0
											{/if}
										</td>
										<td>{new Date(topic.createdAt).toLocaleString()}</td>
										<td onclick={(e) => e.stopPropagation()}>
											{#if $user.username === topic.createdBy}
												<button onclick={() => handleDelete(topic.id)}> Delete </button>
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<p>
						No topics yet. <button onclick={() => goto('/topics/create-topic')}>Create one</button>
					</p>
				{/if}
			{/if}
		{:else}
			<h1>Welcome to the App!</h1>
			<p>Please <button onclick={() => goto('/login')}>login</button> to participate.</p>
		{/if}
	</div>
{/if}

<style>
	.topics-container {
		padding: 20px;
		overflow-y: auto;
		overflow-x: auto;
		height: calc(100vh - 45px);
		background: black;
	}

	.top-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 8px;
	}

	.settings {
		margin-bottom: 8px;
		padding: 8px;
		border: 1px solid brown;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
	}

	.card-view {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 8px;
	}

	.topic-card {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 16px;
		margin-bottom: 12px;
		border: 1px solid brown;
		background: black;
		color: white;
		text-align: left;
		cursor: pointer;
		width: 100%;
		max-width: 400px;
	}

	.topic-card:hover {
		background: brown;
	}

	.table-container {
		border: 1px solid brown;
		border-bottom: none;
		overflow-x: auto;
		min-width: 0;
	}

	table {
		width: 100%;
		min-width: 800px; /* Adjust based on your needs */
		border-collapse: collapse;
	}

	th {
		height: 44px;
	}

	th span {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	th,
	td {
		padding: var(--cell-padding, 8px);
		text-align: var(--cell-align, left);
		border-right: 1px solid brown;
		border-bottom: 1px solid brown;
		vertical-align: middle;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	th:last-child,
	td:last-child {
		border-right: none;
	}

	.topic:hover {
		background-color: brown;
		color: white;
		cursor: pointer;
	}

	.td-flex {
		display: flex;
		align-items: center;
		justify-content: var(--cell-align, left);
		gap: 8px;
		white-space: nowrap;
		user-select: none;
	}

	.card-flex {
		display: flex;
		align-items: center;
		gap: 8px;
		white-space: nowrap;
	}

	.has-unread {
		color: lightgreen;
		font-weight: bold;
	}

	.unread-badge {
		background: lightgreen;
		color: black;
		padding: 2px 8px;
		border-radius: 12px;
		font-size: 0.85em;
		font-weight: bold;
	}
</style>
