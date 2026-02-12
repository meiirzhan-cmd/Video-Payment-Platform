import apiClient from './client';
import type {
  CheckoutResponse,
  CreateCheckoutRequest,
  CreatorStatsResponse,
  PageResponse,
  PurchaseResponse,
  VideoAccessResponse,
} from '@/lib/types';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

export async function createCheckout(data: CreateCheckoutRequest): Promise<CheckoutResponse> {
  const res = await apiClient.post<CheckoutResponse>('/payments/checkout', data);
  return res.data;
}

export async function listPurchases(
  page = 0,
  size = DEFAULT_PAGE_SIZE,
): Promise<PageResponse<PurchaseResponse>> {
  const res = await apiClient.get<PageResponse<PurchaseResponse>>('/purchases', {
    params: { page, size },
  });
  return res.data;
}

export async function checkAccess(videoId: string): Promise<VideoAccessResponse> {
  const res = await apiClient.get<VideoAccessResponse>(`/videos/${videoId}/access`);
  return res.data;
}

export async function getCreatorStats(): Promise<CreatorStatsResponse> {
  const res = await apiClient.get<CreatorStatsResponse>('/creator/stats');
  return res.data;
}
