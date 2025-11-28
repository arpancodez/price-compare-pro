# Price Compare Pro - Deployment Guide

## Overview

Price Compare Pro is a production-ready, multi-platform grocery price comparison application. This guide covers local development setup, Docker containerization, and cloud deployment options.

## Prerequisites

### System Requirements
- Node.js 18+ (LTS recommended)
- npm or pnpm (we recommend pnpm 8.0+)
- Redis 6.0+ (for caching)
- Docker & Docker Compose (for containerized deployment)
- Git

### API Keys & Credentials
You'll need to acquire API access from each platform:

1. **Blinkit API**: Contact developer support at developer@blinkit.com
2. **Zepto API**: Request access at developers.zepto.co
3. **Instamart API**: Apply at https://blinkit.instamartapps.com/developers
4. **BigBasket API**: Register at https://api.bigbasket.com
5. **Zomato API**: Apply at https://developers.zomato.com

## Local Development Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/arpancodez/price-compare-pro.git
cd price-compare-pro
```

### Step 2: Install Dependencies

```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install
```

### Step 3: Configure Environment Variables

#### Backend Configuration (apps/api/.env)

```bash
# Copy the example file
cp apps/api/.env.example apps/api/.env

# Edit and add your API credentials
NEXT_PUBLIC_API_URL=http://localhost:3001
REDIS_URL=redis://localhost:6379

# Platform API Keys
BLINKIT_API_KEY=your_blinkit_key
BLINKIT_API_SECRET=your_blinkit_secret

ZEPTO_API_KEY=your_zepto_key
ZEPTO_API_SECRET=your_zepto_secret

INSTAMART_API_KEY=your_instamart_key
INSTAMART_API_SECRET=your_instamart_secret

BIGBASKET_API_KEY=your_bigbasket_key
BIGBASKET_API_SECRET=your_bigbasket_secret

ZOMATÉ_API_KEY=your_zomato_key
ZOMATÉ_API_SECRET=your_zomato_secret
```

#### Frontend Configuration (apps/web/.env.local)

```bash
# Copy the example file
cp apps/web/.env.example apps/web/.env.local

# Edit as needed (default values are suitable for local development)
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_DEBUG=true
```

### Step 4: Start Redis (if not using Docker)

```bash
# macOS using Homebrew
brew services start redis

# Ubuntu/Debian
sudo systemctl start redis-server

# Or run with Docker
docker run -d -p 6379:6379 redis:7-alpine
```

### Step 5: Start Development Servers

```bash
# Using turbo to run all services
pnpm dev

# This will start:
# - Backend API at http://localhost:3001
# - Frontend at http://localhost:3000
# - Redis on port 6379
```

## Docker Deployment

### Using Docker Compose (Recommended for Development)

```bash
# Build and start all services
docker-compose up -d

# This includes:
# - Redis cache
# - API service (port 3001)
# - Web service (port 3000)

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Clean up volumes
docker-compose down -v
```

### Building Individual Docker Images

#### API Image

```bash
cd apps/api
docker build -t price-compare-api:latest .
docker run -d -p 3001:3001 --env-file .env price-compare-api:latest
```

#### Web Image

```bash
cd apps/web
docker build -t price-compare-web:latest .
docker run -d -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://api:3001 price-compare-web:latest
```

## Production Deployment

### Deploying to Vercel

Vercel provides an easy way to deploy Next.js applications at scale.

#### Step 1: Connect to Vercel

```bash
# Install Vercel CLI
pnpm add -g vercel

# Login to Vercel
vercel login
```

#### Step 2: Deploy

```bash
# Deploy from root directory
vercel

# For production
vercel --prod
```

#### Step 3: Configure Environment Variables

1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Add all required API keys for each platform
4. Set `NEXT_PUBLIC_API_URL` to your production API URL

### Deploying to AWS

#### Using ECS (Elastic Container Service)

1. Create ECR repositories:
   ```bash
   aws ecr create-repository --repository-name price-compare-api
   aws ecr create-repository --repository-name price-compare-web
   ```

2. Build and push images:
   ```bash
   docker build -t price-compare-api:latest apps/api
   docker tag price-compare-api:latest {ECR_URI}:latest
   docker push {ECR_URI}:latest
   ```

3. Create ECS task definitions and services

### Deploying to Google Cloud Run

1. Build container:
   ```bash
   gcloud builds submit --config=cloudbuild.yaml
   ```

2. Deploy:
   ```bash
   gcloud run deploy price-compare --image gcr.io/PROJECT_ID/price-compare
   ```

## Database & Caching

### Redis Setup

Redis is used for caching API responses with a 600-second TTL.

#### Redis Atlas (Managed Redis)

1. Create a Redis cluster on Redis Labs (now part of Redis Cloud)
2. Get your connection string
3. Set `REDIS_URL` in your environment

#### Self-Hosted Redis

```bash
# Docker
docker run -d -p 6379:6379 redis:7-alpine

# Production setup requires:
# - Persistent storage (RDB snapshots)
# - Replication and backup
# - SSL/TLS encryption
```

## CI/CD Pipeline

### GitHub Actions Workflow

The project includes automated CI/CD with:

- **Lint**: TypeScript and code quality checks
- **Build**: Build API and Web applications
- **Test**: Run unit tests
- **Deploy**: Automatic deployment on main branch

Workflow file: `.github/workflows/deploy.yml`

## Monitoring & Logging

### Application Monitoring

1. **Performance**: Use Next.js built-in analytics
2. **Error Tracking**: Integrate Sentry for error monitoring
3. **API Metrics**: Monitor Redis cache hit rates and API latency

### Log Aggregation

```bash
# View API logs
docker logs price-compare-api

# View Web logs
docker logs price-compare-web

# Streaming logs
docker logs -f price-compare-api
```

## Troubleshooting

### Common Issues

#### 1. Redis Connection Failed

```
Error: Connection refused at 127.0.0.1:6379
```

**Solution:**
- Ensure Redis is running: `redis-cli ping` should return PONG
- Check `REDIS_URL` environment variable
- For Docker: `docker-compose logs redis`

#### 2. API Keys Not Found

```
Error: Missing required API keys for provider X
```

**Solution:**
- Verify all API keys are set in `.env` files
- Check that keys haven't expired
- Verify key format matches provider requirements

#### 3. Port Already in Use

```
Error: listen EADDRINUSE :::3000
```

**Solution:**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 pnpm dev
```

#### 4. Build Failures

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

#### 5. Slow API Response Times

**Solution:**
- Check Redis cache is working
- Monitor API key rate limits
- Review CloudFlare or CDN settings
- Check database query performance

## Performance Optimization

### Caching Strategy

- API responses cached for 600 seconds in Redis
- Product data updated every 10 minutes
- Location-based searches cached separately

### Database Query Optimization

- Use indexes on frequently queried fields
- Implement pagination for large result sets
- Cache aggregated results

## Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **API Keys**: Rotate keys regularly
3. **HTTPS**: Always use HTTPS in production
4. **CORS**: Configure CORS policy appropriately
5. **Rate Limiting**: Implement rate limiting on API endpoints
6. **Input Validation**: Validate all user inputs
7. **Authentication**: Use API tokens for sensitive endpoints

## Scaling Considerations

### Horizontal Scaling

- Use load balancer (AWS ALB, Nginx)
- Run multiple API instances
- Use Redis Cluster for distributed caching

### Vertical Scaling

- Increase instance size (CPU, RAM)
- Optimize code and queries
- Profile application for bottlenecks

## Backup & Disaster Recovery

### Database Backups

```bash
# Redis backup
redis-cli BGSAVE

# AWS RDS automated backups
# Configure backup retention in AWS console
```

### Application Backups

- Use GitHub for code version control
- Tag releases
- Maintain deployment configuration in version control

## Support & Additional Resources

- **Documentation**: See README.md and IMPLEMENTATION.md
- **GitHub Issues**: Report bugs and request features
- **Community**: Join discussions in GitHub Discussions
- **API Documentation**: Check individual platform API docs

## License

MIT - See LICENSE file for details
