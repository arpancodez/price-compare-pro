/**
 * Rate Limiter Implementation
 * Uses token bucket algorithm for flexible rate limiting
 */

interface BucketState {
  tokens: number;
  lastRefillTime: number;
}

export class RateLimiter {
  private buckets: Map<string, BucketState> = new Map();
  private readonly capacity: number = 100;
  private readonly refillRate: number = 10;
  private readonly refillInterval: number = 1000;

  allowRequest(clientId: string): boolean {
    let bucket = this.buckets.get(clientId);
    if (!bucket) {
      bucket = { tokens: this.capacity, lastRefillTime: Date.now() };
      this.buckets.set(clientId, bucket);
    }
    this.refillBucket(bucket);
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }
    return false;
  }

  private refillBucket(bucket: BucketState): void {
    const now = Date.now();
    const timePassed = now - bucket.lastRefillTime;
    const tokensToAdd = (timePassed / this.refillInterval) * this.refillRate;
    bucket.tokens = Math.min(this.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefillTime = now;
  }

  getRetryAfter(clientId: string): number {
    const bucket = this.buckets.get(clientId);
    if (!bucket) return 0;
    return Math.ceil((1 - bucket.tokens) / this.refillRate);
  }

  reset(clientId: string): void {
    this.buckets.delete(clientId);
  }
}
