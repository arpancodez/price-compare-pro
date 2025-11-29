/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures in microservices
 */

interface CircuitState {
  status: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  lastFailureTime: number;
  successCount: number;
}

export class CircuitBreaker {
  private state: CircuitState = {
    status: 'CLOSED',
    failures: 0,
    lastFailureTime: 0,
    successCount: 0,
  };

  private readonly failureThreshold: number = 5;
  private readonly successThreshold: number = 2;
  private readonly timeout: number = 60000; // 1 minute

  /**
   * Check if circuit is open (service unavailable)
   */
  isOpen(): boolean {
    if (this.state.status === 'OPEN') {
      const timeSinceLastFailure = Date.now() - this.state.lastFailureTime;
      if (timeSinceLastFailure > this.timeout) {
        this.halfOpen();
        return false;
      }
      return true;
    }
    return false;
  }

  /**
   * Record a successful call
   */
  recordSuccess(): void {
    if (this.state.status === 'HALF_OPEN') {
      this.state.successCount++;
      if (this.state.successCount >= this.successThreshold) {
        this.close();
      }
    } else if (this.state.status === 'CLOSED') {
      this.state.failures = 0;
    }
  }

  /**
   * Record a failed call
   */
  recordFailure(): void {
    this.state.failures++;
    this.state.lastFailureTime = Date.now();

    if (this.state.failures >= this.failureThreshold) {
      this.open();
    }
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(
    fn: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    if (this.isOpen()) {
      if (fallback) {
        return fallback();
      }
      throw new Error('Circuit breaker is OPEN');
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      if (fallback) {
        return fallback();
      }
      throw error;
    }
  }

  /**
   * Open the circuit
   */
  private open(): void {
    this.state.status = 'OPEN';
    this.state.lastFailureTime = Date.now();
  }

  /**
   * Transition to half-open state
   */
  private halfOpen(): void {
    this.state.status = 'HALF_OPEN';
    this.state.successCount = 0;
  }

  /**
   * Close the circuit (resume normal operation)
   */
  private close(): void {
    this.state.status = 'CLOSED';
    this.state.failures = 0;
    this.state.successCount = 0;
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return { ...this.state };
  }

  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.state = {
      status: 'CLOSED',
      failures: 0,
      lastFailureTime: 0,
      successCount: 0,
    };
  }
}
