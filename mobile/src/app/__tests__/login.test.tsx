import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

const mockLogIn = jest.fn();
const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();
const mockToastShow = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockRouterPush(...args), replace: (...args: unknown[]) => mockRouterReplace(...args) },
  Link: ({ children }: { children: ReactNode }) => children,
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ logIn: mockLogIn }),
}));

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({ show: mockToastShow }),
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    primary: '#000',
    onPrimary: '#fff',
    text: '#000',
    textSecondary: '#666',
    backgroundElement: '#eee',
    danger: '#f00',
  }),
}));

import LoginScreen from '@/app/login';
import { ApiError } from '@/lib/api';

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows validation errors and does not call logIn when fields are empty', async () => {
    const { getByRole, findByText } = render(<LoginScreen />);

    fireEvent.press(getByRole('button', { name: 'Sign In' }));

    expect(await findByText('Enter your email.')).toBeTruthy();
    expect(await findByText('Enter your password.')).toBeTruthy();
    expect(mockLogIn).not.toHaveBeenCalled();
  });

  it('rejects a malformed email without calling logIn', async () => {
    const { getByRole, getByPlaceholderText, findByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'not-an-email');
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'somepassword');
    fireEvent.press(getByRole('button', { name: 'Sign In' }));

    expect(await findByText('Enter a valid email address.')).toBeTruthy();
    expect(mockLogIn).not.toHaveBeenCalled();
  });

  it('calls logIn with the trimmed email and navigates on success', async () => {
    mockLogIn.mockResolvedValueOnce(undefined);
    const { getByRole, getByPlaceholderText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('you@example.com'), '  user@example.com  ');
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'password123');
    fireEvent.press(getByRole('button', { name: 'Sign In' }));

    await waitFor(() => expect(mockLogIn).toHaveBeenCalledWith('user@example.com', 'password123'));
    await waitFor(() => expect(mockRouterReplace).toHaveBeenCalledWith('/'));
  });

  it('shows the server error message when login fails with an ApiError', async () => {
    mockLogIn.mockRejectedValueOnce(new ApiError(401, 'Invalid email or password'));
    const { getByRole, getByPlaceholderText, findByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'user@example.com');
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'wrongpassword');
    fireEvent.press(getByRole('button', { name: 'Sign In' }));

    expect(await findByText('Invalid email or password')).toBeTruthy();
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it('navigates to forgot-password when "Forgot?" is tapped', () => {
    const { getByText } = render(<LoginScreen />);
    fireEvent.press(getByText('Forgot?'));
    expect(mockRouterPush).toHaveBeenCalledWith('/forgot-password');
  });
});
