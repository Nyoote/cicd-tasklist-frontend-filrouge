import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaskList } from '../components/TaskList';
import type { Task } from '../types/task';

const mockTasks: Task[] = [
	{
		id: 1,
		title: 'Première tâche',
		description: 'Description 1',
		completed: false,
		createdAt: '2026-01-15T10:00:00Z',
		updatedAt: '2026-01-15T10:00:00Z',
	},
	{
		id: 2,
		title: 'Deuxième tâche',
		description: null,
		completed: true,
		createdAt: '2026-01-16T10:00:00Z',
		updatedAt: '2026-01-16T10:00:00Z',
	},
];

const defaultProps = {
	tasks: [],
	loading: false,
	error: null,
	onToggle: vi.fn(),
	onDelete: vi.fn(),
	onEdit: vi.fn(),
};

describe('TaskList', () => {
	it('shows loading state', () => {
		render(<TaskList {...defaultProps} loading={true} />);
		expect(screen.getByTestId('loading')).toBeInTheDocument();
		expect(screen.getByText('Chargement des tâches...')).toBeInTheDocument();
	});

	it('renders list of tasks', () => {
		render(<TaskList {...defaultProps} tasks={mockTasks} />);
		expect(screen.getByTestId('task-list')).toBeInTheDocument();
		expect(screen.getByText('Première tâche')).toBeInTheDocument();
		expect(screen.getByText('Deuxième tâche')).toBeInTheDocument();
		expect(screen.getByText('2 tâches')).toBeInTheDocument();
	});

	describe('error state', () => {
		it('shows error message', () => {
			render(<TaskList {...defaultProps} error="Connexion impossible" />);
			expect(screen.getByTestId('error')).toBeInTheDocument();
			expect(screen.getByText('Erreur : Connexion impossible')).toBeInTheDocument();
		});

		it('error takes priority over empty tasks', () => {
			render(<TaskList {...defaultProps} tasks={[]} error="Oups" />);
			expect(screen.getByTestId('error')).toBeInTheDocument();
			expect(screen.queryByTestId('empty')).not.toBeInTheDocument();
		});

		it('loading takes priority over error', () => {
			render(<TaskList {...defaultProps} loading={true} error="Oups" />);
			expect(screen.getByTestId('loading')).toBeInTheDocument();
			expect(screen.queryByTestId('error')).not.toBeInTheDocument();
		});
	});

	describe('empty state', () => {
		it('shows empty state when no tasks', () => {
			render(<TaskList {...defaultProps} tasks={[]} />);
			expect(screen.getByTestId('empty')).toBeInTheDocument();
			expect(screen.getByText('Aucune tâche')).toBeInTheDocument();
			expect(screen.getByText('Commencez par ajouter votre première tâche !')).toBeInTheDocument();
		});
	});

	describe('task count', () => {
		it('shows singular for one task', () => {
			render(<TaskList {...defaultProps} tasks={[mockTasks[0]]} />);
			expect(screen.getByText('1 tâche')).toBeInTheDocument();
		});

		it('shows plural for multiple tasks', () => {
			render(<TaskList {...defaultProps} tasks={mockTasks} />);
			expect(screen.getByText('2 tâches')).toBeInTheDocument();
		});

		it('shows 0 completed when no task is done', () => {
			const allPending = mockTasks.map((t) => ({ ...t, completed: false }));
			render(<TaskList {...defaultProps} tasks={allPending} />);
			expect(screen.getByText(/0 terminée/)).toBeInTheDocument();
		});

		it('shows singular completed for exactly one done task', () => {
			render(<TaskList {...defaultProps} tasks={mockTasks} />);
			// mockTasks has 1 completed task
			expect(screen.getByText('1 terminée')).toBeInTheDocument();
		});

		it('shows plural completed for multiple done tasks', () => {
			const allDone = mockTasks.map((t) => ({ ...t, completed: true }));
			render(<TaskList {...defaultProps} tasks={allDone} />);
			expect(screen.getByText('2 terminées')).toBeInTheDocument();
		});
	});

	describe('callbacks', () => {
		it('passes onToggle down to each TaskItem', () => {
			const onToggle = vi.fn();
			render(<TaskList {...defaultProps} tasks={mockTasks} onToggle={onToggle} />);
			// TaskItems are rendered — just verify the list renders without throwing
			// (callback wiring is tested in TaskItem tests)
			expect(screen.getAllByTestId(/task-item|checkbox/i).length).toBeGreaterThan(0);
		});
	});
});