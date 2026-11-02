import { describe, it, expect } from 'vitest';
import { signSessionId, verifySessionSignature } from '@/lib/security/crypto';

describe('Crypto Anti-Cheat Verification', () => {
  it('should sign and verify valid session IDs', () => {
    const sessionId = 'test-session-123';
    const signature = signSessionId(sessionId);

    expect(signature).toBeDefined();
    expect(typeof signature).toBe('string');
    expect(verifySessionSignature(sessionId, signature)).toBe(true);
  });

  it('should reject invalid signatures', () => {
    const sessionId = 'test-session-123';
    const fakeSignature = 'bad-signature-abcdef';

    expect(verifySessionSignature(sessionId, fakeSignature)).toBe(false);
  });

  it('should reject tampered session IDs with original signature', () => {
    const sessionId = 'test-session-123';
    const signature = signSessionId(sessionId);
    const tamperedSessionId = 'test-session-456';

    expect(verifySessionSignature(tamperedSessionId, signature)).toBe(false);
  });
});
