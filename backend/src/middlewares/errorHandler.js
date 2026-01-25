/**
 * Global Error Handler Middleware
 * Catches all errors and sends consistent error responses
 */

export const errorHandler = (err, req, res, next) => {
    // Log error details for debugging
    console.error('❌ Error occurred:');
    console.error('  Message:', err.message);
    console.error('  Status:', err.status || 500);
    if (process.env.NODE_ENV === 'development') {
        console.error('  Stack:', err.stack);
    }

    // Determine status code
    const statusCode = err.status || err.statusCode || 500;

    // Send error response
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        error: {
            code: err.code || 'INTERNAL_ERROR',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        },
        timestamp: new Date().toISOString()
    });
};

/**
 * 404 Not Found Handler
 */
export const notFoundHandler = (req, res, next) => {
    const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
    error.status = 404;
    error.code = 'ROUTE_NOT_FOUND';
    next(error);
};

/**
 * Async Error Wrapper
 * Wraps async route handlers to catch errors automatically
 */
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Custom Error Classes
 */
export class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
        this.status = 400;
        this.code = 'VALIDATION_ERROR';
    }
}

export class NotFoundError extends Error {
    constructor(message = 'Resource not found') {
        super(message);
        this.name = 'NotFoundError';
        this.status = 404;
        this.code = 'NOT_FOUND';
    }
}

export class UnauthorizedError extends Error {
    constructor(message = 'Unauthorized access') {
        super(message);
        this.name = 'UnauthorizedError';
        this.status = 401;
        this.code = 'UNAUTHORIZED';
    }
}

export class DatabaseError extends Error {
    constructor(message = 'Database operation failed') {
        super(message);
        this.name = 'DatabaseError';
        this.status = 500;
        this.code = 'DATABASE_ERROR';
    }
}
