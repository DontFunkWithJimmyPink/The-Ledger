/**
 * Mock implementation of fractional-indexing
 * This is a minimal implementation that matches the behavior of the actual package
 * for testing purposes.
 */

const BASE_62_DIGITS =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

let keyCounter = 0; // Counter for generating unique keys

export function generateKeyBetween(
  a: string | null | undefined,
  b: string | null | undefined
): string {
  // This is a simplified implementation based on the fractional-indexing package
  // For null/undefined inputs, use default logic
  if (a == null && b == null) {
    return 'a0';
  }

  if (a == null) {
    // Generate a key before b
    // Use numeric prefix which sorts before letters in localeCompare
    const firstChar = b.charAt(0);
    if (firstChar >= 'a' || firstChar >= 'A') {
      // If b starts with a letter, use a number prefix
      return '9' + b;
    }
    // If b starts with a number, decrement it
    const firstCharIndex = BASE_62_DIGITS.indexOf(firstChar);
    if (firstCharIndex > 0) {
      return BASE_62_DIGITS[firstCharIndex - 1] + b.slice(1);
    }
    return '00' + b;
  }

  if (b == null) {
    // Generate a key after a
    const lastChar = a.charAt(a.length - 1);
    const lastCharIndex = BASE_62_DIGITS.indexOf(lastChar);
    if (lastCharIndex < BASE_62_DIGITS.length - 1) {
      return a.slice(0, -1) + BASE_62_DIGITS[lastCharIndex + 1];
    }
    return a + '0';
  }

  // Generate a key between a and b
  // Use a counter to ensure uniqueness for testing
  keyCounter++;
  const suffix = BASE_62_DIGITS[keyCounter % BASE_62_DIGITS.length];
  return a + suffix;
}

export function generateNKeysBetween(
  a: string | null | undefined,
  b: string | null | undefined,
  n: number
): string[] {
  if (n === 0) return [];
  if (n === 1) return [generateKeyBetween(a, b)];

  const keys: string[] = [];

  // Special case: if both are null, generate sequential keys
  if (a == null && b == null) {
    for (let i = 0; i < n; i++) {
      keys.push(`a${i}`);
    }
    return keys;
  }

  // Generate keys by repeatedly calling generateKeyBetween
  let prev = a;
  for (let i = 0; i < n; i++) {
    const key = generateKeyBetween(prev, b);
    keys.push(key);
    prev = key;
  }

  return keys;
}

export const BASE_62_DIGITS_EXPORT = BASE_62_DIGITS;
