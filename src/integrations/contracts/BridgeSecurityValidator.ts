/**
 * BridgeSecurityValidator.ts
 * Client-side input validation and security policy enforcer for Android WebView
 * and Desktop (Tauri/Electron) IPC boundaries.
 * Enforces origin validation, payload bounds checking, and parameter sanitization.
 */

export interface ValidatedBridgeCommand {
  command: string;
  params: Record<string, any>;
  timestamp: number;
}

export class BridgeSecurityValidator {
  public static readonly MAX_STRING_LENGTH = 1024;
  public static readonly MAX_JSON_PAYLOAD_SIZE = 65536; // 64 KB
  public static readonly MIN_WAKELOCK_TIMEOUT_MS = 1000; // 1 second
  public static readonly MAX_WAKELOCK_TIMEOUT_MS = 86400000; // 24 hours

  /**
   * Sanitizes generic string inputs to prevent XSS or format injection across bridge
   */
  public static sanitizeString(input: unknown, maxLength = BridgeSecurityValidator.MAX_STRING_LENGTH): string {
    if (typeof input !== 'string') return '';
    return input
      .trim()
      .slice(0, maxLength)
      .replace(/[<>]/g, ''); // Strip potential HTML tags
  }

  /**
   * Validates WakeLock acquisition parameters
   */
  public static validateWakeLockParams(tag: unknown, timeoutMs: unknown): { tag: string; timeoutMs: number } {
    const sanitizedTag = this.sanitizeString(tag, 128) || 'FlocusEngine:DefaultWakeLock';
    let sanitizedTimeout = typeof timeoutMs === 'number' && !isNaN(timeoutMs) ? timeoutMs : 3600000;

    sanitizedTimeout = Math.max(
      this.MIN_WAKELOCK_TIMEOUT_MS,
      Math.min(this.MAX_WAKELOCK_TIMEOUT_MS, sanitizedTimeout)
    );

    return { tag: sanitizedTag, timeoutMs: sanitizedTimeout };
  }

  /**
   * Validates study intensity rating strictly to 1..5
   */
  public static validateIntensityRating(rating: unknown): 1 | 2 | 3 | 4 | 5 {
    if (typeof rating === 'number' && Number.isInteger(rating) && rating >= 1 && rating <= 5) {
      return rating as 1 | 2 | 3 | 4 | 5;
    }
    return 3; // Default moderate intensity
  }

  /**
   * Validates media notification progress percent to 0.0 .. 1.0
   */
  public static validateProgressPercent(percent: unknown): number {
    if (typeof percent === 'number' && !isNaN(percent)) {
      return Math.max(0.0, Math.min(1.0, percent));
    }
    return 0.0;
  }

  /**
   * Validates complete JSON bridge payload size and parses safely
   */
  public static safeParseBridgePayload<T = Record<string, any>>(jsonString: unknown): { success: boolean; data?: T; error?: string } {
    if (typeof jsonString !== 'string') {
      return { success: false, error: 'Payload must be a string' };
    }

    if (jsonString.length > this.MAX_JSON_PAYLOAD_SIZE) {
      return { success: false, error: `Payload exceeds max limit of ${this.MAX_JSON_PAYLOAD_SIZE} bytes` };
    }

    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, error: 'Parsed JSON is not an object' };
      }
      return { success: true, data: parsed as T };
    } catch (e: any) {
      return { success: false, error: `JSON parse error: ${e?.message || e}` };
    }
  }

  /**
   * Checks whether the current window origin is authorized for native bridge invocation
   */
  public static isAuthorizedOrigin(allowedOrigins: string[] = ['*']): boolean {
    if (typeof window === 'undefined') return false;
    if (allowedOrigins.includes('*')) return true;

    try {
      const currentOrigin = window.location.origin;
      return allowedOrigins.includes(currentOrigin);
    } catch {
      return false;
    }
  }
}
