export interface CacheOptions {
  ttl?: number; // seconds
  namespace?: string;
}

export class CacheService {
  private cache: Map<string, { value: any; expires: number }> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    return item.value as T;
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl || 300;
    const ns = options.namespace ? `${options.namespace}:` : '';
    const finalKey = `${ns}${key}`;
    this.cache.set(finalKey, {
      value,
      expires: Date.now() + ttl * 1000,
    });
  }

  async invalidate(pattern?: string): Promise<void> {
    if (!pattern) {
      this.cache.clear();
    } else {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    }
  }

  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached) return cached;
    const value = await fn();
    await this.set(key, value, options);
    return value;
  }
}
