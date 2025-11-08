/**
 * Comprehensive error handling system for Hume Voice Frontend
 * Implements requirements 6.1, 6.2, 6.3, 6.4, 7.4
 */

export enum ErrorCategory {
    NETWORK = "network",
    AUDIO = "audio",
    PERMISSION = "permission",
    WEBSOCKET = "websocket",
    AUTHENTICATION = "authentication",
    VALIDATION = "validation",
    UNKNOWN = "unknown",
}

export enum ErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical",
}

export interface HumeError {
    id: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    message: string;
    userMessage: string;
    suggestedActions: string[];
    retryable: boolean;
    timestamp: Date;
    context?: Record<string, any>;
    originalError?: Error;
}

export interface RetryConfig {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    retryableErrors: ErrorCategory[];
}

export class ErrorHandler {
    private static instance: ErrorHandler;
    private errorLog: HumeError[] = [];
    private retryConfig: RetryConfig = {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
        retryableErrors: [
            ErrorCategory.NETWORK,
            ErrorCategory.WEBSOCKET,
            ErrorCategory.AUTHENTICATION,
        ],
    };

    private constructor() {}

    static getInstance(): ErrorHandler {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }
        return ErrorHandler.instance;
    }

    /**
     * Categorize error based on error type and message
     */
    categorizeError(
        error: Error | string,
        context?: Record<string, any>
    ): ErrorCategory {
        const errorMessage = typeof error === "string" ? error : error.message;
        const errorName = typeof error === "string" ? "" : error.name;

        // Network errors
        if (
            errorMessage.includes("fetch") ||
            errorMessage.includes("network") ||
            errorMessage.includes("timeout") ||
            errorName === "NetworkError"
        ) {
            return ErrorCategory.NETWORK;
        }

        // WebSocket errors
        if (
            errorMessage.includes("websocket") ||
            errorMessage.includes("WebSocket") ||
            context?.type === "websocket"
        ) {
            return ErrorCategory.WEBSOCKET;
        }

        // Audio errors
        if (
            errorMessage.includes("audio") ||
            errorMessage.includes("microphone") ||
            errorMessage.includes("MediaStream") ||
            errorName === "NotAllowedError" ||
            errorName === "NotFoundError"
        ) {
            return ErrorCategory.AUDIO;
        }

        // Permission errors
        if (
            errorMessage.includes("permission") ||
            errorMessage.includes("denied") ||
            errorName === "NotAllowedError"
        ) {
            return ErrorCategory.PERMISSION;
        }

        // Authentication errors
        if (
            errorMessage.includes("auth") ||
            errorMessage.includes("token") ||
            errorMessage.includes("unauthorized") ||
            context?.status === 401 ||
            context?.status === 403
        ) {
            return ErrorCategory.AUTHENTICATION;
        }

        // Validation errors
        if (
            errorMessage.includes("validation") ||
            errorMessage.includes("invalid") ||
            context?.status === 400
        ) {
            return ErrorCategory.VALIDATION;
        }

        return ErrorCategory.UNKNOWN;
    }

    /**
     * Determine error severity
     */
    determineSeverity(
        category: ErrorCategory,
        context?: Record<string, any>
    ): ErrorSeverity {
        switch (category) {
            case ErrorCategory.PERMISSION:
            case ErrorCategory.AUTHENTICATION:
                return ErrorSeverity.CRITICAL;

            case ErrorCategory.WEBSOCKET:
            case ErrorCategory.AUDIO:
                return ErrorSeverity.HIGH;

            case ErrorCategory.NETWORK:
                return context?.status >= 500
                    ? ErrorSeverity.HIGH
                    : ErrorSeverity.MEDIUM;

            case ErrorCategory.VALIDATION:
                return ErrorSeverity.MEDIUM;

            default:
                return ErrorSeverity.LOW;
        }
    }

    /**
     * Generate user-friendly error message and suggested actions
     */
    generateUserMessage(
        category: ErrorCategory,
        originalMessage: string
    ): {
        userMessage: string;
        suggestedActions: string[];
    } {
        switch (category) {
            case ErrorCategory.NETWORK:
                return {
                    userMessage: "Network connection issue detected",
                    suggestedActions: [
                        "Check your internet connection",
                        "Try refreshing the page",
                        "Wait a moment and try again",
                    ],
                };

            case ErrorCategory.WEBSOCKET:
                return {
                    userMessage: "Voice connection interrupted",
                    suggestedActions: [
                        "Check your internet connection",
                        "Click 'Reconnect' to restore voice features",
                        "Refresh the page if issues persist",
                    ],
                };

            case ErrorCategory.AUDIO:
                return {
                    userMessage: "Microphone access issue",
                    suggestedActions: [
                        "Check microphone permissions in your browser",
                        "Ensure your microphone is connected and working",
                        "Try using a different microphone",
                        "Refresh the page and grant permissions when prompted",
                    ],
                };

            case ErrorCategory.PERMISSION:
                return {
                    userMessage: "Permission required for voice features",
                    suggestedActions: [
                        "Grant microphone permission when prompted",
                        "Check browser settings for microphone access",
                        "Refresh the page to retry permission request",
                    ],
                };

            case ErrorCategory.AUTHENTICATION:
                return {
                    userMessage: "Authentication failed",
                    suggestedActions: [
                        "Please log in again",
                        "Check your internet connection",
                        "Contact support if the issue persists",
                    ],
                };

            case ErrorCategory.VALIDATION:
                return {
                    userMessage: "Invalid input or configuration",
                    suggestedActions: [
                        "Check your input and try again",
                        "Refresh the page to reset settings",
                        "Contact support if the issue persists",
                    ],
                };

            default:
                return {
                    userMessage: "An unexpected error occurred",
                    suggestedActions: [
                        "Try refreshing the page",
                        "Check your internet connection",
                        "Contact support if the issue persists",
                    ],
                };
        }
    }

    /**
     * Create a structured error object
     */
    createError(
        error: Error | string,
        context?: Record<string, any>
    ): HumeError {
        const category = this.categorizeError(error, context);
        const severity = this.determineSeverity(category, context);
        const { userMessage, suggestedActions } = this.generateUserMessage(
            category,
            typeof error === "string" ? error : error.message
        );

        const humeError: HumeError = {
            id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            category,
            severity,
            message: typeof error === "string" ? error : error.message,
            userMessage,
            suggestedActions,
            retryable: this.retryConfig.retryableErrors.includes(category),
            timestamp: new Date(),
            context,
            originalError: typeof error === "string" ? undefined : error,
        };

        // Log error
        this.logError(humeError);

        return humeError;
    }

    /**
     * Log error for debugging and analytics
     */
    private logError(error: HumeError): void {
        // Add to in-memory log (keep last 100 errors)
        this.errorLog.unshift(error);
        if (this.errorLog.length > 100) {
            this.errorLog = this.errorLog.slice(0, 100);
        }

        // Console logging for development
        if (process.env.NODE_ENV === "development") {
            console.group(`🚨 Hume Error [${error.severity.toUpperCase()}]`);
            console.error("Category:", error.category);
            console.error("Message:", error.message);
            console.error("User Message:", error.userMessage);
            console.error("Suggested Actions:", error.suggestedActions);
            console.error("Context:", error.context);
            if (error.originalError) {
                console.error("Original Error:", error.originalError);
            }
            console.groupEnd();
        }

        // TODO: Send to analytics/monitoring service in production
        // this.sendToAnalytics(error);
    }

    /**
     * Retry mechanism with exponential backoff
     */
    async retry<T>(
        operation: () => Promise<T>,
        errorContext?: Record<string, any>,
        customConfig?: Partial<RetryConfig>
    ): Promise<T> {
        const config = { ...this.retryConfig, ...customConfig };
        let lastError: HumeError | null = null;

        for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
            try {
                return await operation();
            } catch (error) {
                const humeError = this.createError(error as Error, {
                    ...errorContext,
                    attempt,
                    maxAttempts: config.maxAttempts,
                });

                lastError = humeError;

                // Don't retry if error is not retryable or this is the last attempt
                if (!humeError.retryable || attempt === config.maxAttempts) {
                    throw humeError;
                }

                // Calculate delay with exponential backoff
                const delay = Math.min(
                    config.baseDelay *
                        Math.pow(config.backoffMultiplier, attempt - 1),
                    config.maxDelay
                );

                console.log(
                    `Retrying operation in ${delay}ms (attempt ${attempt}/${config.maxAttempts})`
                );
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }

        throw lastError;
    }

    /**
     * Get recent errors for debugging
     */
    getRecentErrors(limit: number = 10): HumeError[] {
        return this.errorLog.slice(0, limit);
    }

    /**
     * Clear error log
     */
    clearErrorLog(): void {
        this.errorLog = [];
    }

    /**
     * Get error statistics
     */
    getErrorStats(): {
        total: number;
        byCategory: Record<ErrorCategory, number>;
        bySeverity: Record<ErrorSeverity, number>;
    } {
        const stats = {
            total: this.errorLog.length,
            byCategory: {} as Record<ErrorCategory, number>,
            bySeverity: {} as Record<ErrorSeverity, number>,
        };

        // Initialize counters
        Object.values(ErrorCategory).forEach((category) => {
            stats.byCategory[category] = 0;
        });
        Object.values(ErrorSeverity).forEach((severity) => {
            stats.bySeverity[severity] = 0;
        });

        // Count errors
        this.errorLog.forEach((error) => {
            stats.byCategory[error.category]++;
            stats.bySeverity[error.severity]++;
        });

        return stats;
    }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Utility functions for common error scenarios
export const handleNetworkError = (
    error: Error,
    context?: Record<string, any>
) => {
    return errorHandler.createError(error, { ...context, type: "network" });
};

export const handleWebSocketError = (
    error: Error,
    context?: Record<string, any>
) => {
    return errorHandler.createError(error, { ...context, type: "websocket" });
};

export const handleAudioError = (
    error: Error,
    context?: Record<string, any>
) => {
    return errorHandler.createError(error, { ...context, type: "audio" });
};

export const handlePermissionError = (
    error: Error,
    context?: Record<string, any>
) => {
    return errorHandler.createError(error, { ...context, type: "permission" });
};

// React hook for error handling
export const useErrorHandler = () => {
    return {
        handleError: (error: Error | string, context?: Record<string, any>) =>
            errorHandler.createError(error, context),
        retry: errorHandler.retry.bind(errorHandler),
        getRecentErrors: errorHandler.getRecentErrors.bind(errorHandler),
        getErrorStats: errorHandler.getErrorStats.bind(errorHandler),
        clearErrors: errorHandler.clearErrorLog.bind(errorHandler),
    };
};
