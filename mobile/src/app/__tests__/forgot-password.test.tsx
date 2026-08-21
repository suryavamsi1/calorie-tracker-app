import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();
const mockApiPost = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockRouterPush(...args), replace: (...args: unknown[]) => mockRouterReplace(...args) },
  Link: ({ children }: { children: ReactNode }) => children,
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({ primary: '#000', onPrimary: '#fff', text: '#000', textSecondary: '#666', backgroundElement: '#eee' }),
}));

jest.mock('@/lib/api', () => ({
  api: { post: (...args: unknown[]) => mockApiPost(...args) },
}));

import ForgotPasswordScreen from '@/app/forgot-password';

describe('ForgotPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a validation error for a malformed email without calling the API', async () => {
    const { getByRole, getByPlaceholderText, findByText } = render(<ForgotPasswordScreen />);

    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'not-an-email');
    fireEvent.press(getByRole('button', { name: 'Send reset code' }));

    expect(await findByText('Enter a valid email address.')).toBeTruthy();
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it('submits the trimmed email and shows the generic "check your email" state', async () => {
    mockApiPost.mockResolvedValueOnce({ message: 'ok' });
    const { getByRole, getByPlaceholderText, findByText } = render(<ForgotPasswordScreen />);

    fireEvent.changeText(getByPlaceholderText('you@example.com'), '  user@example.com  ');
    fireEvent.press(getByRole('button', { name: 'Send reset code' }));

    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith('/forgot-password', { email: 'user@example.com' }, { auth: false })
    );
    expect(await findByText('Check your email')).toBeTruthy();
    expect(await findByText(/user@example\.com/)).toBeTruthy();
  });

  it('still shows the generic "check your email" state even if the request itself fails', async () => {
    mockApiPost.mockRejectedValueOnce(new Error('network down'));
    const { getByRole, getByPlaceholderText, findByText } = render(<ForgotPasswordScreen />);

    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'user@example.com');
    fireEvent.press(getByRole('button', { name: 'Send reset code' }));

    expect(await findByText('Check your email')).toBeTruthy();
  });

  it('navigates to reset-password when "I have a code" is tapped', async () => {
    mockApiPost.mockResolvedValueOnce({ message: 'ok' });
    const { getByRole, getByPlaceholderText, findByText } = render(<ForgotPasswordScreen />);

    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'user@example.com');
    fireEvent.press(getByRole('button', { name: 'Send reset code' }));
    await findByText('Check your email');

    fireEvent.press(getByRole('button', { name: 'I have a code' }));
    expect(mockRouterPush).toHaveBeenCalledWith('/reset-password');
  });
});
