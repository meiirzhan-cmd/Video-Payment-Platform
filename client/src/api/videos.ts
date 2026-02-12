import apiClient from './client';
import type {
  CreateVideoRequest,
  PageResponse,
  StreamResponse,
  UpdateVideoRequest,
  VideoResponse,
} from '@/lib/types';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

export async function list(
  page = 0,
  size = DEFAULT_PAGE_SIZE,
  search?: string,
): Promise<PageResponse<VideoResponse>> {
  const params: Record<string, string | number> = { page, size };
  if (search) params.search = search;
  const res = await apiClient.get<PageResponse<VideoResponse>>('/videos', { params });
  return res.data;
}

export async function getById(id: string): Promise<VideoResponse> {
  const res = await apiClient.get<VideoResponse>(`/videos/${id}`);
  return res.data;
}

export async function create(data: CreateVideoRequest): Promise<VideoResponse> {
  const res = await apiClient.post<VideoResponse>('/videos', data);
  return res.data;
}

export async function update(id: string, data: UpdateVideoRequest): Promise<VideoResponse> {
  const res = await apiClient.put<VideoResponse>(`/videos/${id}`, data);
  return res.data;
}

export async function upload(
  id: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<VideoResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiClient.put<VideoResponse>(`/videos/${id}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  });
  return res.data;
}

export async function remove(id: string): Promise<void> {
  await apiClient.delete(`/videos/${id}`);
}

export async function getStreamUrl(id: string): Promise<StreamResponse> {
  const res = await apiClient.get<StreamResponse>(`/videos/${id}/stream`);
  return res.data;
}

export async function listCreatorVideos(
  page = 0,
  size = DEFAULT_PAGE_SIZE,
): Promise<PageResponse<VideoResponse>> {
  const res = await apiClient.get<PageResponse<VideoResponse>>('/creator/videos', {
    params: { page, size },
  });
  return res.data;
}
