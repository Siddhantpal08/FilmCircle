import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from '../pages/Login';
import { AuthContext } from '../context/AuthContext';

// Mock the authService to avoid real HTTP calls
vi.mock('../services', () => ({
    authService: {
        login: vi.fn().mockResolvedValue({ data: { token: 'fake-token', user: { id: '1', username: 'testuser', email: 'test@test.com' } } }),
    },
}));

const mockLogin = vi.fn();
const mockAuthContext = { login: mockLogin, logout: vi.fn(), user: null, loading: false, isAuthenticated: false };

const renderLogin = () =>
    render(
        <AuthContext.Provider value={mockAuthContext}>
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        </AuthContext.Provider>
    );

describe('Login Page', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it('renders email and password fields', () => {
        renderLogin();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('renders the sign in button', () => {
        renderLogin();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('shows error when submitted with empty fields', async () => {
        renderLogin();
        const btn = screen.getByRole('button', { name: /sign in/i });
        fireEvent.click(btn);
        expect(await screen.findByText(/all fields are required/i)).toBeInTheDocument();
    });

    it('has a link to register page', () => {
        renderLogin();
        expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
    });
});
