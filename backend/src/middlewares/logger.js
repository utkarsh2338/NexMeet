/**
 * Request Logging Middleware
 * Logs all incoming requests with timing information
 */

export const requestLogger = (req, res, next) => {
    const startTime = Date.now();

    // Log request
    console.log(`\n📨 ${req.method} ${req.originalUrl}`);

    if (process.env.NODE_ENV === 'development') {
        if (Object.keys(req.query).length > 0) {
            console.log('  Query:', req.query);
        }
        if (req.body && Object.keys(req.body).length > 0) {
            console.log('  Body:', req.body);
        }
    }

    // Log response
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const statusColor = res.statusCode >= 500 ? '🔴' :
            res.statusCode >= 400 ? '🟡' :
                res.statusCode >= 300 ? '🔵' : '🟢';

        console.log(`${statusColor} ${req.method} ${req.originalUrl} - ${res.statusCode} [${duration}ms]`);
    });

    next();
};

/**
 * Socket.IO Event Logger
 */
export const socketLogger = (eventName, data) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`🔌 Socket Event: ${eventName}`, data ? JSON.stringify(data).substring(0, 100) : '');
    }
};
