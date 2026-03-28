import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const HASH_PREFIX = 'scrypt';
const HASH_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, HASH_LENGTH).toString('hex');
  return `${HASH_PREFIX}:${salt}:${hash}`;
}

export function verifyPassword(password: string, encodedHash: string): boolean {
  const [prefix, salt, storedHash] = encodedHash.split(':');

  if (prefix !== HASH_PREFIX || !salt || !storedHash) {
    return false;
  }

  const derived = scryptSync(password, salt, HASH_LENGTH);
  const expected = Buffer.from(storedHash, 'hex');

  if (derived.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(derived, expected);
}
