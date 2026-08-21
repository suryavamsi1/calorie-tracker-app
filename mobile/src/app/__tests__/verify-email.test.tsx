import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

const mockRouterBack = jest.fn();
const mockToastShow = jest.fn();
const mockApiPost = jest.fn();
const mockRefreshUser = jest.fn();

jest.mock('expo-router', () => ({
  router: { back: (...args: unknown[]) => mockRouterBack(...args) },
  Link: ({ children }: { children: ReactNode }) => children,
}));

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({ show: mockToastShow }),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ refreshUser: mockRefreshUser }),
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({ primary: '#000', onPrimary: '#fff', text: '#000', textSecondary: '#666', backgroundElement: '#eee', danger: '#f00' }),
}));

jest.mock('@/lib/api', () => {
  const actual = jest.requireActual('@/lib/api');
  return { ...actual, api: { post: (...args: unknown[]) => mockApiPost(...args) } };
});

import VerifyEmailScreen from '@/app/verify-email';
import { ApiError } from '@/lib/api';

describe('VerifyEmailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a validation error and does not call the API when the code is empty', async () => {
    const { getByRole, findByText } = render(<VerifyEmailScreen />);

    fireEvent.press(getByRole('button', { name: 'Verify email' }));

    expect(await findByText('Enter the code from your email.')).toBeTruthy();
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it('submits the trimmed code, refreshes the user, shows a toast, and navigates back on success', async () => {
    mockApiPost.mockResolvedValueOnce({ success: true });
    const { getByRole, getByPlaceholderText } = render(<VerifyEmailScreen />);

    fireEvent.changeText(getByPlaceholderText('e.g. 3F9A2B7C1D'), '  ABC123DEF0  ');
    fireEvent.press(getByRole('button', { name: 'Verify email' }));

    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith('/verify-email/confirm', { code: 'ABC123DEF0' }, { auth: false })
    );
    await waitFor(() => expect(mockRefreshUser).toHaveBeenCalled());
    await waitFor(() => expect(mockToastShow).toHaveBeenCalledWith('Email verified!'));
    await waitFor(() => expect(mockRouterBack).toHaveBeenCalled());
  });

  it('shows the server error message and does not navigate when the code is rejected', async () => {
    mockApiPost.mockRejectedValueOnce(new ApiError(400, 'This verification code is invalid or has expired.'));
    const { getByRole, getByPlaceholderText, findByText } = render(<VerifyEmailScreen />);

    fireEvent.changeText(getByPlaceholderText('e.g. 3F9A2B7C1D'), 'BADCODE123');
    fireEvent.press(getByRole('button', { name: 'Verify email' }));

    expect(await findByText('This verification code is invalid or has expired.')).toBeTruthy();
    expect(mockRouterBack).not.toHaveBeenCalled();
    expect(mockRefreshUser).not.toHaveBeenCalled();
  });

  it('resends the code and shows the server message as a toast', async () => {
    mockApiPost.mockResolvedValueOnce({ message: 'Verification code sent.' });
    const { getByRole } = render(<VerifyEmailScreen />);

    fireEvent.press(getByRole('button', { name: 'Resend code' }));

    await waitFor(() => expect(mockApiPost).toHaveBeenCalledWith('/verify-email/resend'));
    await waitFor(() => expect(mockToastShow).toHaveBeenCalledWith('Verification code sent.'));
  });

  it('shows an error toast when resending fails', async () => {
    mockApiPost.mockRejectedValueOnce(new ApiError(500, 'Something went wrong.'));
    const { getByRole } = render(<VerifyEmailScreen />);

    fireEvent.press(getByRole('button', { name: 'Resend code' }));

    await waitFor(() => expect(mockToastShow).toHaveBeenCalledWith('Something went wrong.', 'error'));
  });
});
