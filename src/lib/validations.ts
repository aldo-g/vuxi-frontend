/**
 * Validation Utilities - Input Validation and Normalization
 * 
 * Collection of validation functions for user inputs including
 * URL normalization, email validation, and password strength
 * checking with detailed error messaging.
 * 
 * @responsibilities
 * - Validates and normalizes website URLs
 * - Provides email format validation
 * - Implements password strength requirements
 * - Returns detailed validation error messages
 * - Ensures consistent input validation across forms
 */

// Private/reserved IP ranges that must never be fetched (SSRF protection)
const SSRF_BLOCKED_PATTERNS = [
  // Loopback
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^::1$/,
  // Private RFC 1918
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  // Link-local / APIPA
  /^169\.254\.\d+\.\d+$/,
  /^fe80:/i,
  // AWS/GCP/Azure metadata endpoints
  /^metadata\.google\.internal$/i,
  /^169\.254\.169\.254$/,
  // Unroutable / broadcast
  /^0\.0\.0\.0$/,
  /^255\.255\.255\.255$/,
  // IPv6 private
  /^fc[0-9a-f]{2}:/i,
  /^fd[0-9a-f]{2}:/i,
];

function isBlockedHostname(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, ''); // strip IPv6 brackets
  return SSRF_BLOCKED_PATTERNS.some((pattern) => pattern.test(h));
}

// URL validation and normalization
export const validateAndNormalizeUrl = (url: string): {
  isValid: boolean;
  normalizedUrl: string;
  error?: string
} => {
  if (!url || !url.trim()) {
    return { isValid: false, normalizedUrl: url, error: 'Please enter a website URL' };
  }

  const trimmedUrl = url.trim();

  // Only allow http/https schemes
  const schemeMatch = trimmedUrl.match(/^([a-zA-Z][a-zA-Z0-9+\-.]*):\/\//);
  if (schemeMatch && !['http', 'https'].includes(schemeMatch[1].toLowerCase())) {
    return {
      isValid: false,
      normalizedUrl: trimmedUrl,
      error: 'Only http:// and https:// URLs are supported',
    };
  }

  // Try the URL as-is first
  try {
    const testUrl = new URL(trimmedUrl);
    if (!['http:', 'https:'].includes(testUrl.protocol)) {
      return {
        isValid: false,
        normalizedUrl: trimmedUrl,
        error: 'Only http:// and https:// URLs are supported',
      };
    }
    if (isBlockedHostname(testUrl.hostname)) {
      return {
        isValid: false,
        normalizedUrl: trimmedUrl,
        error: 'This URL is not allowed. Please enter a publicly accessible website.',
      };
    }
    return { isValid: true, normalizedUrl: trimmedUrl };
  } catch {
    // Failed, try adding https://
  }

  // Try adding https:// prefix
  try {
    const withHttps = `https://${trimmedUrl}`;
    const testUrl = new URL(withHttps);

    const hostname = testUrl.hostname;

    if (!hostname.includes('.') || !/^[a-zA-Z0-9.-]+$/.test(hostname)) {
      return {
        isValid: false,
        normalizedUrl: trimmedUrl,
        error: 'Please enter a valid website URL (e.g., example.com or https://example.com)'
      };
    }

    if (isBlockedHostname(hostname)) {
      return {
        isValid: false,
        normalizedUrl: trimmedUrl,
        error: 'This URL is not allowed. Please enter a publicly accessible website.',
      };
    }

    return { isValid: true, normalizedUrl: withHttps };
  } catch {
    return {
      isValid: false,
      normalizedUrl: trimmedUrl,
      error: 'Please enter a valid website URL (e.g., example.com or https://example.com)'
    };
  }
};

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
export const validatePassword = (password: string): { 
  isValid: boolean; 
  errors: string[] 
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};