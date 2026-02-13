import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload } from 'lucide-react';
import { createVideoSchema, type CreateVideoFormData } from '@/lib/schemas';
import * as videosApi from '@/api/videos';
import Input from '@/shared/components/Input';
import Button from '@/shared/components/Button';

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB
const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];

export default function UploadPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'form' | 'upload'>('form');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
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

  // Prevent accidental navigation during upload
  useEffect(() => {
    if (!uploading) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [uploading]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    const selected = e.target.files?.[0] ?? null;
    if (!selected) {
      setFile(null);
      return;
    }
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setFileError('Please select a valid video file (MP4, MOV, WebM, AVI)');
      setFile(null);
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setFileError('File size must be under 2 GB');
      setFile(null);
      return;
    }
    setFile(selected);
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
              accept="video/mp4,video/quicktime,video/webm,video/x-msvideo"
              onChange={handleFileChange}
              disabled={uploading}
              className="text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0
                file:bg-primary-light file:px-4 file:py-2 file:text-sm file:font-medium
                file:text-primary hover:file:bg-indigo-100"
            />
            {fileError && <p className="text-xs text-danger">{fileError}</p>}
            {file && (
              <p className="text-xs text-gray-500">
                {file.name} ({(file.size / (1024 * 1024)).toFixed(1)} MB)
              </p>
            )}
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

          <Button onClick={onUploadFile} loading={uploading} disabled={!file || !!fileError}>
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        </div>
      )}
    </div>
  );
}
