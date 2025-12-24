'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkOrderComment } from '@/types/work-order';

interface MediaMessageProps {
  comment: WorkOrderComment;
}

export function MediaMessage({ comment }: MediaMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(comment.mediaDuration || 0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    const media = comment.type === 'audio' ? audioRef.current : videoRef.current;
    if (!media) return;

    if (isPlaying) {
      media.pause();
    } else {
      media.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    const media = comment.type === 'audio' ? audioRef.current : videoRef.current;
    if (media) {
      setCurrentTime(media.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    const media = comment.type === 'audio' ? audioRef.current : videoRef.current;
    if (media) {
      setDuration(media.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const media = comment.type === 'audio' ? audioRef.current : videoRef.current;
    if (!media) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    media.currentTime = percentage * duration;
  };

  // Audio message
  if (comment.type === 'audio' && comment.mediaUrl) {
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
      <div className="flex items-center gap-3 bg-slate-100 rounded-lg p-3 max-w-[280px]">
        <audio
          ref={audioRef}
          src={comment.mediaUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          className="hidden"
        />

        <Button
          variant="ghost"
          size="icon"
          onClick={handlePlayPause}
          className="h-10 w-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white shrink-0"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>

        <div className="flex-1 min-w-0">
          <div
            className="h-8 flex items-center gap-0.5 cursor-pointer"
            onClick={handleSeek}
          >
            {/* Waveform visualization (simplified) */}
            {Array.from({ length: 30 }).map((_, i) => {
              const height = Math.random() * 60 + 20; // Random heights for visual effect
              const isPlayed = (i / 30) * 100 <= progress;
              return (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-colors ${isPlayed ? 'bg-blue-500' : 'bg-slate-300'}`}
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <Volume2 className="h-4 w-4 text-slate-400 shrink-0" />
      </div>
    );
  }

  // Image message
  if (comment.type === 'image' && comment.mediaUrl) {
    return (
      <div className="relative rounded-lg overflow-hidden max-w-[300px]">
        <Image
          src={comment.mediaUrl}
          alt={comment.text || 'Imagem'}
          width={300}
          height={200}
          className="object-cover cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => window.open(comment.mediaUrl, '_blank')}
        />
        {comment.text && (
          <p className="text-sm mt-2">{comment.text}</p>
        )}
      </div>
    );
  }

  // Video message
  if (comment.type === 'video' && comment.mediaUrl) {
    return (
      <div className="relative rounded-lg overflow-hidden max-w-[300px]">
        <video
          ref={videoRef}
          src={comment.mediaUrl}
          poster={comment.mediaThumbnail}
          controls
          className="w-full rounded-lg"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        {comment.text && (
          <p className="text-sm mt-2">{comment.text}</p>
        )}
      </div>
    );
  }

  // Text message (fallback)
  return <p className="text-sm">{comment.text}</p>;
}
