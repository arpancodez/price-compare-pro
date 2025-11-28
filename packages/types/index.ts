// Platform types
export type Platform = 'blinkit' | 'zepto' | 'instamart' | 'bigbasket' | 'zomato';
export type Unit = 'g' | 'ml' | 'pieces' | 'kg' | 'l';

// Product interface
export interface Product {
  id: string;
  name: string;
  brand: string;
  quantity: number;
  unit: Unit;
  baseQuantity: number; // normalized to base units (g or ml)
  image: string;
  platform: Platform;
  url: string;
}

// Price comparison result for single platform
export interface PriceComparison {
  platform: Platform;
  product: Product;
  price: number; // current price in rupees
  originalPrice: number; // original price before discount
  discount: number; // discount amount in rupees
  discountPercentage: number; // discount percentage
  deliveryFee: number; // delivery fee
  platformFee: number; // any platform service charge
  effectivePrice: number; // total price (price + deliveryFee + platformFee)
  pricePerUnit: number; // price per 100g/ml for normalized comparison
  deliveryETA: string; // estimated delivery time (e.g., "15-20 min")
  inStock: boolean;
  isCheapest: boolean; // is this the cheapest option
  isFastest: boolean; // is this the fastest delivery
  badge?: 'Cheapest' | 'Fastest' | 'Best Value';
  lastUpdated: number; // timestamp
}

// Search results wrapper
export interface SearchResults {
  query: string;
  location: {
    lat: number;
    lng: number;
    pincode?: string;
  };
  results: PriceComparison[];
  timestamp: number;
  cacheHit: boolean;
}

// API request/response types
export interface SearchRequest {
  query: string;
  lat: number;
  lng: number;
  pincode?: string;
  limit?: number;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

// Cache key generator
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

// Provider-specific response types
export interface ProviderResponse {
  platform: Platform;
  products: PriceComparison[];
  success: boolean;
  error?: string;
  responseTime: number;
}

// Cart item for cross-platform comparison
export interface CartItem {
  productId: string;
  quantity: number;
  selectedPlatform?: Platform;
}

// Cart comparison result
export interface CartComparison {
  items: CartItem[];
  results: {
    platform: Platform;
    totalPrice: number;
    deliveryFee: number;
    totalEffectivePrice: number;
    estimatedDelivery: string;
    savings: number; // compared to most expensive option
  }[];
}

// Analytics event
export interface AnalyticsEvent {
  type: 'search' | 'compare' | 'click' | 'purchase';
  platform?: Platform;
  productId?: string;
  timestamp: number;
  userId?: string;
  metadata?: Record<string, any>;
}
