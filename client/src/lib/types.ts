// Enums matching backend
export type VideoStatus = 'DRAFT' | 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED';
export type PurchaseStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type UserRole = 'VIEWER' | 'CREATOR' | 'ADMIN';

// Auth
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

// User derived from JWT
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface JwtPayload {
  sub: string;
  userId: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// Video
export interface VideoResponse {
  id: string;
  creatorId: string;
  title: string;
  description: string | null;
  priceCents: number;
  status: VideoStatus;
  thumbnailUrl: string | null;
  durationSecs: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVideoRequest {
  title: string;
  description?: string;
  priceCents: number;
}

export interface UpdateVideoRequest {
  title?: string;
  description?: string;
  priceCents?: number;
}

export interface StreamResponse {
  hlsUrl: string;
}

// Pagination
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// Payment
export interface CreateCheckoutRequest {
  videoId: string;
}

export interface CheckoutResponse {
  checkoutUrl: string;
  sessionId: string;
}

export interface PurchaseResponse {
  id: string;
  videoId: string;
  amountCents: number;
  status: PurchaseStatus;
  createdAt: string;
}

export interface VideoAccessResponse {
  hasAccess: boolean;
  reason: string;
}

export interface CreatorStatsResponse {
  totalVideos: number;
  totalPurchases: number;
  totalEarningsCents: number;
}
