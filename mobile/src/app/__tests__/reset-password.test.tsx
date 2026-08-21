import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

const mockRouterReplace = jest.fn();
const mockToastShow = jest.fn();
const mockApiPost = jest.fn();

jest.mock('expo-router', () => ({
  router: { replace: (...args: unknown[]) => mockRouterReplace(...args) },
  Link: ({ children }: { children: ReactNode }) => children,
}));

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({ show: mockToastShow }),
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({ primary: '#000', onPrimary: '#fff', text: '#000', textSecondary: '#666', backgroundElement: '#eee', danger: '#f00' }),
}));

jest.mock('@/lib/api', () => {
  const actual = jest.requireActual('@/lib/api');
  return { ...actual, api: { post: (...args: unknown[]) => mockApiPost(...args) } };
});

import ResetPasswordScreen from '@/app/reset-password';
import { ApiError } from '@/lib/api';

describe('ResetPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows all three validation errors at once for empty/mismatched input', async () => {
    const { getByRole, getByPlaceholderText, getAllByPlaceholderText, findByText } = render(<ResetPasswordScreen />);

    fireEvent.changeText(getByPlaceholderText('e.g. 3F9A2B7C1D'), '');
    fireEvent.changeText(getAllByPlaceholderText('••••••••')[0], 'short');
    fireEvent.press(getByRole('button', { name: 'Reset password' }));

    expect(await findByText('Enter the code from your email.')).toBeTruthy();
    expect(await findByText('Password must be at least 8 characters.')).toBeTruthy();
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it('rejects mismatched password confirmation', async () => {
    const { getByRole, getByPlaceholderText, findByText, getAllByPlaceholderText } = render(<ResetPasswordScreen />);

    fireEvent.changeText(getByPlaceholderText('e.g. 3F9A2B7C1D'), 'ABC123DEF0');
    const passwordFields = getAllByPlaceholderText('••••••••');
    fireEvent.changeText(passwordFields[0], 'longEnough1');
    fireEvent.changeText(passwordFields[1], 'somethingElse1');
    fireEvent.press(getByRole('button', { name: 'Reset password' }));

    expect(await findByText('Passwords do not match.')).toBeTruthy();
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it('submits the trimmed code + new password, shows a toast, and navigates to login on success', async () => {
    mockApiPost.mockResolvedValueOnce({ success: true });
    const { getByRole, getByPlaceholderText, getAllByPlaceholderText } = render(<ResetPasswordScreen />);

    fireEvent.changeText(getByPlaceholderText('e.g. 3F9A2B7C1D'), '  ABC123DEF0  ');
    const passwordFields = getAllByPlaceholderText('••••••••');
    fireEvent.changeText(passwordFields[0], 'longEnough1');
    fireEvent.changeText(passwordFields[1], 'longEnough1');
    fireEvent.press(getByRole('button', { name: 'Reset password' }));

    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith(
        '/reset-password',
        { code: 'ABC123DEF0', newPassword: 'longEnough1' },
        { auth: false }
      )
    );
    await waitFor(() => expect(mockToastShow).toHaveBeenCalledWith('Password reset! Log in with your new password.'));
    await waitFor(() => expect(mockRouterReplace).toHaveBeenCalledWith('/login'));
  });

  it('shows the server error message and does not navigate when the code is rejected', async () => {
    mockApiPost.mockRejectedValueOnce(new ApiError(400, 'This reset code is invalid or has expired.'));
    const { getByRole, getByPlaceholderText, getAllByPlaceholderText, findByText } = render(<ResetPasswordScreen />);

    fireEvent.changeText(getByPlaceholderText('e.g. 3F9A2B7C1D'), 'BADCODE123');
    const passwordFields = getAllByPlaceholderText('••••••••');
    fireEvent.changeText(passwordFields[0], 'longEnough1');
    fireEvent.changeText(passwordFields[1], 'longEnough1');
    fireEvent.press(getByRole('button', { name: 'Reset password' }));

    expect(await findByText('This reset code is invalid or has expired.')).toBeTruthy();
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });
});
