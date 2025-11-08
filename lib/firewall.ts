export type Decision = 'allow' | 'block' | 'modify' | 'sanitize';

export interface Risk {
  type: 'pii_email' | 'pii_ssn' | 'pii_phone' | 'pii_credit_card' | 'injection' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  location?: { start: number; end: number };
}

export interface Explanation {
  rule: string;
  matched: boolean;
  reason: string;
}

export interface FirewallRule {
  id: string;
  name: string;
  enabled: boolean;
  type: 'pii' | 'injection' | 'custom';
  pattern?: string; // Regex pattern
  action: 'block' | 'modify' | 'sanitize' | 'warn';
  replacement?: string; // For modify/sanitize actions
}

export interface EvaluationResult {
  decision: Decision;
  promptModified: string;
  risks: Risk[];
  explain: Explanation[];
}

// Regex patterns for PII detection
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const SSN_REGEX = /\b\d{3}-?\d{2}-?\d{4}\b/g;
const PHONE_REGEX = /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g;
const CREDIT_CARD_REGEX = /\b(?:\d{4}[-\s]?){3}\d{4}\b/g;

// Prompt injection patterns
const INJECTION_PATTERNS = [
  { pattern: /ignore\s+(previous|above|all)\s+(instructions|commands|rules)/gi, name: 'ignore_instructions' },
  { pattern: /forget\s+(everything|all|previous)/gi, name: 'forget_previous' },
  { pattern: /you\s+are\s+now\s+(a|an)\s+/gi, name: 'role_manipulation' },
  { pattern: /system\s*:\s*/gi, name: 'system_prefix' },
  { pattern: /assistant\s*:\s*/gi, name: 'assistant_prefix' },
  { pattern: /\[INST\]/gi, name: 'inst_tag' },
  { pattern: /<\|im_start\|>/gi, name: 'im_start' },
  { pattern: /<\|im_end\|>/gi, name: 'im_end' },
  { pattern: /roleplay/gi, name: 'roleplay' },
  { pattern: /pretend\s+to\s+be/gi, name: 'pretend' },
  { pattern: /act\s+as\s+if/gi, name: 'act_as_if' },
  { pattern: /disregard\s+(the|your)\s+(previous|above)/gi, name: 'disregard' },
  { pattern: /new\s+instructions/gi, name: 'new_instructions' },
  { pattern: /override/gi, name: 'override' },
  { pattern: /bypass/gi, name: 'bypass' },
  { pattern: /jailbreak/gi, name: 'jailbreak' },
];

/**
 * Evaluates a prompt and response against firewall rules
 * @param prompt - The user's input prompt
 * @param response - The AI's response (optional, for response-side checks)
 * @param rules - Array of firewall rules to evaluate against
 * @returns Evaluation result with decision, modified prompt, risks, and explanations
 */
export function evaluatePrompt(
  prompt: string,
  response: string | null = null,
  rules: FirewallRule[] = []
): EvaluationResult {
  const risks: Risk[] = [];
  const explain: Explanation[] = [];
  let promptModified = prompt;
  let decision: Decision = 'allow';

  // Default rules if none provided
  const defaultRules: FirewallRule[] = [
    {
      id: 'default_pii_email',
      name: 'Detect Email Addresses',
      enabled: true,
      type: 'pii',
      action: 'sanitize',
      replacement: '[EMAIL_REDACTED]',
    },
    {
      id: 'default_pii_ssn',
      name: 'Detect SSNs',
      enabled: true,
      type: 'pii',
      action: 'block',
    },
    {
      id: 'default_injection',
      name: 'Detect Prompt Injections',
      enabled: true,
      type: 'injection',
      action: 'block',
    },
  ];

  const activeRules = rules.length > 0 ? rules.filter((r) => r.enabled) : defaultRules;

  // Check for PII in prompt
  const piiChecks = [
    { type: 'pii_email' as const, regex: EMAIL_REGEX, severity: 'medium' as const, name: 'Email' },
    { type: 'pii_ssn' as const, regex: SSN_REGEX, severity: 'critical' as const, name: 'SSN' },
    { type: 'pii_phone' as const, regex: PHONE_REGEX, severity: 'medium' as const, name: 'Phone' },
    { type: 'pii_credit_card' as const, regex: CREDIT_CARD_REGEX, severity: 'high' as const, name: 'Credit Card' },
  ];

  for (const check of piiChecks) {
    const matches = [...prompt.matchAll(new RegExp(check.regex.source, check.regex.flags))];
    if (matches.length > 0) {
      const risk: Risk = {
        type: check.type,
        severity: check.severity,
        message: `Detected ${check.name}: ${matches.length} instance(s) found`,
        location: matches[0] ? { start: matches[0].index!, end: matches[0].index! + matches[0][0].length } : undefined,
      };
      risks.push(risk);

      // Find matching rule
      const matchingRule = activeRules.find(
        (r) => r.type === 'pii' && (r.pattern ? new RegExp(r.pattern, 'gi').test(check.name) : true)
      );

      if (matchingRule) {
        explain.push({
          rule: matchingRule.name,
          matched: true,
          reason: `Found ${check.name} in prompt`,
        });

        // Apply rule action
        if (matchingRule.action === 'block') {
          decision = 'block';
        } else if (matchingRule.action === 'sanitize' || matchingRule.action === 'modify') {
          decision = decision === 'block' ? 'block' : 'sanitize';
          // Replace detected PII
          promptModified = promptModified.replace(
            check.regex,
            matchingRule.replacement || `[${check.name.toUpperCase()}_REDACTED]`
          );
        }
      } else {
        // Default behavior for PII
        if (check.type === 'pii_ssn') {
          decision = 'block';
          explain.push({
            rule: 'default_pii_ssn',
            matched: true,
            reason: 'SSN detected - blocking by default',
          });
        } else {
          decision = decision === 'block' ? 'block' : 'sanitize';
          promptModified = promptModified.replace(check.regex, `[${check.name.toUpperCase()}_REDACTED]`);
        }
      }
    }
  }

  // Check for prompt injection patterns
  for (const injectionPattern of INJECTION_PATTERNS) {
    const matches = [...prompt.matchAll(injectionPattern.pattern)];
    if (matches.length > 0) {
      const risk: Risk = {
        type: 'injection',
        severity: 'high',
        message: `Prompt injection detected: ${injectionPattern.name} pattern found`,
        location: matches[0] ? { start: matches[0].index!, end: matches[0].index! + matches[0][0].length } : undefined,
      };
      risks.push(risk);

      // Find matching rule
      const matchingRule = activeRules.find(
        (r) => r.type === 'injection' && (r.pattern ? new RegExp(r.pattern, 'gi').test(injectionPattern.name) : true)
      );

      if (matchingRule) {
        explain.push({
          rule: matchingRule.name,
          matched: true,
          reason: `Injection pattern "${injectionPattern.name}" detected`,
        });

        if (matchingRule.action === 'block') {
          decision = 'block';
        } else if (matchingRule.action === 'sanitize' || matchingRule.action === 'modify') {
          decision = decision === 'block' ? 'block' : 'sanitize';
          promptModified = promptModified.replace(
            injectionPattern.pattern,
            matchingRule.replacement || '[INJECTION_REMOVED]'
          );
        }
      } else {
        // Default: block injection attempts
        decision = 'block';
        explain.push({
          rule: 'default_injection',
          matched: true,
          reason: `Injection pattern "${injectionPattern.name}" detected - blocking by default`,
        });
      }
    }
  }

  // Evaluate custom rules
  for (const rule of activeRules) {
    if (rule.type === 'custom' && rule.pattern) {
      try {
        const regex = new RegExp(rule.pattern, 'gi');
        const matches = prompt.match(regex);
        if (matches) {
          explain.push({
            rule: rule.name,
            matched: true,
            reason: `Custom pattern matched: ${matches.length} occurrence(s)`,
          });

          if (rule.action === 'block') {
            decision = 'block';
          } else if (rule.action === 'sanitize' || rule.action === 'modify') {
            decision = decision === 'block' ? 'block' : 'sanitize';
            promptModified = promptModified.replace(regex, rule.replacement || '[REDACTED]');
          }
        } else {
          explain.push({
            rule: rule.name,
            matched: false,
            reason: 'Pattern did not match',
          });
        }
      } catch (error) {
        explain.push({
          rule: rule.name,
          matched: false,
          reason: `Invalid regex pattern: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }
  }

  // Check response for PII (if provided)
  if (response) {
    for (const check of piiChecks) {
      const matches = [...response.matchAll(new RegExp(check.regex.source, check.regex.flags))];
      if (matches.length > 0) {
        risks.push({
          type: check.type,
          severity: check.severity,
          message: `Detected ${check.name} in response: ${matches.length} instance(s) found`,
        });
        explain.push({
          rule: 'response_pii_check',
          matched: true,
          reason: `PII detected in AI response - ${check.name}`,
        });
      }
    }
  }

  // Final decision logic
  if (decision === 'allow' && risks.length > 0) {
    // If we have risks but no blocking rules matched, still allow but mark as modified if sanitized
    if (promptModified !== prompt) {
      decision = 'sanitize';
    }
  }

  return {
    decision,
    promptModified,
    risks,
    explain,
  };
}

