const errorMap: Record<string, string> = {
  'Invalid login credentials': 'Invalid email or password',
  'Email not confirmed': 'Please verify your email before signing in',
  'User not found': 'Invalid email or password',
  'Invalid password': 'Invalid email or password',
  'User already registered': 'Unable to create account. Please try again.',
  'Signup requires a valid password': 'Please enter a valid password',
};

export const getAuthErrorMessage = (errorMessage: string): string => {
  return errorMap[errorMessage] || 'Something went wrong. Please try again.';
};

export const validatePassword = (password: string): string | null => {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter';
  if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain a number';
  if (!/[^a-zA-Z0-9]/.test(password)) return 'Password must contain a special character (!@#$...)';
  return null;
};
