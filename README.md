# 🛒 Price Compare Pro - Multi-Platform Grocery Price Comparison

A high-end, production-grade price comparison platform for Indian grocery delivery apps. Search any product and instantly compare prices, delivery fees, ETAs, and find the cheapest option across **Blinkit**, **Zepto**, **Instamart**, **BigBasket**, and **Zomato**.

## ✨ Features

### Core Functionality
- **Real-time Price Comparison**: Search any product and see live prices from all platforms
- **Multi-Provider Support**: Blinkit, Zepto, Instamart, BigBasket, Zomato
- **Intelligent Price Aggregation**: Compares item price + delivery fee + platform charges
- **Geo-Location Based**: Accurate pricing based on user's location/pincode
- **Per-Unit Pricing**: Normalize and compare different pack sizes (500g vs 1kg, etc.)
- **Smart Caching**: Redis-backed caching for sub-1 second response times
- **Delivery Insights**: ETA, delivery fee, platform fee breakdown for each option

### Frontend Features
- ⚡ Next.js 14+ with App Router
- 🎨 Modern UI with shadcn/ui and Tailwind CSS
- 🔍 Instant search with autocomplete and recent searches
- 📊 Comparison table with sortable columns
- 🏷️ Smart badges ("Cheapest", "Fastest", "Best Value")
- 🛒 Cross-platform cart comparison
- 📈 Price history and savings tracking
- 📱 Fully responsive and mobile-optimized
- ♿ WCAG compliant accessibility

### Backend Features
- 🚀 High-performance microservices architecture
- 🔄 Real-time data aggregation with parallel requests
- ⏱️ Smart timeouts (individual provider timeouts + aggregate timeout)
- 💾 Redis caching with TTL-based invalidation
- 🔐 Rate limiting and circuit breakers per provider
- 📊 Logging and analytics
- 🔌 Extensible provider architecture (easy to add new platforms)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Search • Filters • Comparison Table • Cart Management│  │
│  │ Real-time Updates • Price Graphs • Favorites         │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  API Gateway (Node.js)                      │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Auth • Rate Limiting • Request Validation • Routing │  │
│  └─────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
    ┌─────────┐    ┌─────────┐    ┌─────────┐
    │ Blinkit │    │ Zepto   │    │Instamart│
    │ Service │    │ Service │    │ Service │
    └────┬────┘    └────┬────┘    └────┬────┘
         └──────────────┼──────────────┘
                        ▼
         ┌──────────────────────────┐
         │ Normalization Service    │
         │ (Unit Conversion, etc)   │
         └────────────┬─────────────┘
                      ▼
         ┌──────────────────────────┐
         │ Aggregation Service      │
         │ (Sorting, Filtering)     │
         └────────────┬─────────────┘
                      ▼
         ┌──────────────────────────┐
         │  Redis Cache             │
         │  (5-15 min TTL)          │
         └──────────────────────────┘
```

## 📁 Project Structure

```
price-compare-pro/
├── apps/
│   ├── web/                          # Next.js Frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── page.tsx          # Home page
│   │   │   │   ├── search/
│   │   │   │   │   └── page.tsx      # Search results
│   │   │   │   └── layout.tsx        # Root layout
│   │   │   ├── components/
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   ├── ComparisonTable.tsx
│   │   │   │   ├── ProductCard.tsx
│   │   │   │   ├── FilterSidebar.tsx
│   │   │   │   └── CartComparison.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useSearch.ts
│   │   │   │   ├── useComparison.ts
│   │   │   │   └── useCart.ts
│   │   │   ├── lib/
│   │   │   │   ├── api.ts           # API client
│   │   │   │   ├── schemas.ts       # Validation schemas
│   │   │   │   └── utils.ts         # Utilities
│   │   │   └── styles/
│   │   │       └── globals.css
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── api/                          # Next.js API Routes / Backend
│       ├── src/
│       │   ├── routes/
│       │   │   ├── search.ts        # Search endpoint
│       │   │   ├── product.ts       # Product details
│       │   │   └── cart.ts          # Cart comparison
│       │   ├── services/
│       │   │   ├── providers/       # Provider services
│       │   │   │   ├── blinkit.ts
│       │   │   │   ├── zepto.ts
│       │   │   │   ├── instamart.ts
│       │   │   │   ├── bigbasket.ts
│       │   │   │   └── zomato.ts
│       │   │   ├── aggregator.ts    # Aggregation logic
│       │   │   ├── normalizer.ts    # Unit normalization
│       │   │   └── cache.ts         # Caching layer
│       │   ├── middleware/
│       │   │   ├── auth.ts
│       │   │   ├── rateLimit.ts
│       │   │   └── errorHandler.ts
│       │   ├── types/
│       │   │   └── index.ts         # Shared types
│       │   └── utils/
│       │       ├── logger.ts
│       │       └── helpers.ts
│       ├── .env.example
│       └── package.json
│
├── packages/
│   ├── db/                          # Database/Schema shared package
│   │   ├── schema.ts
│   │   └── migrations/
│   │
│   └── types/                       # Shared TypeScript types
│       └── index.ts
│
├── docker-compose.yml               # Redis, DB setup
├── package.json                     # Monorepo root
├── turbo.json                       # Turbo build config
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm/yarn/pnpm
- Redis (or Docker)

### Installation

```bash
# Clone the repository
git clone https://github.com/arpancodez/price-compare-pro.git
cd price-compare-pro

# Install dependencies
pnpm install

# Setup Redis (using Docker)
docker-compose up -d

# Create .env files
cp apps/api/.env.example apps/api/.env.local

# Run development servers
pnpm dev
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14+
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts

### Backend
- **Runtime**: Node.js
- **Framework**: Express / Next.js API Routes
- **Language**: TypeScript
- **Database**: PostgreSQL (optional, for persistence)
- **Cache**: Redis
- **Validation**: Zod
- **Logging**: Winston/Pino

### Deployment
- **Frontend**: Vercel
- **Backend**: Vercel Serverless Functions / Railway
- **Cache**: Upstash Redis
- **Database**: Supabase / Neon

## 🔑 Environment Variables

```bash
# .env.local (API)
REDIS_URL=redis://localhost:6379
BLINKIT_API_KEY=
ZEPTO_API_KEY=
INSTAMART_API_KEY=
BIGBASKET_API_KEY=
ZOMATO_API_KEY=

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## 🔄 API Endpoints

```
GET  /api/search?query=amul&location=110001
GET  /api/product/:id
POST /api/cart/compare
GET  /api/history
GET  /api/savings
```

## 📊 Comparison Example

```json
{
  "query": "Amul Butter 500g",
  "results": [
    {
      "platform": "blinkit",
      "productName": "Amul Butter 500g",
      "price": 220,
      "originalPrice": 240,
      "discount": 20,
      "deliveryFee": 25,
      "platformFee": 0,
      "effectivePrice": 245,
      "pricePerUnit": 44,
      "deliveryETA": "15-20 min",
      "isCheapest": true,
      "badge": "Cheapest"
    },
    {
      "platform": "zepto",
      "productName": "Amul Butter 500g",
      "price": 215,
      "originalPrice": 230,
      "discount": 15,
      "deliveryFee": 35,
      "platformFee": 5,
      "effectivePrice": 255,
      "pricePerUnit": 43,
      "deliveryETA": "10-15 min",
      "badge": "Fastest"
    }
  ]
}
```

## 🔄 Data Flow

1. **User Search**: User enters product query + location
2. **Cache Check**: Check Redis for cached results
3. **Provider Calls**: Parallel requests to all 5 providers (with timeouts)
4. **Normalization**: Convert units, standardize data format
5. **Aggregation**: Sort by effective price, add badges
6. **Cache Store**: Store results in Redis (5-15 min TTL)
7. **Response**: Return comparison results to frontend

## 🚦 Rate Limiting & Caching

- **Per-provider rate limit**: 100 requests/minute
- **Global rate limit**: 1000 requests/minute per IP
- **Cache TTL**: 5-15 minutes (based on platform)
- **Stale-while-revalidate**: Serve stale data while fetching fresh

## 🔐 Security

- Environment variable-based API keys
- CORS enabled only for frontend domain
- Request validation with Zod
- SQL injection prevention (parameterized queries)
- XSS protection via Next.js defaults

## 📈 Performance

- **Target response time**: <1 second (with cache)
- **Search autocomplete**: <100ms
- **Parallel requests**: All providers queried simultaneously
- **Image optimization**: Next.js Image component
- **Code splitting**: Route-based code splitting
- **Compression**: Gzip enabled

## 🧪 Testing

```bash
# Unit tests
pnpm test

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e
```

## 📝 Future Enhancements

- [ ] User authentication & favorites
- [ ] Price drop alerts
- [ ] Historical price tracking
- [ ] Similar product suggestions
- [ ] Browser extension
- [ ] Mobile app (React Native)
- [ ] AI-powered deals recommendation
- [ ] Multi-language support
- [ ] Webhook alerts for price changes

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 📞 Support

For issues and questions, please open a GitHub issue or email support@pricecomparepro.com

---

**Built with ❤️ by Arpan for Indian shoppers**
