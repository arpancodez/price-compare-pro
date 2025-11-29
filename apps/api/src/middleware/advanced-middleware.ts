import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';
import { CircuitBreaker } from '../utils/circuit-breaker';
import { RateLimiter } from '../utils/rate-limiter';
import { RequestValidator } from '../utils/request-validator';

/**
 * Advanced Middleware Stack for Price Compare Pro
 * Implements circuit breaker, rate limiting, request validation,
 * error handling, and comprehensive logging
 */

const logger = new Logger('Middleware');
const rateLimiter = new RateLimiter();
const circuitBreaker = new CircuitBreaker();
const requestValidator = new RequestValidator();

/**
 * Error handling middleware with structured logging
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  logger.error({
    errorId,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    status: err.status || 500,
  });

  res.status(err.status || 500).json({
    error: {
      id: errorId,
      message: err.message || 'Internal Server Error',
      status: err.status || 500,
    },
  });
};

/**
 * Request validation middleware
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = requestValidator.validate(req);
    if (!validation.valid) {
      return res.status(400).json({
        error: {
          message: 'Invalid request',
          details: validation.errors,
        },
      });
    }
    next();
  } catch (error) {
    errorHandler(error, req, res, next);
  }
};

/**
 * Rate limiting middleware
 */
export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const clientId = req.ip || 'unknown';
  
  if (!rateLimiter.allowRequest(clientId)) {
    logger.warn({
      message: 'Rate limit exceeded',
      clientId,
      path: req.path,
    });
    
    return res.status(429).json({
      error: {
        message: 'Too many requests. Please try again later.',
        retryAfter: rateLimiter.getRetryAfter(clientId),
      },
    });
  }
  
  next();
};

/**
 * Circuit breaker middleware for external service calls
 */
export const circuitBreakerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (circuitBreaker.isOpen()) {
    logger.error({ message: 'Circuit breaker is open' });
    return res.status(503).json({
      error: {
        message: 'Service temporarily unavailable',
      },
    });
  }
  
  next();
};

/**
 * Request tracking and monitoring middleware
 */
export const requestTracker = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  (req as any).requestId = requestId;
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info({
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  });
  
  next();
};

/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  
  next();
};
