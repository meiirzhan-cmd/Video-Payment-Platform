import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload } from 'lucide-react';
import { createVideoSchema, type CreateVideoFormData } from '@/lib/schemas';
import * as videosApi from '@/api/videos';
import Input from '@/shared/components/Input';
import Button from '@/shared/components/Button';

export default function UploadPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'form' | 'upload'>('form');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateVideoFormData>({
    resolver: zodResolver(createVideoSchema),
    defaultValues: { priceCents: 0 },
  });

  const onCreateVideo = async (data: CreateVideoFormData) => {
    setError('');
    try {
      const video = await videosApi.create(data);
      setVideoId(video.id);
      setStep('upload');
    } catch {
      setError('Failed to create video');
    }
  };

  const onUploadFile = async () => {
    if (!videoId || !file) return;
    setUploading(true);
    setError('');
    try {
      await videosApi.upload(videoId, file, setProgress);
      navigate('/creator/dashboard');
    } catch {
      setError('Upload failed. Please try again.');
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Upload Video</h1>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-danger">{error}</div>
      )}

      {step === 'form' && (
        <form onSubmit={handleSubmit(onCreateVideo)} className="space-y-4 rounded-xl border bg-white p-6">
          <Input
            id="title"
            label="Title"
            placeholder="Video title"
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
              placeholder="Describe your video..."
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
            placeholder="0 for free"
            error={errors.priceCents?.message}
            {...register('priceCents', { valueAsNumber: true })}
          />
          <Button type="submit" loading={isSubmitting}>
            Continue to Upload
          </Button>
        </form>
      )}

      {step === 'upload' && (
        <div className="space-y-4 rounded-xl border bg-white p-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Video File</label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0
                file:bg-primary-light file:px-4 file:py-2 file:text-sm file:font-medium
                file:text-primary hover:file:bg-indigo-100"
            />
          </div>

          {uploading && (
            <div className="space-y-1">
              <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">{progress}% uploaded</p>
            </div>
          )}

          <Button onClick={onUploadFile} loading={uploading} disabled={!file}>
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        </div>
      )}
    </div>
  );
}
