import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskForm } from '../components/TaskForm';

const defaultProps = {
	onSubmit: vi.fn(),
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe('TaskForm', () => {
	describe('affichage', () => {
		it('affiche le titre "Nouvelle tâche" en mode create par défaut', () => {
			render(<TaskForm {...defaultProps} />);
			expect(screen.getByText('Nouvelle tâche')).toBeInTheDocument();
		});

		it('affiche le titre "Modifier la tâche" en mode edit', () => {
			render(<TaskForm {...defaultProps} mode="edit" />);
			expect(screen.getByText('Modifier la tâche')).toBeInTheDocument();
		});

		it('affiche le bouton "Ajouter" en mode create', () => {
			render(<TaskForm {...defaultProps} />);
			expect(screen.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument();
		});

		it('affiche le bouton "Modifier" en mode edit', () => {
			render(<TaskForm {...defaultProps} mode="edit" />);
			expect(screen.getByRole('button', { name: 'Modifier' })).toBeInTheDocument();
		});

		it("n'affiche pas le bouton Annuler si onCancel absent", () => {
			render(<TaskForm {...defaultProps} />);
			expect(screen.queryByRole('button', { name: 'Annuler' })).not.toBeInTheDocument();
		});

		it('affiche le bouton Annuler si onCancel est fourni', () => {
			render(<TaskForm {...defaultProps} onCancel={vi.fn()} />);
			expect(screen.getByRole('button', { name: 'Annuler' })).toBeInTheDocument();
		});

		it('pré-remplit le titre avec initialValues', () => {
			render(<TaskForm {...defaultProps} initialValues={{ title: 'Mon titre' }} />);
			expect(screen.getByLabelText('Titre')).toHaveValue('Mon titre');
		});

		it('pré-remplit la description avec initialValues', () => {
			render(
				<TaskForm {...defaultProps} initialValues={{ title: 'T', description: 'Ma desc' }} />
			);
			expect(screen.getByLabelText('Description')).toHaveValue('Ma desc');
		});

		it('laisse les champs vides si pas d\'initialValues', () => {
			render(<TaskForm {...defaultProps} />);
			expect(screen.getByLabelText('Titre')).toHaveValue('');
			expect(screen.getByLabelText('Description')).toHaveValue('');
		});
	});

	describe('soumission valide', () => {
		it('appelle onSubmit avec titre et description', () => {
			render(<TaskForm {...defaultProps} />);
			fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'Nouvelle tâche' } });
			fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Une desc' } });
			fireEvent.submit(screen.getByTestId('task-form'));

			expect(defaultProps.onSubmit).toHaveBeenCalledOnce();
			expect(defaultProps.onSubmit).toHaveBeenCalledWith({
				title: 'Nouvelle tâche',
				description: 'Une desc',
			});
		});

		it('appelle onSubmit sans description si le champ est vide', () => {
			render(<TaskForm {...defaultProps} />);
			fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'Tâche simple' } });
			fireEvent.submit(screen.getByTestId('task-form'));

			expect(defaultProps.onSubmit).toHaveBeenCalledWith({
				title: 'Tâche simple',
				description: undefined,
			});
		});

		it('trim les espaces du titre et de la description', () => {
			render(<TaskForm {...defaultProps} />);
			fireEvent.change(screen.getByLabelText('Titre'), { target: { value: '  Titre  ' } });
			fireEvent.change(screen.getByLabelText('Description'), { target: { value: '  Desc  ' } });
			fireEvent.submit(screen.getByTestId('task-form'));

			expect(defaultProps.onSubmit).toHaveBeenCalledWith({
				title: 'Titre',
				description: 'Desc',
			});
		});

		it('passe description en undefined si elle ne contient que des espaces', () => {
			render(<TaskForm {...defaultProps} />);
			fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'Titre' } });
			fireEvent.change(screen.getByLabelText('Description'), { target: { value: '   ' } });
			fireEvent.submit(screen.getByTestId('task-form'));

			expect(defaultProps.onSubmit).toHaveBeenCalledWith({
				title: 'Titre',
				description: undefined,
			});
		});

		it('remet les champs à vide après soumission en mode create', () => {
			render(<TaskForm {...defaultProps} />);
			fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'Tâche' } });
			fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Desc' } });
			fireEvent.submit(screen.getByTestId('task-form'));

			expect(screen.getByLabelText('Titre')).toHaveValue('');
			expect(screen.getByLabelText('Description')).toHaveValue('');
		});

		it('ne remet pas les champs à vide après soumission en mode edit', () => {
			render(
				<TaskForm
					{...defaultProps}
					mode="edit"
					initialValues={{ title: 'Titre', description: 'Desc' }}
				/>
			);
			fireEvent.submit(screen.getByTestId('task-form'));

			expect(screen.getByLabelText('Titre')).toHaveValue('Titre');
			expect(screen.getByLabelText('Description')).toHaveValue('Desc');
		});
	});

	describe('validation', () => {
		it('affiche une erreur si le titre est vide à la soumission', () => {
			render(<TaskForm {...defaultProps} />);
			fireEvent.submit(screen.getByTestId('task-form'));

			expect(screen.getByRole('alert')).toHaveTextContent('Le titre est requis');
			expect(defaultProps.onSubmit).not.toHaveBeenCalled();
		});

		it('affiche une erreur si le titre ne contient que des espaces', () => {
			render(<TaskForm {...defaultProps} />);
			fireEvent.change(screen.getByLabelText('Titre'), { target: { value: '   ' } });
			fireEvent.submit(screen.getByTestId('task-form'));

			expect(screen.getByRole('alert')).toHaveTextContent('Le titre est requis');
			expect(defaultProps.onSubmit).not.toHaveBeenCalled();
		});

		it('ajoute la classe input-error sur le champ titre en cas d\'erreur', () => {
			render(<TaskForm {...defaultProps} />);
			fireEvent.submit(screen.getByTestId('task-form'));

			expect(screen.getByLabelText('Titre')).toHaveClass('input-error');
		});

		it("efface l'erreur dès que l'utilisateur modifie le titre", () => {
			render(<TaskForm {...defaultProps} />);
			fireEvent.submit(screen.getByTestId('task-form'));
			expect(screen.getByRole('alert')).toBeInTheDocument();

			fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'x' } });
			expect(screen.queryByRole('alert')).not.toBeInTheDocument();
		});

		it("n'affiche pas d'erreur avant toute soumission", () => {
			render(<TaskForm {...defaultProps} />);
			expect(screen.queryByRole('alert')).not.toBeInTheDocument();
		});
	});

	describe('onCancel', () => {
		it('appelle onCancel au clic sur Annuler', () => {
			const onCancel = vi.fn();
			render(<TaskForm {...defaultProps} onCancel={onCancel} />);
			fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
			expect(onCancel).toHaveBeenCalledOnce();
		});

		it("n'appelle pas onSubmit au clic sur Annuler", () => {
			render(<TaskForm {...defaultProps} onCancel={vi.fn()} />);
			fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
			expect(defaultProps.onSubmit).not.toHaveBeenCalled();
		});
	});
});