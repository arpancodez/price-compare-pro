import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@api/utils/logger';
import { cacheService } from '@api/services/cache';
import { aggregatorService } from '@api/services/aggregator';

const searchSchema = z.object({
  q: z.string().min(2, 'Query must be at least 2 characters'),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  pincode: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const validationData = searchSchema.parse({
      q: searchParams.get('q'),
      lat: searchParams.get('lat') || '28.7041',
      lng: searchParams.get('lng') || '77.1025',
      pincode: searchParams.get('pincode')
    });

    const cacheKey = cacheService.getCacheKey(validationData.q, validationData.lat, validationData.lng);
    
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      logger.info({ query: validationData.q, cacheHit: true }, 'Returning cached results');
      return NextResponse.json({
        success: true,
        data: { ...cached, cacheHit: true },
        timestamp: Date.now()
      });
    }

    const providers = []; // Initialize with all providers
    const results = await aggregatorService.searchAll(
      validationData.q,
      validationData.lat,
      validationData.lng,
      providers
    );

    const response = {
      query: validationData.q,
      location: { lat: validationData.lat, lng: validationData.lng, pincode: validationData.pincode },
      results,
      timestamp: Date.now(),
      cacheHit: false
    };

    await cacheService.set(cacheKey, response, 600);

    return NextResponse.json({
      success: true,
      data: response,
      timestamp: Date.now()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: error.errors },
        { status: 400 }
      );
    }
    logger.error({ error }, 'Search endpoint error');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationData = searchSchema.parse(body);
    
    const cacheKey = cacheService.getCacheKey(validationData.q, validationData.lat, validationData.lng);
    const cached = await cacheService.get(cacheKey);
    
    if (cached) {
      return NextResponse.json({
        success: true,
        data: { ...cached, cacheHit: true },
        timestamp: Date.now()
      });
    }

    const providers = [];
    const results = await aggregatorService.searchAll(
      validationData.q,
      validationData.lat,
      validationData.lng,
      providers
    );

    const response = {
      query: validationData.q,
      location: { lat: validationData.lat, lng: validationData.lng, pincode: validationData.pincode },
      results,
      timestamp: Date.now(),
      cacheHit: false
    };

    await cacheService.set(cacheKey, response, 600);
    return NextResponse.json({ success: true, data: response, timestamp: Date.now() });
  } catch (error) {
    logger.error({ error }, 'POST Search error');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
