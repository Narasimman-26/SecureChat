import { describe, it, expect } from 'vitest';
import { detectSensitiveContent } from '../sensitivity';

describe('Sensitive Content Guard (Client-Side Detection)', () => {
  it('detects credit card numbers with Luhn check', () => {
    // Valid Visa test number
    const result = detectSensitiveContent('Here is my payment card: 4532 0150 1234 5678');
    expect(result.isSensitive).toBe(true);
    expect(result.issues.some((i) => i.type === 'credit_card')).toBe(true);
  });

  it('detects passwords with label patterns', () => {
    const result = detectSensitiveContent('My server password: super_secret_pass_123');
    expect(result.isSensitive).toBe(true);
    expect(result.issues.some((i) => i.type === 'password')).toBe(true);
  });

  it('detects OTP verification codes', () => {
    const result = detectSensitiveContent('Your bank OTP is 482910, do not share.');
    expect(result.isSensitive).toBe(true);
    expect(result.issues.some((i) => i.type === 'otp')).toBe(true);
  });

  it('detects phone numbers', () => {
    const result = detectSensitiveContent('Call me at +1 (555) 234-5678 later.');
    expect(result.isSensitive).toBe(true);
    expect(result.issues.some((i) => i.type === 'phone')).toBe(true);
  });

  it('does not flag benign conversational text', () => {
    const result = detectSensitiveContent('Hey! Let us review the pull request tomorrow at 10am.');
    expect(result.isSensitive).toBe(false);
    expect(result.issues.length).toBe(0);
  });
});
