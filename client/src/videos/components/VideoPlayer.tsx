import { useCallback, useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  src: string;
  onUrlExpired?: () => Promise<string | null>;
}

interface QualityLevel {
  index: number;
  label: string;
}

export default function VideoPlayer({ src, onUrlExpired }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [qualities, setQualities] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1);

  const changeQuality = useCallback((index: number) => {
    const hls = hlsRef.current;
    if (!hls) return;
    hls.currentLevel = index;
    setCurrentQuality(index);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Safari native HLS support
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      return;
    }

    if (!Hls.isSupported()) return;

    const hls = new Hls({
      enableWorker: true,
      startLevel: -1,
    });
    hlsRef.current = hls;

    hls.loadSource(src);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      const levels: QualityLevel[] = hls.levels.map((level, i) => ({
        index: i,
        label: `${level.height}p`,
      }));
      setQualities(levels);
      setCurrentQuality(-1);
    });

    hls.on(Hls.Events.ERROR, async (_event, data) => {
      // Handle presigned URL expiration (403 on segment fetch)
      if (
        data.type === Hls.ErrorTypes.NETWORK_ERROR &&
        data.response?.code === 403 &&
        onUrlExpired
      ) {
        const newUrl = await onUrlExpired();
        if (newUrl) {
          const currentTime = video.currentTime;
          hls.loadSource(newUrl);
          hls.once(Hls.Events.MANIFEST_PARSED, () => {
            video.currentTime = currentTime;
            video.play();
          });
          return;
        }
      }

      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls.recoverMediaError();
            break;
          default:
            hls.destroy();
            break;
        }
      }
    });

    return () => {
      hls.destroy();
      hlsRef.current = null;
    };
  }, [src, onUrlExpired]);

  // Keyboard shortcuts
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handler = (e: KeyboardEvent) => {
      // Don't capture if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          video.paused ? video.play() : video.pause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          video.currentTime = Math.min(video.duration, video.currentTime + 10);
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          document.fullscreenElement ? document.exitFullscreen() : video.requestFullscreen();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          video.muted = !video.muted;
          break;
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        controls
        className="aspect-video w-full rounded-lg bg-black"
      />

      {/* Quality selector */}
      {qualities.length > 1 && (
        <div className="absolute bottom-14 right-3 flex gap-1 rounded-lg bg-black/70 p-1">
          <button
            onClick={() => changeQuality(-1)}
            className={`rounded px-2 py-1 text-xs transition-colors ${
              currentQuality === -1 ? 'bg-primary text-white' : 'text-gray-300 hover:text-white'
            }`}
          >
            Auto
          </button>
          {qualities.map((q) => (
            <button
              key={q.index}
              onClick={() => changeQuality(q.index)}
              className={`rounded px-2 py-1 text-xs transition-colors ${
                currentQuality === q.index ? 'bg-primary text-white' : 'text-gray-300 hover:text-white'
              }`}
            >
              {q.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
