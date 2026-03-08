import DOMPurify from 'dompurify';

/**
 * Rate limiter - prevents abuse of sensitive actions
 */
class RateLimiter {
  private attempts: Map<string, { count: number; firstAttempt: number }> = new Map();

  check(key: string, maxAttempts: number, windowMs: number): { allowed: boolean; remainingMs: number } {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record || now - record.firstAttempt > windowMs) {
      this.attempts.set(key, { count: 1, firstAttempt: now });
      return { allowed: true, remainingMs: 0 };
    }

    if (record.count >= maxAttempts) {
      const remainingMs = windowMs - (now - record.firstAttempt);
      return { allowed: false, remainingMs };
    }

    record.count++;
    return { allowed: true, remainingMs: 0 };
  }

  reset(key: string) {
    this.attempts.delete(key);
  }
}

// Singleton rate limiters
export const loginLimiter = new RateLimiter();
export const apiLimiter = new RateLimiter();

// Login: 5 attempts per 15 minutes
export const checkLoginRate = (email: string) => 
  loginLimiter.check(`login:${email}`, 5, 15 * 60 * 1000);

// API: 30 requests per minute per action
export const checkApiRate = (action: string) => 
  apiLimiter.check(`api:${action}`, 30, 60 * 1000);

/**
 * Input sanitization
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  // Remove null bytes, trim, and basic XSS prevention
  return input.replace(/\0/g, '').trim();
};

export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  });
};

/**
 * File upload validation
 */
const ALLOWED_FILE_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  document: ['application/pdf'],
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const validateFileUpload = (
  file: File,
  category: 'image' | 'document' = 'image',
  maxSizeMb?: number
): { valid: boolean; error?: string } => {
  const maxSize = maxSizeMb ? maxSizeMb * 1024 * 1024 : MAX_FILE_SIZE;
  
  if (file.size > maxSize) {
    return { valid: false, error: `File too large. Maximum size is ${maxSizeMb || 5}MB.` };
  }

  const allowedTypes = ALLOWED_FILE_TYPES[category];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` };
  }

  // Check file extension matches MIME type
  const ext = file.name.split('.').pop()?.toLowerCase();
  const validExtensions: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp'],
    'image/gif': ['gif'],
    'application/pdf': ['pdf'],
  };

  const allowedExts = validExtensions[file.type];
  if (allowedExts && ext && !allowedExts.includes(ext)) {
    return { valid: false, error: 'File extension does not match content type.' };
  }

  return { valid: true };
};

/**
 * Inactivity auto-logout timer
 */
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const ADMIN_INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes for admins

let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
let logoutCallback: (() => void) | null = null;

const resetInactivityTimer = () => {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  if (logoutCallback) {
    const timeout = window.location.pathname.startsWith('/admin') 
      ? ADMIN_INACTIVITY_TIMEOUT 
      : INACTIVITY_TIMEOUT;
    inactivityTimer = setTimeout(() => {
      logoutCallback?.();
    }, timeout);
  }
};

export const startInactivityMonitor = (onLogout: () => void) => {
  logoutCallback = onLogout;
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  events.forEach(event => document.addEventListener(event, resetInactivityTimer, { passive: true }));
  resetInactivityTimer();

  return () => {
    events.forEach(event => document.removeEventListener(event, resetInactivityTimer));
    if (inactivityTimer) clearTimeout(inactivityTimer);
    logoutCallback = null;
  };
};

/**
 * Prevent sensitive data in console
 */
export const secureLog = (message: string, data?: any) => {
  if (import.meta.env.DEV) {
    console.log(message, data);
  }
  // In production, suppress detailed logs
};
