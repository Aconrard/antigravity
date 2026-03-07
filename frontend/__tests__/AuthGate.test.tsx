import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import AuthGate from '../components/AuthGate';

describe('AuthGate UI Component', () => {

    it('should render the login card correctly', () => {
        const mockOnAuth = jest.fn();
        render(<AuthGate onAuthenticated={mockOnAuth} />);

        // Assertions for UI elements
        expect(screen.getByRole('button', { name: /secure login/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/Universal ID/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Employee Number/i)).toBeInTheDocument();
        expect(screen.getByText(/Instructor Authentication/i)).toBeInTheDocument();
    });

});
