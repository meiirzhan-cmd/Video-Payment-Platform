import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Trash2, Upload } from 'lucide-react';
import { updateVideoSchema, type UpdateVideoFormData } from '@/lib/schemas';
import * as videosApi from '@/api/videos';
import type { VideoResponse } from '@/lib/types';
import Input from '@/shared/components/Input';
import Button from '@/shared/components/Button';
import Modal from '@/shared/components/Modal';
import StatusBadge from '@/shared/components/StatusBadge';
import { useToastStore } from '@/shared/toast-store';

const ACCEPTED_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo']);
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024;

export default function EditVideoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.add);
  const [video, setVideo] = useState<VideoResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Re-upload state
  const [reuploadFile, setReuploadFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateVideoFormData>({
    resolver: zodResolver(updateVideoSchema),
  });

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const v = await videosApi.getById(id!);
        setVideo(v);
        reset({
          title: v.title,
          description: v.description ?? '',
          priceCents: v.priceCents,
        });
      } catch {
        setError('Failed to load video');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id, reset]);

  const onSubmit = async (data: UpdateVideoFormData) => {
    if (!id) return;
    setError('');
    try {
      await videosApi.update(id, data);
      addToast('Video updated', 'success');
      navigate('/creator/dashboard');
    } catch {
      setError('Failed to update video');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    const selected = e.target.files?.[0] ?? null;
    if (!selected) {
      setReuploadFile(null);
      return;
    }
    if (!ACCEPTED_TYPES.has(selected.type)) {
      setFileError('Please select a valid video file (MP4, MOV, WebM, AVI)');
      setReuploadFile(null);
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setFileError('File size must be under 2 GB');
      setReuploadFile(null);
      return;
    }
    setReuploadFile(selected);
  };

  const handleReupload = async () => {
    if (!id || !reuploadFile) return;
    setUploading(true);
    setError('');
    try {
      const updated = await videosApi.upload(id, reuploadFile, setUploadProgress);
      setVideo(updated);
      setReuploadFile(null);
      addToast('Video re-uploaded — processing will start shortly', 'success');
    } catch {
      setError('Re-upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await videosApi.remove(id);
      addToast('Video deleted', 'success');
      navigate('/creator/dashboard');
    } catch {
      addToast('Failed to delete video', 'error');
      setDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-danger">
        {error || 'Video not found'}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Edit Video</h1>
        <StatusBadge status={video.status} />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-danger">{error}</div>
      )}

      {/* Metadata form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border bg-white p-6">
        <Input
          id="title"
          label="Title"
          error={errors.title?.message}
          {...register('title')}
        />
        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none
              focus:border-primary focus:ring-2 focus:ring-primary/20"
            {...register('description')}
          />
        </div>
        <Input
          id="priceCents"
          label="Price (cents)"
          type="number"
          min={0}
          error={errors.priceCents?.message}
          {...register('priceCents', { valueAsNumber: true })}
        />
        <div className="flex gap-3">
          <Button type="submit" loading={isSubmitting}>
            Save Changes
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>

      {/* Re-upload section */}
      <div className="space-y-3 rounded-xl border bg-white p-6">
        <h2 className="text-sm font-semibold text-gray-900">Re-upload Video File</h2>
        <p className="text-xs text-gray-500">
          Uploading a new file will reset the video status to processing.
        </p>
        <input
          type="file"
          accept="video/mp4,video/quicktime,video/webm,video/x-msvideo"
          onChange={handleFileChange}
          disabled={uploading}
          className="text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0
            file:bg-primary-light file:px-4 file:py-2 file:text-sm file:font-medium
            file:text-primary hover:file:bg-indigo-100"
        />
        {fileError && <p className="text-xs text-danger">{fileError}</p>}
        {reuploadFile && (
          <p className="text-xs text-gray-500">
            {reuploadFile.name} ({(reuploadFile.size / (1024 * 1024)).toFixed(1)} MB)
          </p>
        )}
        {uploading && (
          <div className="space-y-1">
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">{uploadProgress}% uploaded</p>
          </div>
        )}
        <Button
          size="sm"
          variant="secondary"
          onClick={handleReupload}
          loading={uploading}
          disabled={!reuploadFile || !!fileError}
        >
          <Upload className="h-4 w-4" />
          Re-upload
        </Button>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-sm font-semibold text-danger">Danger Zone</h2>
        <p className="mt-1 text-xs text-gray-600">
          Deleting a video is permanent and cannot be undone.
        </p>
        <Button variant="danger" size="sm" className="mt-3" onClick={() => setShowDelete(true)}>
          <Trash2 className="h-4 w-4" />
          Delete Video
        </Button>
      </div>

      {/* Delete confirmation modal */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete Video">
        <p className="text-sm text-gray-600">
          Are you sure you want to delete <strong>{video.title}</strong>? This action cannot be
          undone.
        </p>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setShowDelete(false)}>
            Cancel
          </Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
