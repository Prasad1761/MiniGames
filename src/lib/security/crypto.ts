import { createHmac, timingSafeEqual } from 'crypto';

const SECRET_KEY = process.env.SESSION_SECRET || 'dev-only-secret-do-not-use-in-production';

/**
 * Signs a session identifier to prevent tampering.
 */
export function signSessionId(sessionId: string): string {
  return createHmac('sha256', SECRET_KEY).update(sessionId).digest('hex');
}

/**
 * Verifies a signature against a session identifier.
 */
export function verifySessionSignature(sessionId: string, signature: string): boolean {
  const expectedSignature = signSessionId(sessionId);
  const expectedBuffer = Buffer.from(expectedSignature);
  const actualBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== actualBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, actualBuffer);
}
