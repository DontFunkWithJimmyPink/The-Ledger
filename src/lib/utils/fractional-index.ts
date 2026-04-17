/**
 * Fractional Indexing Utility
 *
 * Thin wrapper around the fractional-indexing npm package.
 * Used for task and page sort_order updates to enable efficient drag-and-drop reordering.
 *
 * @see https://www.npmjs.com/package/fractional-indexing
 */

import {
  generateKeyBetween as _generateKeyBetween,
  generateNKeysBetween as _generateNKeysBetween,
} from 'fractional-indexing';

/**
 * Generate a fractional index key between two existing keys.
 *
 * This is the primary function for reordering items via drag-and-drop.
 * The generated key will sort lexicographically between `a` and `b`.
 *
 * @param a - The key before the desired position (null for start)
 * @param b - The key after the desired position (null for end)
 * @returns A new key that sorts between a and b
 *
 * @example
 * // Insert at the beginning (before all items)
 * generateKeyBetween(null, 'a0') // returns something < 'a0'
 *
 * @example
 * // Insert at the end (after all items)
 * generateKeyBetween('a0', null) // returns something > 'a0'
 *
 * @example
 * // Insert between two items
 * generateKeyBetween('a0', 'a1') // returns something between 'a0' and 'a1'
 *
 * @example
 * // Generate first key in an empty list
 * generateKeyBetween(null, null) // returns 'a0'
 */
export function generateKeyBetween(
  a: string | null | undefined,
  b: string | null | undefined
): string {
  return _generateKeyBetween(a, b);
}

/**
 * Generate multiple fractional index keys between two existing keys.
 *
 * Useful for bulk operations or initializing multiple items at once.
 * Returns an array of n keys that sort lexicographically between a and b.
 *
 * @param a - The key before the desired position (null for start)
 * @param b - The key after the desired position (null for end)
 * @param n - The number of keys to generate (must be >= 0)
 * @returns An array of n keys in sorted order
 *
 * @example
 * // Generate 3 keys at the beginning
 * generateNKeysBetween(null, 'a0', 3)
 * // returns ['a0', 'a1', 'a2'] or similar
 *
 * @example
 * // Generate 5 keys in an empty list
 * generateNKeysBetween(null, null, 5)
 * // returns ['a0', 'a1', 'a2', 'a3', 'a4']
 */
export function generateNKeysBetween(
  a: string | null | undefined,
  b: string | null | undefined,
  n: number
): string[] {
  return _generateNKeysBetween(a, b, n);
}
