export type PIIType = 'email' | 'ssn' | 'phone' | 'credit_card';

export interface DetectionResult {
  hasPII: boolean;
  hasInjection: boolean;
  piiTypes: PIIType[];
  riskScore: number;
  warnings: string[];
}

// Email regex pattern
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

// SSN regex pattern (XXX-XX-XXXX or XXXXXXXXX)
const SSN_REGEX = /\b\d{3}-?\d{2}-?\d{4}\b/g;

// Phone number patterns
const PHONE_REGEX = /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g;

// Credit card patterns (simplified)
const CREDIT_CARD_REGEX = /\b(?:\d{4}[-\s]?){3}\d{4}\b/g;

// Prompt injection patterns
const INJECTION_PATTERNS = [
  /ignore\s+(previous|above|all)\s+(instructions|commands|rules)/i,
  /forget\s+(everything|all|previous)/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /system\s*:\s*/i,
  /assistant\s*:\s*/i,
  /\[INST\]/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /roleplay/i,
  /pretend\s+to\s+be/i,
  /act\s+as\s+if/i,
  /disregard\s+(the|your)\s+(previous|above)/i,
  /new\s+instructions/i,
  /override/i,
  /bypass/i,
  /jailbreak/i,
];

export function detectPII(text: string): {
  hasPII: boolean;
  types: PIIType[];
  matches: { type: PIIType; count: number }[];
} {
  const types: PIIType[] = [];
  const matches: { type: PIIType; count: number }[] = [];

  // Check for emails
  const emailMatches = text.match(EMAIL_REGEX);
  if (emailMatches && emailMatches.length > 0) {
    types.push('email');
    matches.push({ type: 'email', count: emailMatches.length });
  }

  // Check for SSNs
  const ssnMatches = text.match(SSN_REGEX);
  if (ssnMatches && ssnMatches.length > 0) {
    types.push('ssn');
    matches.push({ type: 'ssn', count: ssnMatches.length });
  }

  // Check for phone numbers
  const phoneMatches = text.match(PHONE_REGEX);
  if (phoneMatches && phoneMatches.length > 0) {
    types.push('phone');
    matches.push({ type: 'phone', count: phoneMatches.length });
  }

  // Check for credit cards
  const ccMatches = text.match(CREDIT_CARD_REGEX);
  if (ccMatches && ccMatches.length > 0) {
    types.push('credit_card');
    matches.push({ type: 'credit_card', count: ccMatches.length });
  }

  return {
    hasPII: types.length > 0,
    types: [...new Set(types)],
    matches,
  };
}

export function detectPromptInjection(text: string): {
  hasInjection: boolean;
  matches: string[];
  riskScore: number;
} {
  const matches: string[] = [];
  let riskScore = 0;

  for (const pattern of INJECTION_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      matches.push(...match);
      riskScore += 10; // Each pattern match adds to risk score
    }
  }

  // Additional heuristics
  const lowerText = text.toLowerCase();
  
  // Check for suspicious instruction patterns
  if (lowerText.includes('ignore') && lowerText.includes('instruction')) {
    riskScore += 15;
  }
  
  // Check for role manipulation
  if (lowerText.includes('you are') || lowerText.includes('act as')) {
    riskScore += 5;
  }

  // Check for encoding attempts
  if (text.includes('\\x') || text.includes('%') || text.includes('&#')) {
    riskScore += 5;
  }

  // Normalize risk score to 0-100
  riskScore = Math.min(100, riskScore);

  return {
    hasInjection: matches.length > 0 || riskScore > 20,
    matches: [...new Set(matches)],
    riskScore,
  };
}

export function analyzePrompt(prompt: string): DetectionResult {
  const piiResult = detectPII(prompt);
  const injectionResult = detectPromptInjection(prompt);

  const warnings: string[] = [];

  if (piiResult.hasPII) {
    warnings.push(
      `⚠️ PII Detected: ${piiResult.types.join(', ')} (${piiResult.matches.reduce((sum, m) => sum + m.count, 0)} instances)`
    );
  }

  if (injectionResult.hasInjection) {
    warnings.push(
      `🚨 Prompt Injection Detected: Risk score ${injectionResult.riskScore.toFixed(0)}/100`
    );
  }

  // Calculate overall risk score
  const riskScore = Math.max(
    injectionResult.riskScore,
    piiResult.hasPII ? 30 : 0
  );

  return {
    hasPII: piiResult.hasPII,
    hasInjection: injectionResult.hasInjection,
    piiTypes: piiResult.types,
    riskScore,
    warnings,
  };
}

