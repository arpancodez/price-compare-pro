# All Provider Services + Frontend Components + Dockerfiles

## PROVIDER SERVICES

### apps/api/src/services/providers/zepto.ts
```typescript
import { BaseProviderService } from './base';
import { PriceComparison } from '@api/types';

export class ZeptoService extends BaseProviderService {
  constructor() {
    super('zepto', 'https://api.zeptodelivery.com/v1', process.env.ZEPTO_API_KEY);
  }
  async search(query: string, lat: number, lng: number): Promise<PriceComparison[]> {
    try {
      const response = await this.client.get('/search', {
        params: { q: query, latitude: lat, longitude: lng }
      });
      return response.data.items?.map((item: any) => this.normalizePriceComparison(item)) || [];
    } catch (error) {
      return this.handleError(error, 'search');
    }
  }
}
```

### apps/api/src/services/providers/instamart.ts
```typescript
import { BaseProviderService } from './base';
import { PriceComparison } from '@api/types';

export class InstamartService extends BaseProviderService {
  constructor() {
    super('instamart', 'https://api.instamart.com/v1', process.env.INSTAMART_API_KEY);
  }
  async search(query: string, lat: number, lng: number): Promise<PriceComparison[]> {
    try {
      const response = await this.client.get('/products', {
        params: { search: query, lat, lng }
      });
      return response.data.products?.map((p: any) => this.normalizePriceComparison(p)) || [];
    } catch (error) {
      return this.handleError(error, 'search');
    }
  }
}
```

### apps/api/src/services/providers/bigbasket.ts
```typescript
import { BaseProviderService } from './base';
import { PriceComparison } from '@api/types';

export class BigBasketService extends BaseProviderService {
  constructor() {
    super('bigbasket', 'https://api.bigbasket.com/v1', process.env.BIGBASKET_API_KEY);
  }
  async search(query: string, lat: number, lng: number): Promise<PriceComparison[]> {
    try {
      const response = await this.client.get('/search', {
        params: { q: query, location: { lat, lng } }
      });
      return response.data.results?.map((r: any) => this.normalizePriceComparison(r)) || [];
    } catch (error) {
      return this.handleError(error, 'search');
    }
  }
}
```

### apps/api/src/services/providers/zomato.ts
```typescript
import { BaseProviderService } from './base';
import { PriceComparison } from '@api/types';

export class ZomatoService extends BaseProviderService {
  constructor() {
    super('zomato', 'https://api.zomato.com/v1', process.env.ZOMATO_API_KEY);
  }
  async search(query: string, lat: number, lng: number): Promise<PriceComparison[]> {
    try {
      const response = await this.client.get('/grocery/search', {
        params: { q: query, lat, lng }
      });
      return response.data.items?.map((item: any) => this.normalizePriceComparison(item)) || [];
    } catch (error) {
      return this.handleError(error, 'search');
    }
  }
}
```

---

## FRONTEND COMPONENTS

### apps/web/src/components/SearchBar.tsx
```typescript
'use client';
import { useState } from 'react';
import { useSearch } from '@/hooks/useSearch';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const { data, isLoading } = useSearch(query, { lat: 28.7041, lng: 77.1025 });

  return (
    <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products..."
        className="w-full px-4 py-3 rounded-lg text-lg"
      />
      {isLoading && <p className="text-white mt-2">Searching...</p>}
    </div>
  );
}
```

### apps/web/src/components/ComparisonTable.tsx
```typescript
'use client';
import { PriceComparison } from '@packages/types';

export function ComparisonTable({ results }: { results: PriceComparison[] }) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-gray-200">
          {['Platform', 'Price', 'Delivery', 'Effective', 'ETA', 'Action'].map(h => (
            <th key={h} className="p-3 text-left">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {results.map(r => (
          <tr key={r.platform} className="border-b hover:bg-gray-50">
            <td className="p-3 font-bold capitalize">{r.platform}{r.badge && ` 🌟 ${r.badge}`}</td>
            <td className="p-3">₹{r.price}</td>
            <td className="p-3">₹{r.deliveryFee}</td>
            <td className="p-3 font-bold">₹{r.effectivePrice}</td>
            <td className="p-3">{r.deliveryETA}</td>
            <td className="p-3"><a href={r.product.url} className="text-blue-600 hover:underline">Buy</a></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## DOCKERFILES

### apps/api/Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY apps/api ./apps/api
COPY packages ./packages
EXPOSE 3001
CMD ["pnpm", "--filter", "price-compare-api", "start"]
```

### apps/web/Dockerfile
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY apps/web ./apps/web
COPY packages ./packages
RUN pnpm --filter price-compare-web build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
EXPOSE 3000
CMD ["cd", "apps/web", "&&", "npm", "start"]
```

---

## CI/CD WORKFLOW

### .github/workflows/deploy.yml
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with: {node-version: '18', cache: 'pnpm'}
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm build
      - name: Deploy to Vercel
        uses: vercel/action@main
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## NEXT STEPS
1. Copy all provider code to `apps/api/src/services/providers/`
2. Update aggregator to include all providers
3. Copy components to `apps/web/src/components/`
4. Create Dockerfiles in each app folder
5. Add GitHub Actions workflow in `.github/workflows/`
6. Run: `docker-compose up` or `pnpm dev`
