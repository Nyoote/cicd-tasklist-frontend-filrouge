import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTasks, getTask, createTask, updateTask, deleteTask } from '../api/taskApi';

const mockTask = {
	id: 1,
	title: 'Test',
	description: null,
	completed: false,
	createdAt: '2026-01-15T10:00:00Z',
	updatedAt: '2026-01-15T10:00:00Z',
};

beforeEach(() => {
	vi.restoreAllMocks();
});

describe('taskApi', () => {
	it('getTasks returns array', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve([mockTask]),
			})
		);

		const tasks = await getTasks();
		expect(tasks).toEqual([mockTask]);
		expect(fetch).toHaveBeenCalledWith('/api/tasks');
	});

	describe('getTask', () => {
		it('returns a single task by id', async () => {
			vi.stubGlobal(
				'fetch',
				vi.fn().mockResolvedValue({
					ok: true,
					json: () => Promise.resolve(mockTask),
				})
			);

			const task = await getTask(1);
			expect(task).toEqual(mockTask);
			expect(fetch).toHaveBeenCalledWith('/api/tasks/1');
		});

		it('throws on HTTP error', async () => {
			vi.stubGlobal(
				'fetch',
				vi.fn().mockResolvedValue({
					ok: false,
					status: 404,
					text: () => Promise.resolve('Not found'),
				})
			);

			await expect(getTask(99)).rejects.toThrow('HTTP 404: Not found');
		});
	});

	describe('createTask', () => {
		it('sends POST and returns created task', async () => {
			const payload = { title: 'New task', description: 'desc' };
			vi.stubGlobal(
				'fetch',
				vi.fn().mockResolvedValue({
					ok: true,
					json: () => Promise.resolve({ ...mockTask, ...payload }),
				})
			);

			const task = await createTask(payload);
			expect(task).toEqual({ ...mockTask, ...payload });
			expect(fetch).toHaveBeenCalledWith('/api/tasks', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});
		});

		it('throws on HTTP error', async () => {
			vi.stubGlobal(
				'fetch',
				vi.fn().mockResolvedValue({
					ok: false,
					status: 400,
					text: () => Promise.resolve('Bad request'),
				})
			);

			await expect(createTask({ title: '' })).rejects.toThrow(
				'HTTP 400: Bad request'
			);
		});
	});

	describe('updateTask', () => {
		it('sends PUT and returns updated task', async () => {
			const payload = { title: 'Updated', completed: true };
			const updated = { ...mockTask, ...payload };
			vi.stubGlobal(
				'fetch',
				vi.fn().mockResolvedValue({
					ok: true,
					json: () => Promise.resolve(updated),
				})
			);

			const task = await updateTask(1, payload);
			expect(task).toEqual(updated);
			expect(fetch).toHaveBeenCalledWith('/api/tasks/1', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});
		});

		it('throws on HTTP error', async () => {
			vi.stubGlobal(
				'fetch',
				vi.fn().mockResolvedValue({
					ok: false,
					status: 500,
					text: () => Promise.resolve('Server error'),
				})
			);

			await expect(updateTask(1, { title: 'x' })).rejects.toThrow('HTTP 500: Server error');
		});
	});

	describe('deleteTask', () => {
		it('sends DELETE and resolves on success', async () => {
			vi.stubGlobal(
				'fetch',
				vi.fn().mockResolvedValue({
					ok: true,
				})
			);

			await expect(deleteTask(1)).resolves.toBeUndefined();
			expect(fetch).toHaveBeenCalledWith('/api/tasks/1', { method: 'DELETE' });
		});

		it('throws on HTTP error', async () => {
			vi.stubGlobal(
				'fetch',
				vi.fn().mockResolvedValue({
					ok: false,
					status: 403,
					text: () => Promise.resolve('Forbidden'),
				})
			);

			await expect(deleteTask(1)).rejects.toThrow('HTTP 403: Forbidden');
		});
	});

	describe('getTasks', () => {
		it('throws on HTTP error', async () => {
			vi.stubGlobal(
				'fetch',
				vi.fn().mockResolvedValue({
					ok: false,
					status: 500,
					text: () => Promise.resolve('Internal server error'),
				})
			);

			await expect(getTasks()).rejects.toThrow('HTTP 500: Internal server error');
		});
	});
});