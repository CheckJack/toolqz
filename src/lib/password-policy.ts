export const MIN_PASSWORD_LENGTH = 8;

export function isPasswordLongEnough(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH;
}

export function passwordTooShortMessage(): string {
  return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
}
