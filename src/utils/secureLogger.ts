/**
 * Secure logging utility that prevents API key and sensitive data leaks
 */

import { logger } from './logger';

interface RedactionRule {
  pattern: RegExp;
  replacement: string;
}

class SecureLogger {
  private redactionRules: RedactionRule[] = [
    // API Keys
    { pattern: /sk-[a-zA-Z0-9]{32,}/g, replacement: 'sk-[REDACTED]' },
    { pattern: /sk-or-v1-[a-fA-F0-9]{64}/g, replacement: 'sk-or-v1-[REDACTED]' },
    { pattern: /sk-ant-[a-zA-Z0-9_-]{95,}/g, replacement: 'sk-ant-[REDACTED]' },
    { pattern: /ghp_[a-zA-Z0-9]{36}/g, replacement: 'ghp_[REDACTED]' },
    { pattern: /xai-[a-zA-Z0-9_-]{20,}/g, replacement: 'xai-[REDACTED]' },
    
    // Authorization headers
    { pattern: /Bearer\s+[a-zA-Z0-9_-]+/g, replacement: 'Bearer [REDACTED]' },
    { pattern: /Authorization:\s*[^,\s]+/g, replacement: 'Authorization: [REDACTED]' },
    
    // Database URLs with credentials
    { pattern: /([a-z]+:\/\/)([^:]+):([^@]+)@/g, replacement: '$1[REDACTED]:[REDACTED]@' },
    
    // Email addresses (for privacy)
    { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL_REDACTED]' }
  ];

  private redactSensitiveData(message: any): string {
    let sanitized = typeof message === 'string' ? message : JSON.stringify(message, null, 2);
    
    for (const rule of this.redactionRules) {
      sanitized = sanitized.replace(rule.pattern, rule.replacement);
    }
    
    return sanitized;
  }

  private redactArray(params: any[]): any[] {
    return params.map(param => 
      typeof param === 'string' ? this.redactSensitiveData(param) : param
    );
  }

  /**
   * Log API key validation results securely
   */
  logApiKeyValidation(provider: string, isValid: boolean, keyLength?: number): void {
    logger.info(`API Key Validation - Provider: ${provider}, Valid: ${isValid}${keyLength ? `, Length: ${keyLength}` : ''}`);
  }

  /**
   * Log API request results without exposing sensitive data
   */
  logApiRequest(provider: string, endpoint: string, status: number, model?: string): void {
    logger.info(`API Request - Provider: ${provider}, Endpoint: ${endpoint}, Status: ${status}${model ? `, Model: ${model}` : ''}`);
  }

  /**
   * Log environment configuration without exposing secrets
   */
  logEnvironmentStatus(): void {
    const envStatus = {
      NODE_ENV: process.env.NODE_ENV || 'development',
      LOG_LEVEL: process.env.LOG_LEVEL || 'info',
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? 'PRESENT' : 'MISSING',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'PRESENT' : 'MISSING',
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? 'PRESENT' : 'MISSING',
      XAI_API_KEY: process.env.XAI_API_KEY ? 'PRESENT' : 'MISSING'
    };
    
    logger.info('Environment Status:', envStatus);
  }

  /**
   * Secure error logging with automatic redaction
   */
  error(message: any, ...optionalParams: any[]): void {
    const sanitizedMessage = this.redactSensitiveData(message);
    const sanitizedParams = this.redactArray(optionalParams);
    logger.error(sanitizedMessage, ...sanitizedParams);
  }

  /**
   * Secure warning logging with automatic redaction
   */
  warn(message: any, ...optionalParams: any[]): void {
    const sanitizedMessage = this.redactSensitiveData(message);
    const sanitizedParams = this.redactArray(optionalParams);
    logger.warn(sanitizedMessage, ...sanitizedParams);
  }

  /**
   * Secure info logging with automatic redaction
   */
  info(message: any, ...optionalParams: any[]): void {
    const sanitizedMessage = this.redactSensitiveData(message);
    const sanitizedParams = this.redactArray(optionalParams);
    logger.info(sanitizedMessage, ...sanitizedParams);
  }

  /**
   * Secure debug logging with automatic redaction
   */
  debug(message: any, ...optionalParams: any[]): void {
    const sanitizedMessage = this.redactSensitiveData(message);
    const sanitizedParams = this.redactArray(optionalParams);
    logger.debug(sanitizedMessage, ...sanitizedParams);
  }

  /**
   * Add custom redaction rule
   */
  addRedactionRule(pattern: RegExp, replacement: string): void {
    this.redactionRules.push({ pattern, replacement });
  }
}

// Export singleton instance
export const secureLogger = new SecureLogger();

// For testing purposes
export { SecureLogger };