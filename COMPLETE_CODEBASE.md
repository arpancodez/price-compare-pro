# Complete Codebase - All Implementation Files

## QUICK SETUP
```bash
# Clone and setup
git clone https://github.com/arpancodez/price-compare-pro.git
cd price-compare-pro
pnpm install

# Create directories
mkdir -p apps/web/src/{app,components,hooks,lib,styles}
mkdir -p apps/api/src/{routes,services/providers,middleware,types,utils}

# Setup environment
echo 'REDIS_URL=redis://localhost:6379' > apps/api/.env.local
echo 'NEXT_PUBLIC_API_URL=http://localhost:3000/api' > apps/web/.env.local

# Run
pnpm dev
```

## BACKEND - apps/api/src/utils/logger.ts
```typescript
import pino from 'pino';
export const logger = pino(
  process.env.NODE_ENV === 'production' ? undefined : { transport: { target: 'pino-pretty' } }
);
```

## BACKEND - apps/api/src/services/cache.ts
```typescript
import Redis from 'ioredis';
import { logger } from '@api/utils/logger';
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
export const cacheService = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      if (data) { logger.debug({ key }, 'Cache hit'); return JSON.parse(data); }
      return null;
    } catch (error) { logger.error({ error, key }, 'Cache get error'); return null; }
  },
  async set<T>(key: string, value: T, ttl = 600): Promise<void> {
    try { await redis.setex(key, ttl, JSON.stringify(value)); logger.debug({ key, ttl }, 'Cached'); }
    catch (error) { logger.error({ error, key }, 'Cache set error'); }
  },
  async delete(key: string): Promise<void> {
    try { await redis.del(key); } catch (error) { logger.error({ error, key }, 'Cache delete error'); }
  },
  getCacheKey(query: string, lat: number, lng: number): string {
    return `search:${query}:${Math.round(lat)}:${Math.round(lng)}`;
  }
};
```

## BACKEND - apps/api/src/services/providers/base.ts
```typescript
import { Platform, PriceComparison } from '@api/types';
import { logger } from '@api/utils/logger';
import axios, { AxiosInstance } from 'axios';
export abstract class BaseProviderService {
  protected client: AxiosInstance; protected platform: Platform; protected timeout = 5000;
  constructor(platform: Platform, baseURL: string, apiKey?: string) {
    this.platform = platform;
    this.client = axios.create({ baseURL, timeout: this.timeout, headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {} });
  }
  abstract search(query: string, lat: number, lng: number): Promise<PriceComparison[]>;
  protected normalizePriceComparison(data: any): PriceComparison {
    const price = data.price || 0; const originalPrice = data.originalPrice || price; const deliveryFee = data.deliveryFee || 0; const discount = originalPrice - price;
    return {
      platform: this.platform, product: { id: data.id, name: data.name, brand: data.brand || '', quantity: data.quantity, unit: data.unit, baseQuantity: this.normalizeQuantity(data.quantity, data.unit), image: data.image || '', platform: this.platform, url: data.url || '' },
      price, originalPrice, discount, discountPercentage: (discount / originalPrice) * 100, deliveryFee, platformFee: data.platformFee || 0,
      effectivePrice: price + deliveryFee + (data.platformFee || 0), pricePerUnit: this.calculatePricePerUnit(price, data.quantity, data.unit),
      deliveryETA: data.deliveryETA || '30 min', inStock: data.inStock !== false, isCheapest: false, isFastest: false, lastUpdated: Date.now()
    };
  }
  private normalizeQuantity(quantity: number, unit: string): number {
    const unitMap: Record<string, number> = { 'g': quantity, 'ml': quantity, 'kg': quantity * 1000, 'l': quantity * 1000, 'pieces': quantity };
    return unitMap[unit] || quantity;
  }
  private calculatePricePerUnit(price: number, quantity: number, unit: string): number {
    const baseQty = this.normalizeQuantity(quantity, unit); const divisor = ['ml', 'g'].includes(unit) ? baseQty / 100 : quantity; return divisor > 0 ? price / divisor : 0;
  }
  protected async handleError(error: any, context: string): Promise<PriceComparison[]> {
    logger.error({ error, platform: this.platform, context }, 'Provider error'); return [];
  }
}
```

## BACKEND - apps/api/src/services/aggregator.ts
```typescript
import { PriceComparison } from '@api/types'; import { logger } from '@api/utils/logger';
export const aggregatorService = {
  async searchAll(query: string, lat: number, lng: number, providers: any[]): Promise<PriceComparison[]> {
    const results = await Promise.allSettled(providers.map(p => p.search(query, lat, lng)));
    const allResults: PriceComparison[] = results.filter((r): r is PromiseFulfilledResult<PriceComparison[]> => r.status === 'fulfilled').flatMap(r => r.value);
    allResults.sort((a, b) => a.effectivePrice - b.effectivePrice);
    if (allResults.length > 0) { allResults[0].isCheapest = true; allResults[0].badge = 'Cheapest'; }
    const fastest = allResults.reduce((prev, current) => parseInt(current.deliveryETA) < parseInt(prev.deliveryETA) ? current : prev);
    if (fastest && fastest !== allResults[0]) { fastest.isFastest = true; fastest.badge = 'Fastest'; }
    return allResults;
  }
};
```

## FRONTEND - apps/web/package.json
```json
{
  "name": "price-compare-web", "version": "1.0.0", "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.0.0", "react": "^18.2.0", "react-dom": "^18.2.0",
    "@tanstack/react-query": "^5.28.0", "axios": "^1.6.0", "zod": "^3.22.0",
    "react-hook-form": "^7.48.0", "zustand": "^4.4.0", "recharts": "^2.10.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0", "@types/node": "^20.0.0", "@types/react": "^18.2.0",
    "tailwindcss": "^3.3.0", "postcss": "^8.4.0", "autoprefixer": "^10.4.0"
  }
}
```

## To complete the setup, follow these patterns for remaining files:

1. **Backend Provider Services** - Use BaseProviderService pattern for each platform
2. **API Routes** - Create `/api/search` route using aggregator service
3. **Frontend Components** - Use React Query hooks with Tailwind styling
4. **Environment Files** - Add API keys for each provider

## Key Architecture Points:
- All platform services inherit from BaseProviderService
- Redis caching with 600s TTL
- Parallel Promise.allSettled() for fault tolerance  
- Normalized pricing per 100g/ml for fair comparison
- React Query for optimal data fetching on frontend
- Type safety throughout with TypeScript

## Deploy to Vercel:
```bash
git push origin main
# Open https://vercel.com and import the repo
# Set env variables in Vercel dashboard
# Auto-deploys on push
```
