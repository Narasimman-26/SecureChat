import { SensitivityCheckResult, SensitiveIssue } from '@shared/types';

// Luhn algorithm validator for credit/debit card numbers
function passesLuhnCheck(cardNumberStr: string): boolean {
  const digits = cardNumberStr.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

function maskValue(val: string): string {
  if (val.length <= 4) return '••••';
  const start = val.slice(0, 2);
  const end = val.slice(-3);
  return `${start}••••${end}`;
}

export function detectSensitiveContent(text: string): SensitivityCheckResult {
  const issues: SensitiveIssue[] = [];
  if (!text || !text.trim()) {
    return { isSensitive: false, issues: [] };
  }

  const cleanText = text.trim();

  // 1. CREDIT / DEBIT CARD DETECTION
  // Match 13-19 digit sequences or standard 4-block formatted numbers: 1234 5678 9012 3456
  const formattedCardRegex = /\b\d{4}[-\s]\d{4}[-\s]\d{4}[-\s]\d{4}\b/g;
  const rawDigitCardRegex = /\b\d{13,19}\b/g;

  let hasCard = false;
  let cardPreview = '';

  const formattedMatch = formattedCardRegex.exec(cleanText);
  if (formattedMatch) {
    hasCard = true;
    cardPreview = formattedMatch[0];
  } else {
    let match: RegExpExecArray | null;
    while ((match = rawDigitCardRegex.exec(cleanText)) !== null) {
      if (passesLuhnCheck(match[0])) {
        hasCard = true;
        cardPreview = match[0];
        break;
      }
    }
  }

  if (hasCard) {
    issues.push({
      type: 'credit_card',
      label: 'Payment Card Number',
      matchedPreview: maskValue(cardPreview),
      recommendation: 'Card numbers should never be transmitted in chat. Even with end-to-end encryption, recipient device storage could be compromised.',
    });
  }

  // 2. PASSWORD DETECTION
  // Patterns like "password: xyz", "pwd=xyz", "pass is xyz", "secret: xyz"
  const passwordLabeledRegex = /(?:password|passwd|pwd|passcode|secret)[\s:=]+([^\s,;]+)/i;
  const labeledMatch = passwordLabeledRegex.exec(cleanText);
  if (labeledMatch && labeledMatch[1] && labeledMatch[1].length >= 4) {
    issues.push({
      type: 'password',
      label: 'Password / Credential',
      matchedPreview: maskValue(labeledMatch[1]),
      recommendation: 'Sharing passwords in chat risks credential leakage. Consider a dedicated password manager or temporary secret vault.',
    });
  }

  // 3. OTP / 2FA CODES
  // Patterns like "OTP is 482910", "code: 394821", "verification code 123456" or explicit 6-digit labeled
  const otpLabeledRegex = /(?:otp|one[-\s]?time[-\s]?password|verification\s*code|auth\s*code|2fa\s*code|pin)[\s:=is]+(\d{4,8})\b/i;
  const otpMatch = otpLabeledRegex.exec(cleanText);
  if (otpMatch && otpMatch[1]) {
    issues.push({
      type: 'otp',
      label: 'One-Time Password / 2FA Code',
      matchedPreview: maskValue(otpMatch[1]),
      recommendation: 'OTPs are meant for authentication verification only. Legitimate services and admins will never ask for your one-time code.',
    });
  } else {
    // Standalone 6-digit codes when text is very short (e.g. user just pasting "928371")
    if (/^\b\d{6}\b$/.test(cleanText)) {
      issues.push({
        type: 'otp',
        label: 'Possible Verification Code (OTP)',
        matchedPreview: maskValue(cleanText),
        recommendation: 'This looks like a 6-digit security code. Verify the recipient before sharing.',
      });
    }
  }

  // 4. PHONE NUMBERS
  // International format +1 234 567 8901, +91 98765 43210, (123) 456-7890, 123-456-7890
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
  const phoneMatches = cleanText.match(phoneRegex);
  if (phoneMatches) {
    // Ensure it wasn't already caught as a card
    const notCard = phoneMatches.some((pm) => !passesLuhnCheck(pm.replace(/\D/g, '')));
    if (notCard) {
      issues.push({
        type: 'phone',
        label: 'Phone Number',
        matchedPreview: maskValue(phoneMatches[0]),
        recommendation: 'Phone numbers can be used for SIM-swapping or spear phishing. Confirm you intended to share personal contact info.',
      });
    }
  }

  return {
    isSensitive: issues.length > 0,
    issues,
  };
}
