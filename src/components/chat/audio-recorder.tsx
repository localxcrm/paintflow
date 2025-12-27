'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, Pause, Trash2, Send, Loader2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

// Dynamically import VoiceRecorder only when needed
let VoiceRecorder: typeof import('capacitor-voice-recorder').VoiceRecorder | null = null;
if (typeof window !== 'undefined') {
  import('capacitor-voice-recorder').then(module => {
    VoiceRecorder = module.VoiceRecorder;
  }).catch(() => {
    console.log('VoiceRecorder plugin not available');
  });
}

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number, mimeType: string) => void;
  onCancel: () => void;
  isUploading?: boolean;
  autoStart?: boolean;
}

// Helper to convert base64 to Blob
const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

export function AudioRecorder({ onRecordingComplete, onCancel, isUploading, autoStart = true }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [mimeType, setMimeType] = useState('audio/mp4');
  const [useNativeRecording, setUseNativeRecording] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  // Check if running on native iOS
  const isNative = Capacitor.isNativePlatform();
  const isIOS = Capacitor.getPlatform() === 'ios';

  // Web recording using MediaRecorder API (defined first so it can be used as fallback)
  const startWebRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Determine best mime type for the browser
      let selectedMimeType = 'audio/webm'; // Default to webm for better compatibility
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        selectedMimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        selectedMimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        selectedMimeType = 'audio/webm';
      }
      setMimeType(selectedMimeType);
      setUseNativeRecording(false);

      const mediaRecorder = new MediaRecorder(stream, { mimeType: selectedMimeType });
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
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setHasStarted(true);

      timerRef.current = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }, []);

  const stopWebRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, []);

  // Native iOS recording using VoiceRecorder plugin
  const startNativeRecording = useCallback(async () => {
    try {
      // Check if VoiceRecorder is available
      if (!VoiceRecorder) {
        console.log('VoiceRecorder not available, falling back to web recording');
        await startWebRecording();
        return;
      }

      // Check if plugin has the method
      if (typeof VoiceRecorder.requestAudioRecordingPermission !== 'function') {
        console.log('VoiceRecorder methods not available, falling back to web recording');
        await startWebRecording();
        return;
      }

      // Request permission first
      const permission = await VoiceRecorder.requestAudioRecordingPermission();
      if (!permission.value) {
        // Permission denied, try web recording as fallback
        console.log('Native permission denied, trying web recording');
        await startWebRecording();
        return;
      }

      // Start recording
      await VoiceRecorder.startRecording();
      setIsRecording(true);
      setHasStarted(true);
      setUseNativeRecording(true);
      startTimeRef.current = Date.now();

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch (error) {
      console.error('Error starting native recording:', error);
      // Fall back to web recording
      console.log('Falling back to web recording due to native error');
      try {
        await startWebRecording();
      } catch (webError) {
        console.error('Web recording also failed:', webError);
        alert('Erro ao iniciar gravação. Verifique as permissões do microfone.');
        onCancel();
      }
    }
  }, [onCancel, startWebRecording]);

  const stopNativeRecording = useCallback(async () => {
    try {
      if (!VoiceRecorder || typeof VoiceRecorder.stopRecording !== 'function') {
        // Not using native recording, stop web recording instead
        stopWebRecording();
        return;
      }

      const result = await VoiceRecorder.stopRecording();

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setIsRecording(false);

      if (result.value && result.value.recordDataBase64) {
        // iOS records as AAC in m4a container - widely compatible
        const audioMimeType = 'audio/mp4';
        setMimeType(audioMimeType);

        // Convert base64 to blob
        const blob = base64ToBlob(result.value.recordDataBase64, audioMimeType);
        setAudioBlob(blob);

        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      }
    } catch (error) {
      console.error('Error stopping native recording:', error);
      // Try stopping web recording as fallback
      stopWebRecording();
    }
  }, [stopWebRecording]);

  // Unified start/stop functions
  const startRecording = useCallback(async () => {
    if (isNative && isIOS && VoiceRecorder) {
      await startNativeRecording();
    } else {
      await startWebRecording();
    }
  }, [isNative, isIOS, startNativeRecording, startWebRecording]);

  const stopRecording = useCallback(async () => {
    if (useNativeRecording) {
      await stopNativeRecording();
    } else {
      stopWebRecording();
    }
  }, [useNativeRecording, stopNativeRecording, stopWebRecording]);

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
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [audioUrl]);

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
      onRecordingComplete(audioBlob, recordingTime, mimeType);
    }
  }, [audioBlob, recordingTime, mimeType, onRecordingComplete]);

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
            onClick={async () => {
              await stopRecording();
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
