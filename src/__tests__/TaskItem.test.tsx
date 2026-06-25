import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskItem } from '../components/TaskItem';
import type { Task } from '../types/task';

const mockTask: Task = {
	id: 1,
	title: 'Ma tâche',
	description: 'Une description',
	completed: false,
	createdAt: '2026-01-15T10:00:00Z',
	updatedAt: '2026-01-15T10:00:00Z',
};

const defaultProps = {
	task: mockTask,
	onToggle: vi.fn(),
	onDelete: vi.fn(),
	onEdit: vi.fn(),
};

beforeEach(() => {
	vi.clearAllMocks();
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

describe('TaskItem', () => {
	describe('affichage par défaut', () => {
		it('affiche le titre et la description', () => {
			render(<TaskItem {...defaultProps} />);
			expect(screen.getByText('Ma tâche')).toBeInTheDocument();
			expect(screen.getByText('Une description')).toBeInTheDocument();
		});

		it("n'affiche pas la description si elle est null", () => {
			render(<TaskItem {...defaultProps} task={{ ...mockTask, description: null }} />);
			expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
		});

		it('affiche la date de création en français', () => {
			render(<TaskItem {...defaultProps} />);
			expect(screen.getByText('15 janvier 2026')).toBeInTheDocument();
		});

		it('ajoute la classe task-completed si la tâche est terminée', () => {
			render(<TaskItem {...defaultProps} task={{ ...mockTask, completed: true }} />);
			expect(screen.getByTestId('task-item')).toHaveClass('task-completed');
		});

		it("n'a pas la classe task-completed si la tâche est en cours", () => {
			render(<TaskItem {...defaultProps} />);
			expect(screen.getByTestId('task-item')).not.toHaveClass('task-completed');
		});

		it('la checkbox reflète le statut completed', () => {
			render(<TaskItem {...defaultProps} task={{ ...mockTask, completed: true }} />);
			expect(screen.getByRole('checkbox')).toBeChecked();
		});

		it("l'aria-label de la checkbox mentionne 'non terminée' si completed", () => {
			render(<TaskItem {...defaultProps} task={{ ...mockTask, completed: true }} />);
			expect(screen.getByRole('checkbox')).toHaveAttribute(
				'aria-label',
				'Marquer "Ma tâche" comme non terminée'
			);
		});

		it("l'aria-label de la checkbox mentionne 'terminée' si non completed", () => {
			render(<TaskItem {...defaultProps} />);
			expect(screen.getByRole('checkbox')).toHaveAttribute(
				'aria-label',
				'Marquer "Ma tâche" comme terminée'
			);
		});
	});

	describe('onToggle', () => {
		it("appelle onToggle avec l'id au clic sur la checkbox", () => {
			render(<TaskItem {...defaultProps} />);
			fireEvent.click(screen.getByRole('checkbox'));
			expect(defaultProps.onToggle).toHaveBeenCalledOnce();
			expect(defaultProps.onToggle).toHaveBeenCalledWith(1);
		});
	});

	describe('suppression', () => {
		it('affiche ⚠️ au premier clic et demande confirmation', () => {
			render(<TaskItem {...defaultProps} />);
			const deleteBtn = screen.getByTitle('Supprimer');
			fireEvent.click(deleteBtn);
			expect(deleteBtn).toHaveTextContent('⚠️');
			expect(defaultProps.onDelete).not.toHaveBeenCalled();
		});

		it('appelle onDelete au deuxième clic', () => {
			render(<TaskItem {...defaultProps} />);
			const deleteBtn = screen.getByTitle('Supprimer');
			fireEvent.click(deleteBtn);
			fireEvent.click(deleteBtn);
			expect(defaultProps.onDelete).toHaveBeenCalledOnce();
			expect(defaultProps.onDelete).toHaveBeenCalledWith(1);
		});

		it('remet 🗑️ après 3 secondes sans confirmation', () => {
			render(<TaskItem {...defaultProps} />);
			const deleteBtn = screen.getByTitle('Supprimer');
			fireEvent.click(deleteBtn);
			expect(deleteBtn).toHaveTextContent('⚠️');

			act(() => vi.advanceTimersByTime(3000));
			expect(deleteBtn).toHaveTextContent('🗑️');
		});

		it('ne remet pas 🗑️ avant 3 secondes', () => {
			render(<TaskItem {...defaultProps} />);
			const deleteBtn = screen.getByTitle('Supprimer');
			fireEvent.click(deleteBtn);

			act(() => vi.advanceTimersByTime(2999));
			expect(deleteBtn).toHaveTextContent('⚠️');
		});
	});

	describe('édition', () => {
		it("passe en mode édition au clic sur 'Modifier'", () => {
			render(<TaskItem {...defaultProps} />);
			fireEvent.click(screen.getByTitle('Modifier'));
			expect(screen.getByLabelText('Modifier le titre')).toBeInTheDocument();
			expect(screen.getByLabelText('Modifier la description')).toBeInTheDocument();
		});

		it('pré-remplit les champs avec les valeurs actuelles', () => {
			render(<TaskItem {...defaultProps} />);
			fireEvent.click(screen.getByTitle('Modifier'));
			expect(screen.getByLabelText('Modifier le titre')).toHaveValue('Ma tâche');
			expect(screen.getByLabelText('Modifier la description')).toHaveValue('Une description');
		});

		it('pré-remplit la description vide si null', () => {
			render(<TaskItem {...defaultProps} task={{ ...mockTask, description: null }} />);
			fireEvent.click(screen.getByTitle('Modifier'));
			expect(screen.getByLabelText('Modifier la description')).toHaveValue('');
		});

		it("appelle onEdit avec les bonnes valeurs à l'enregistrement", () => {
			render(<TaskItem {...defaultProps} />);
			fireEvent.click(screen.getByTitle('Modifier'));

			const titleInput = screen.getByLabelText('Modifier le titre');
			fireEvent.change(titleInput, { target: { value: 'Titre modifié' } });

			fireEvent.click(screen.getByText('Enregistrer'));
			expect(defaultProps.onEdit).toHaveBeenCalledOnce();
			expect(defaultProps.onEdit).toHaveBeenCalledWith(1, {
				title: 'Titre modifié',
				description: 'Une description',
			});
		});

		it('trim les espaces autour du titre et de la description', () => {
			render(<TaskItem {...defaultProps} />);
			fireEvent.click(screen.getByTitle('Modifier'));

			fireEvent.change(screen.getByLabelText('Modifier le titre'), {
				target: { value: '  Titre  ' },
			});
			fireEvent.change(screen.getByLabelText('Modifier la description'), {
				target: { value: '  Desc  ' },
			});

			fireEvent.click(screen.getByText('Enregistrer'));
			expect(defaultProps.onEdit).toHaveBeenCalledWith(1, {
				title: 'Titre',
				description: 'Desc',
			});
		});

		it('passe description en undefined si vide après trim', () => {
			render(<TaskItem {...defaultProps} />);
			fireEvent.click(screen.getByTitle('Modifier'));

			fireEvent.change(screen.getByLabelText('Modifier la description'), {
				target: { value: '   ' },
			});
			fireEvent.click(screen.getByText('Enregistrer'));

			expect(defaultProps.onEdit).toHaveBeenCalledWith(1, {
				title: 'Ma tâche',
				description: undefined,
			});
		});

		it("n'appelle pas onEdit si le titre est vide", () => {
			render(<TaskItem {...defaultProps} />);
			fireEvent.click(screen.getByTitle('Modifier'));

			fireEvent.change(screen.getByLabelText('Modifier le titre'), {
				target: { value: '   ' },
			});
			fireEvent.click(screen.getByText('Enregistrer'));
			expect(defaultProps.onEdit).not.toHaveBeenCalled();
		});

		it('restaure les valeurs originales et quitte le mode édition à Annuler', () => {
			render(<TaskItem {...defaultProps} />);
			fireEvent.click(screen.getByTitle('Modifier'));

			fireEvent.change(screen.getByLabelText('Modifier le titre'), {
				target: { value: 'Changement temporaire' },
			});
			fireEvent.click(screen.getByText('Annuler'));

			expect(screen.queryByLabelText('Modifier le titre')).not.toBeInTheDocument();
			expect(screen.getByText('Ma tâche')).toBeInTheDocument();
		});

		it('quitte le mode édition après un enregistrement réussi', () => {
			render(<TaskItem {...defaultProps} />);
			fireEvent.click(screen.getByTitle('Modifier'));
			fireEvent.click(screen.getByText('Enregistrer'));
			expect(screen.queryByLabelText('Modifier le titre')).not.toBeInTheDocument();
		});
	});
});