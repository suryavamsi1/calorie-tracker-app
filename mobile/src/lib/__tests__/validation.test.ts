import { isValidEmail, validateResetPasswordForm } from '@/lib/validation';

describe('isValidEmail', () => {
  it('accepts well-formed emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('  user@example.com  ')).toBe(true);
  });

  it('rejects malformed emails', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('missing-domain@')).toBe(false);
    expect(isValidEmail('@missing-local.com')).toBe(false);
  });
});

describe('validateResetPasswordForm', () => {
  const validInput = { code: 'ABC123DEF0', newPassword: 'longEnough1', confirmPassword: 'longEnough1' };

  it('returns no errors for valid input', () => {
    expect(validateResetPasswordForm(validInput)).toEqual({});
  });

  it('requires a non-blank code', () => {
    const errors = validateResetPasswordForm({ ...validInput, code: '   ' });
    expect(errors.code).toBeDefined();
  });

  it('requires at least 8 characters for the new password', () => {
    const errors = validateResetPasswordForm({ ...validInput, newPassword: 'short', confirmPassword: 'short' });
    expect(errors.password).toBeDefined();
  });

  it('requires the confirmation to match the new password', () => {
    const errors = validateResetPasswordForm({ ...validInput, confirmPassword: 'somethingElse1' });
    expect(errors.confirm).toBeDefined();
  });

  it('can report multiple errors at once', () => {
    const errors = validateResetPasswordForm({ code: '', newPassword: 'short', confirmPassword: 'other' });
    expect(errors.code).toBeDefined();
    expect(errors.password).toBeDefined();
    expect(errors.confirm).toBeDefined();
  });
});
