const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

export interface ResetPasswordFormErrors {
  code?: string;
  password?: string;
  confirm?: string;
}

export interface ResetPasswordFormInput {
  code: string;
  newPassword: string;
  confirmPassword: string;
}

/** Shared validation for the reset-password form - no network/UI dependencies. */
export function validateResetPasswordForm(input: ResetPasswordFormInput): ResetPasswordFormErrors {
  const errors: ResetPasswordFormErrors = {};
  if (!input.code.trim()) {
    errors.code = 'Enter the code from your email.';
  }
  if (input.newPassword.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }
  if (input.confirmPassword !== input.newPassword) {
    errors.confirm = 'Passwords do not match.';
  }
  return errors;
}
