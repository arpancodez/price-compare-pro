# Implementation Guide - Price Compare Pro

## Quick Start Setup

```bash
# Install dependencies
pnpm install

# Setup environment
cp apps/api/.env.example apps/api/.env.local

# Start development servers
pnpm dev
```

## Backend Architecture (apps/api/)

### 1. Types (src/types/index.ts)

```typescript
export interface Product {
  id: string;
  name: string;
  brand: string;
  quantity: number;
  unit: 'g' | 'ml' | 'pieces';
  image: string;
  platform: Platform;
}

export interface PriceComparison {
  platform: Platform;
  product: Product;
  price: number;
  originalPrice: number;
  discount: number;
  deliveryFee: number;
  platformFee: number;
  effectivePrice: number;
  pricePerUnit: number;
  deliveryETA: string;
  isCheapest: boolean;
  badge?: 'Cheapest' | 'Fastest' | 'Best Value';
  url: string;
}

export type Platform = 'blinkit' | 'zepto' | 'instamart' | 'bigbasket' | 'zomato';
```

### 2. Cache Service (src/services/cache.ts)

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export const cacheService = {
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  async set<T>(key: string, value: T, ttl = 600): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value));
  },

  async delete(key: string): Promise<void> {
    await redis.del(key);
  },
};
```

### 3. Provider Services (src/services/providers/)

#### Blinkit (src/services/providers/blinkit.ts)

```typescript
import axios from 'axios';
import { PriceComparison, Product } from '@types';

const BLINKIT_API = 'https://api.blinkit.com/v1';
const BLINKIT_KEY = process.env.BLINKIT_API_KEY!;

export const blinkitService = {
  async search(
    query: string,
    location: { lat: number; lng: number }
  ): Promise<PriceComparison[]> {
    try {
      const response = await axios.get(`${BLINKIT_API}/products/search`, {
        params: { q: query, lat: location.lat, lng: location.lng },
        headers: { Authorization: `Bearer ${BLINKIT_KEY}` },
        timeout: 5000,
      });

      return response.data.products.map((product: any) => ({
        platform: 'blinkit',
        product: {
          id: product.id,
          name: product.name,
          brand: product.brand,
          quantity: product.quantity,
          unit: product.unit,
          image: product.image,
        },
        price: product.price,
        originalPrice: product.originalPrice || product.price,
        discount: (product.originalPrice || product.price) - product.price,
        deliveryFee: product.deliveryFee || 25,
        platformFee: 0,
        effectivePrice: product.price + (product.deliveryFee || 25),
        pricePerUnit: product.pricePerUnit || product.price / product.quantity,
        deliveryETA: product.deliveryETA || '15-20 min',
        isCheapest: false,
        url: product.url,
      }));
    } catch (error) {
      console.error('Blinkit error:', error);
      return [];
    }
  },
};
```

### 4. Aggregation Service (src/services/aggregator.ts)

```typescript
import { PriceComparison } from '@types';
import * as providers from './providers';

export const aggregator = {
  async comparePrice(
    query: string,
    location: { lat: number; lng: number }
  ): Promise<PriceComparison[]> {
    try {
      // Parallel requests with timeouts
      const results = await Promise.allSettled([
        providers.blinkit.search(query, location),
        providers.zepto.search(query, location),
        providers.instamart.search(query, location),
        providers.bigbasket.search(query, location),
        providers.zomato.search(query, location),
      ]);

      // Flatten results
      const all: PriceComparison[] = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value);

      // Sort by effective price
      all.sort((a, b) => a.effectivePrice - b.effectivePrice);

      // Add badges
      if (all.length > 0) {
        all[0].isCheapest = true;
        all[0].badge = 'Cheapest';
      }

      // Find fastest
      const fastest = all.reduce((prev, current) =>
        parseInt(current.deliveryETA) < parseInt(prev.deliveryETA) ? current : prev
      );
      if (fastest && fastest !== all[0]) {
        fastest.badge = 'Fastest';
      }

      return all;
    } catch (error) {
      console.error('Aggregation error:', error);
      throw error;
    }
  },
};
```

### 5. Search API Route (src/routes/search.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { aggregator } from '@services/aggregator';
import { cacheService } from '@services/cache';

const searchSchema = z.object({
  query: z.string().min(2),
  lat: z.number(),
  lng: z.number(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');

    const validated = searchSchema.parse({ query, lat, lng });

    // Check cache
    const cacheKey = `search:${validated.query}:${Math.round(lat)}:${Math.round(lng)}`;
    const cached = await cacheService.get(cacheKey);

    if (cached) {
      return NextResponse.json(cached);
    }

    // Get fresh data
    const results = await aggregator.comparePrice(validated.query, {
      lat: validated.lat,
      lng: validated.lng,
    });

    // Cache results (10 minutes)
    await cacheService.set(cacheKey, results, 600);

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 400 }
    );
  }
}
```

---

## Frontend Architecture (apps/web/)

### 1. Types & Hooks (src/lib/api.ts)

```typescript
import axios from 'axios';
import { PriceComparison } from '@packages/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

export async function searchProducts(
  query: string,
  lat: number,
  lng: number
): Promise<PriceComparison[]> {
  const { data } = await api.get('/search', {
    params: { q: query, lat, lng },
  });
  return data.results;
}
```

### 2. Search Hook (src/hooks/useSearch.ts)

```typescript
import { useQuery } from '@tanstack/react-query';
import { searchProducts } from '@/lib/api';

export function useSearch(
  query: string,
  location: { lat: number; lng: number }
) {
  return useQuery({
    queryKey: ['search', query, location],
    queryFn: () => searchProducts(query, location.lat, location.lng),
    enabled: query.length > 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### 3. Comparison Table Component (src/components/ComparisonTable.tsx)

```typescript
'use client';

import React from 'react';
import { PriceComparison } from '@types';

interface Props {
  results: PriceComparison[];
  loading?: boolean;
}

export function ComparisonTable({ results, loading }: Props) {
  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-3 text-left">Platform</th>
            <th className="p-3 text-right">Price</th>
            <th className="p-3 text-right">Delivery Fee</th>
            <th className="p-3 text-right">Effective Price</th>
            <th className="p-3 text-center">ETA</th>
            <th className="p-3 text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result) => (
            <tr key={result.platform} className="border-b hover:bg-gray-50">
              <td className="p-3 font-semibold capitalize">
                {result.platform}
                {result.badge && (
                  <span className="ml-2 badge">{result.badge}</span>
                )}
              </td>
              <td className="p-3 text-right">₹{result.price}</td>
              <td className="p-3 text-right">₹{result.deliveryFee}</td>
              <td className="p-3 text-right font-bold">
                ₹{result.effectivePrice}
              </td>
              <td className="p-3 text-center">{result.deliveryETA}</td>
              <td className="p-3 text-center">
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Buy
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 4. Search Page (src/app/search/page.tsx)

```typescript
'use client';

import { useState } from 'react';
import { useSearch } from '@/hooks/useSearch';
import { ComparisonTable } from '@/components/ComparisonTable';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState({ lat: 28.7041, lng: 77.1025 });

  const { data: results = [], isLoading, error } = useSearch(query, location);

  return (
    <main className="container mx-auto p-6">
      <div className="mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          className="w-full p-4 border rounded-lg"
        />
      </div>

      {error && <div className="text-red-600">Error: {error.message}</div>}

      {results.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">
            Found {results.length} platform(s)
          </h2>
          <ComparisonTable results={results} loading={isLoading} />
        </div>
      )}
    </main>
  );
}
```

## Environment Variables

```bash
# apps/api/.env.local
REDIS_URL=redis://localhost:6379
BLINKIT_API_KEY=your_key
ZEPTO_API_KEY=your_key
INSTAMART_API_KEY=your_key
BIGBASKET_API_KEY=your_key
ZOMATO_API_KEY=your_key

# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Deployment (Vercel)

1. Push to GitHub
2. Import on Vercel
3. Set environment variables
4. Deploy!

```bash
git push origin main
```
