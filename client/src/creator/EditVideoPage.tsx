import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { updateVideoSchema, type UpdateVideoFormData } from '@/lib/schemas';
import * as videosApi from '@/api/videos';
import type { VideoResponse } from '@/lib/types';
import Input from '@/shared/components/Input';
import Button from '@/shared/components/Button';

export default function EditVideoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<VideoResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
      navigate('/creator/dashboard');
    } catch {
      setError('Failed to update video');
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
      <h1 className="text-2xl font-bold text-gray-900">Edit Video</h1>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-danger">{error}</div>
      )}

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
    </div>
  );
}
