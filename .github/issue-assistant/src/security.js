/**
 * Security Validation Module for MSDO Issue Assistant
 * 
 * SECURITY DESIGN:
 * - Core detection logic is in code (open source)
 * - Specific patterns can be overridden via GitHub Secrets (hidden)
 * - This prevents attackers from seeing exact patterns to bypass
 * 
 * Pattern sources (in priority order):
 * 1. GitHub Secrets (if provided) - hidden from attackers
 * 2. Built-in patterns (visible in code) - baseline protection
 */

// Built-in patterns - visible in code, provides baseline protection
// Additional/custom patterns should be stored in GitHub Secrets
const DEFAULT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)/i,
  /disregard\s+(your\s+)?instructions/i,
  /you\s+are\s+now/i,
  /pretend\s+(to\s+be|you)/i,
  /system\s*prompt/i,
  /jailbreak/i,
  /<\|.*\|>/i,
  /\[\[.*\]\]/i,
];

const DEFAULT_SUSPICIOUS_PATTERNS = [
  /\@(dependabot|github-actions)/i,
  /merge\s+this/i,
  /webhook/i,
];

/**
 * Compile patterns from various sources
 * Secrets take priority over defaults
 */
function compilePatterns(secretPatterns, defaultPatterns) {
  if (secretPatterns && Array.isArray(secretPatterns)) {
    return secretPatterns.map(p => {
      if (typeof p === 'string') {
        const match = p.match(/^\/(.*)\/([gimsuy]*)$/);
        if (match) {
          return new RegExp(match[1], match[2]);
        }
        return new RegExp(p, 'i');
      }
      return p;
    });
  }
  return defaultPatterns;
}

/**
 * Detect prompt injection attempts
 */
function detectPromptInjection(content, customPatterns) {
  const patterns = compilePatterns(customPatterns, DEFAULT_INJECTION_PATTERNS);
  const normalizedContent = content
    .replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7E\s]/g, ' ');
  
  const detected = [];
  for (const pattern of patterns) {
    if (pattern.test(normalizedContent)) {
      detected.push('pattern_match');
    }
  }
  
  return {
    detected: detected.length > 0,
    count: detected.length
  };
}

/**
 * Detect suspicious content
 */
function detectSuspiciousContent(content, customPatterns) {
  const patterns = compilePatterns(customPatterns, DEFAULT_SUSPICIOUS_PATTERNS);
  const detected = [];
  
  for (const pattern of patterns) {
    if (pattern.test(content)) {
      detected.push('suspicious_match');
    }
  }
  
  // Check for excessive repetition (DoS attempt)
  const words = content.toLowerCase().split(/\s+/);
  const wordCounts = {};
  for (const word of words) {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  }
  const maxRepetition = Math.max(...Object.values(wordCounts), 0);
  if (maxRepetition > 50) {
    detected.push('excessive_repetition');
  }
  
  return {
    detected: detected.length > 0,
    count: detected.length
  };
}

/**
 * Rate limiting using issue comment history as storage
 */
async function checkRateLimit(github, context, userId, limitPerHour) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  try {
    const { data: issues } = await github.rest.issues.listForRepo({
      owner: context.repo.owner,
      repo: context.repo.repo,
      state: 'all',
      since: oneHourAgo,
      per_page: 50
    });
    
    let responseCount = 0;
    for (const issue of issues) {
      if (issue.user.id === userId) {
        const { data: comments } = await github.rest.issues.listComments({
          owner: context.repo.owner,
          repo: context.repo.repo,
          issue_number: issue.number,
          since: oneHourAgo
        });
        
        responseCount += comments.filter(c => 
          c.body && c.body.includes('<!-- msdo-issue-assistant -->')
        ).length;
      }
    }
    
    return {
      allowed: responseCount < limitPerHour,
      currentCount: responseCount
    };
  } catch (error) {
    // SECURITY: Fail closed
    console.error('Rate limit check failed:', error.message);
    return { allowed: false, error: error.message };
  }
}

/**
 * Sanitize input
 */
function sanitizeInput(content, maxLength) {
  if (!content) return '';
  
  let sanitized = content
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength) + '... [truncated]';
  }
  
  return sanitized;
}

/**
 * Detect issue type from title and body
 */
function detectIssueType(title, body) {
  const content = (title + ' ' + body).toLowerCase();
  
  const bugScore = ['bug', 'error', 'fail', 'crash', 'broken', 'not working'].filter(w => content.includes(w)).length;
  const featureScore = ['feature', 'request', 'enhancement', 'suggestion', 'add support'].filter(w => content.includes(w)).length;
  const questionScore = ['how to', 'how do', 'question', 'help', 'possible'].filter(w => content.includes(w)).length;
  
  if (bugScore >= featureScore && bugScore >= questionScore) return 'bug';
  if (featureScore >= questionScore) return 'feature';
  return 'question';
}

/**
 * Main validation function
 */
async function validateRequest({ 
  github, 
  context, 
  maxInputLength, 
  rateLimitPerHour,
  customInjectionPatterns,
  customSuspiciousPatterns
}) {
  const errors = [];
  const issue = context.payload.issue;
  const comment = context.payload.comment;
  
  const content = comment ? comment.body : issue.body;
  const title = issue.title || '';
  const userId = comment ? comment.user.login : issue.user.login;
  const userIdNum = comment ? comment.user.id : issue.user.id;
  const userType = comment ? comment.user.type : issue.user.type;
  
  // CHECK 1: Don't respond to bots
  if (userType === 'Bot') {
    errors.push('Bot users not processed');
    return { shouldRespond: false, errors };
  }
  
  // CHECK 2: Input validation
  if (!content || content.length === 0) {
    errors.push('Empty content');
    return { shouldRespond: false, errors };
  }
  
  if (content.length > maxInputLength) {
    errors.push('Content exceeds maximum length');
  }
  
  // CHECK 3: Prompt injection
  const injectionCheck = detectPromptInjection(content, customInjectionPatterns);
  if (injectionCheck.detected) {
    errors.push('Potential prompt injection detected');
    console.log('Injection attempt from ' + userId + ': ' + injectionCheck.count + ' patterns matched');
  }
  
  // CHECK 4: Suspicious content
  const suspiciousCheck = detectSuspiciousContent(content, customSuspiciousPatterns);
  if (suspiciousCheck.detected) {
    errors.push('Suspicious content detected');
  }
  
  // CHECK 5: Rate limiting
  const rateLimit = await checkRateLimit(github, context, userIdNum, rateLimitPerHour);
  if (!rateLimit.allowed) {
    errors.push('Rate limit exceeded');
  }
  
  // CHECK 6: Max responses per issue
  if (comment) {
    const { data: comments } = await github.rest.issues.listComments({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: issue.number
    });
    
    const botComments = comments.filter(c => 
      c.body && c.body.includes('<!-- msdo-issue-assistant -->')
    );
    
    if (botComments.length >= 3) {
      errors.push('Maximum bot responses reached');
    }
  }
  
  return {
    shouldRespond: errors.length === 0,
    errors,
    sanitizedContent: sanitizeInput(content, maxInputLength),
    issueType: detectIssueType(title, content)
  };
}

module.exports = {
  validateRequest,
  detectPromptInjection,
  detectSuspiciousContent,
  sanitizeInput,
  detectIssueType,
  checkRateLimit
};
