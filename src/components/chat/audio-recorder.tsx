'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, Pause, Trash2, Send, Loader2 } from 'lucide-react';

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number, mimeType: string) => void;
  onCancel: () => void;
  isUploading?: boolean;
  autoStart?: boolean; // Auto-start recording when component mounts
}

export function AudioRecorder({ onRecordingComplete, onCancel, isUploading, autoStart = true }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number>(0);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Prefer mp4 for maximum compatibility (Safari/iOS can't play webm)
      // Use webm only as fallback on browsers that don't support mp4
      let mimeType = 'audio/mp4';
      if (!MediaRecorder.isTypeSupported('audio/mp4')) {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mpeg')) {
          mimeType = 'audio/mpeg';
        }
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      startTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setIsPaused(false);
      setHasStarted(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Não foi possível acessar o microfone. Verifique as permissões do navegador.');
      onCancel(); // Cancel if we can't get microphone access
    }
  }, [onCancel]);

  // Auto-start recording when component mounts
  useEffect(() => {
    if (autoStart && !hasStarted) {
      startRecording();
    }
  }, [autoStart, hasStarted, startRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [audioUrl]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, []);

  const togglePlayback = useCallback(() => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying, audioUrl]);

  const handleAudioEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const deleteRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
  }, [audioUrl]);

  const handleSend = useCallback(() => {
    if (audioBlob) {
      onRecordingComplete(audioBlob, recordingTime, audioBlob.type);
    }
  }, [audioBlob, recordingTime, onRecordingComplete]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // If we have a recording, show playback controls
  if (audioBlob && audioUrl) {
    return (
      <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-lg">
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={handleAudioEnded}
          className="hidden"
        />

        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlayback}
          className="h-8 w-8"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="h-1 flex-1 bg-slate-300 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: isPlaying ? '100%' : '0%' }}
              />
            </div>
            <span className="text-xs text-slate-500 min-w-[40px]">
              {formatTime(recordingTime)}
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={deleteRecording}
          className="h-8 w-8 text-red-500 hover:text-red-700"
          disabled={isUploading}
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="h-8 w-8"
          disabled={isUploading}
        >
          ✕
        </Button>

        <Button
          size="sm"
          onClick={handleSend}
          disabled={isUploading}
          className="gap-1"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Enviar
        </Button>
      </div>
    );
  }

  // Recording controls
  return (
    <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
      {isRecording ? (
        <>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm text-red-700 font-medium">
              Gravando... {formatTime(recordingTime)}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              stopRecording();
              onCancel();
            }}
            className="h-8 w-8"
          >
            ✕
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={stopRecording}
            className="gap-1"
          >
            <Square className="h-4 w-4" />
            Parar
          </Button>
        </>
      ) : autoStart && !hasStarted ? (
        // Loading state when auto-starting
        <>
          <div className="flex items-center gap-2 flex-1">
            <Loader2 className="h-4 w-4 animate-spin text-red-500" />
            <span className="text-sm text-slate-500">
              Preparando microfone...
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="h-8 w-8"
          >
            ✕
          </Button>
        </>
      ) : (
        // Manual start state (when autoStart is false)
        <>
          <span className="text-sm text-slate-500 flex-1">
            Clique para gravar áudio
          </span>

          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="h-8 w-8"
          >
            ✕
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={startRecording}
            className="gap-1 bg-red-500 hover:bg-red-600"
          >
            <Mic className="h-4 w-4" />
            Gravar
          </Button>
        </>
      )}
    </div>
  );
}
