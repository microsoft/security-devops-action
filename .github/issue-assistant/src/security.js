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

// Built-in patterns - provides baseline protection
// Additional/custom patterns can be stored in GitHub Secrets
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

function compilePatterns(secretPatterns, defaultPatterns) {
  if (secretPatterns && Array.isArray(secretPatterns)) {
    return secretPatterns.map(p => {
      if (typeof p === 'string') {
        const match = p.match(/^\/(.*)\/([gimsuy]*)$/);
        if (match) {
          const safeFlags = match[2].replace(/[gy]/g, '');
          return new RegExp(match[1], safeFlags);
        }
        return new RegExp(p, 'i');
      }
      if (p instanceof RegExp) {
        const safeFlags = p.flags.replace(/[gy]/g, '');
        return new RegExp(p.source, safeFlags);
      }
      return p;
    });
  }
  return defaultPatterns;
}

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

function detectSuspiciousContent(content, customPatterns) {
  const patterns = compilePatterns(customPatterns, DEFAULT_SUSPICIOUS_PATTERNS);
  const detected = [];
  
  for (const pattern of patterns) {
    if (pattern.test(content)) {
      detected.push('suspicious_match');
    }
  }
  
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

async function checkRateLimit(github, context, userId, limitPerHour) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  try {
    let responseCount = 0;
    let page = 1;
    const perPage = 100;
    
    while (true) {
      const { data: comments } = await github.rest.issues.listCommentsForRepo({
        owner: context.repo.owner,
        repo: context.repo.repo,
        since: oneHourAgo,
        per_page: perPage,
        page: page
      });
      
      if (comments.length === 0) break;
      
      for (const comment of comments) {
        if (comment.body && comment.body.includes('<!-- msdo-issue-assistant -->')) {
          try {
            const { data: issue } = await github.rest.issues.get({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: comment.issue_url.split('/').pop()
            });
            
            if (issue.user && issue.user.id === userId) {
              responseCount++;
            }
          } catch (e) {
            responseCount++;
          }
        }
      }
      
      if (comments.length < perPage) break;
      page++;
      
      if (page > 10) break;
    }
    
    return {
      allowed: responseCount < limitPerHour,
      currentCount: responseCount
    };
  } catch (error) {
    console.error('Rate limit check failed:', error.message);
    return { allowed: false, error: error.message };
  }
}

function sanitizeInput(content, maxLength) {
  if (!content) return '';
  
  let sanitized = content
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[^\S\r\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength) + '... [truncated]';
  }
  
  return sanitized;
}

function detectIssueType(title, body) {
  const content = (title + ' ' + body).toLowerCase();
  
  const bugScore = ['bug', 'error', 'fail', 'crash', 'broken', 'not working'].filter(w => content.includes(w)).length;
  const featureScore = ['feature', 'request', 'enhancement', 'suggestion', 'add support'].filter(w => content.includes(w)).length;
  const questionScore = ['how to', 'how do', 'question', 'help', 'possible'].filter(w => content.includes(w)).length;
  
  if (bugScore === 0 && featureScore === 0 && questionScore === 0) return 'unknown';
  if (bugScore >= featureScore && bugScore >= questionScore) return 'bug';
  if (featureScore >= questionScore) return 'feature';
  return 'question';
}

async function validateRequest({ 
  github, 
  context, 
  maxInputLength, 
  rateLimitPerHour,
  maxBotResponses,
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
  
  if (userType === 'Bot') {
    errors.push('Bot users not processed');
    return { shouldRespond: false, errors };
  }
  
  if (!content || content.length === 0) {
    errors.push('Empty content');
    return { shouldRespond: false, errors };
  }
  
  if (content.length > maxInputLength) {
    errors.push('Content exceeds maximum length');
  }
  
  const injectionCheck = detectPromptInjection(content, customInjectionPatterns);
  if (injectionCheck.detected) {
    errors.push('Potential prompt injection detected');
    console.log('Injection attempt from ' + userId + ': ' + injectionCheck.count + ' patterns matched');
  }
  
  const suspiciousCheck = detectSuspiciousContent(content, customSuspiciousPatterns);
  if (suspiciousCheck.detected) {
    errors.push('Suspicious content detected');
  }
  
  const rateLimit = await checkRateLimit(github, context, userIdNum, rateLimitPerHour);
  if (!rateLimit.allowed) {
    errors.push('Rate limit exceeded');
  }
  
  // Note: Bot response count per issue is now validated in the conversation-state step
  // of the workflow, not here. This avoids redundant validation and keeps state
  // management centralized.
  
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
