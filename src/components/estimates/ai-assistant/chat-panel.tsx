'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AIMessage, EstimateLineItem, Scope } from '@/types';
import {
  Bot,
  Send,
  Sparkles,
  Loader2,
  Plus,
  DollarSign,
  AlertTriangle,
  Mic,
  MicOff,
  Square,
  Volume2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatPanelProps {
  onApplyLineItems: (items: EstimateLineItem[]) => void;
  onApplyRiskModifiers: (modifiers: string[]) => void;
}

// Mock AI responses for demo
const mockResponses = [
  {
    trigger: ['bedroom', '3 bed', 'three bed'],
    response: `I found the following in your price book:

**Suggested Line Items:**
- 3x Medium Bedroom - Walls+Trim @ $1,200 = $3,600

Would you like me to add these to your estimate?`,
    lineItems: [
      { id: '1', description: 'Medium Bedroom - Walls + Trim', location: 'Bedroom 1', scope: 'walls_trim' as Scope, quantity: 1, unitPrice: 1200, lineTotal: 1200 },
      { id: '2', description: 'Medium Bedroom - Walls + Trim', location: 'Bedroom 2', scope: 'walls_trim' as Scope, quantity: 1, unitPrice: 1200, lineTotal: 1200 },
      { id: '3', description: 'Medium Bedroom - Walls + Trim', location: 'Bedroom 3', scope: 'walls_trim' as Scope, quantity: 1, unitPrice: 1200, lineTotal: 1200 },
    ],
  },
  {
    trigger: ['bathroom', '2 bath', 'two bath'],
    response: `Found bathroom pricing:

**Suggested Line Items:**
- 2x Small Bathroom - Walls+Trim @ $600 = $1,200

Ready to add to your estimate?`,
    lineItems: [
      { id: '4', description: 'Small Bathroom - Walls + Trim', location: 'Bathroom 1', scope: 'walls_trim' as Scope, quantity: 1, unitPrice: 600, lineTotal: 600 },
      { id: '5', description: 'Small Bathroom - Walls + Trim', location: 'Bathroom 2', scope: 'walls_trim' as Scope, quantity: 1, unitPrice: 600, lineTotal: 600 },
    ],
  },
  {
    trigger: ['old', 'prep', 'older home'],
    response: `Detected job conditions:

**Risk Modifiers:**
- Older home prep work: +10%
- Repairs Beyond Minor: +15%

Should I apply these adjustments?`,
    riskModifiers: ['Repairs Beyond Minor', 'Dark to Light Color Change'],
  },
];

const initialMessages: AIMessage[] = [
  {
    id: '0',
    role: 'assistant',
    content: `Hi! I'm your AI estimate assistant. Describe the painting job and I'll help you build an estimate using your price book.

**Try saying something like:**
- "3 bedrooms medium size, walls and trim"
- "2 small bathrooms with full refresh"
- "Older house that needs extra prep"

**Voice Recording:** Click Record and describe your entire walkthrough (up to 10 minutes). For detailed estimates, speak for at least 5 minutes covering all rooms, surfaces, conditions, and client details.`,
    timestamp: new Date().toISOString(),
  },
];

// Maximum recording duration in seconds (10 minutes)
const MAX_RECORDING_DURATION = 600;
// Minimum recording duration in seconds (5 minutes for complete estimate descriptions)
const MIN_RECOMMENDED_DURATION = 300;

export function ChatPanel({ onApplyLineItems, onApplyRiskModifiers }: ChatPanelProps) {
  const [messages, setMessages] = useState<AIMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceInput, setIsVoiceInput] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionId = useRef(`session-${Date.now()}`);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Cleanup recording timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = input;
    const wasVoiceInput = isVoiceInput;
    setInput('');
    setIsVoiceInput(false);
    setIsLoading(true);

    try {
      // Call the real AI API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId.current,
          message: messageText,
          isVoiceInput: wasVoiceInput,
        }),
      });

      if (!response.ok) throw new Error('Failed to get AI response');

      const data = await response.json();

      const assistantMessage: AIMessage = {
        id: data.message.id,
        role: 'assistant',
        content: data.message.content,
        timestamp: data.message.createdAt,
        suggestedLineItems: data.suggestedLineItems,
        suggestedRiskModifiers: data.suggestedRiskModifiers,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If voice response is available, play it automatically
      if (data.isVoiceResponse && data.audioUrl) {
        playAudio(data.audioUrl, assistantMessage.id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = (audioUrl: string, messageId: string) => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setPlayingAudioId(messageId);

    audio.onended = () => {
      setPlayingAudioId(null);
      audioRef.current = null;
    };

    audio.onerror = () => {
      console.error('Error playing audio');
      setPlayingAudioId(null);
      audioRef.current = null;
    };

    audio.play();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Clean up recording timer
  const clearRecordingTimer = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const handleVoiceToggle = async () => {
    if (isRecording) {
      // Stop recording
      clearRecordingTimer();
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      setRecordingDuration(0);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100,
          }
        });

        // Use audio/webm with opus codec for better compression on long recordings
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType,
          audioBitsPerSecond: 128000, // Good quality while keeping file size reasonable
        });
        mediaRecorderRef.current = mediaRecorder;
        const audioChunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
          clearRecordingTimer();

          try {
            // Create audio blob from recorded chunks
            const audioBlob = new Blob(audioChunks, { type: mimeType });

            // Check file size (OpenAI Whisper supports up to 25MB)
            const fileSizeMB = audioBlob.size / (1024 * 1024);
            console.log(`Audio file size: ${fileSizeMB.toFixed(2)}MB`);

            if (fileSizeMB > 24) {
              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now().toString(),
                  role: 'assistant',
                  content: `Recording is too large (${fileSizeMB.toFixed(1)}MB). Please try a shorter recording under 10 minutes.`,
                  timestamp: new Date().toISOString(),
                },
              ]);
              return;
            }

            // Convert to File object for API
            const audioFile = new File([audioBlob], 'recording.webm', { type: mimeType });

            // Send to transcription API
            const formData = new FormData();
            formData.append('audio', audioFile);

            setIsLoading(true);
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                role: 'assistant',
                content: `Transcribing ${formatDuration(recordingDuration)} of audio... This may take a moment for longer recordings.`,
                timestamp: new Date().toISOString(),
              },
            ]);

            const response = await fetch('/api/ai/transcribe', {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || 'Transcription failed');
            }

            const data = await response.json();
            const transcription = data.text;

            // Set the transcribed text in the input
            setInput(transcription);
            setIsVoiceInput(true); // Mark that this came from voice

            // Show transcription to user with preview
            const preview = transcription.length > 500
              ? transcription.substring(0, 500) + '...'
              : transcription;

            setMessages((prev) => {
              // Remove the "Transcribing..." message
              const filtered = prev.filter(m => !m.content.startsWith('Transcribing'));
              return [
                ...filtered,
                {
                  id: Date.now().toString(),
                  role: 'assistant',
                  content: `Transcription complete (${transcription.split(' ').length} words):\n\n"${preview}"\n\nPress Enter or click Send to process your estimate request.`,
                  timestamp: new Date().toISOString(),
                },
              ];
            });
            setIsLoading(false);
          } catch (error) {
            console.error('Transcription error:', error);
            setMessages((prev) => {
              const filtered = prev.filter(m => !m.content.startsWith('Transcribing'));
              return [
                ...filtered,
                {
                  id: Date.now().toString(),
                  role: 'assistant',
                  content: 'Sorry, I had trouble transcribing the audio. Please try again or type your message.',
                  timestamp: new Date().toISOString(),
                },
              ];
            });
            setIsLoading(false);
          }
        };

        // Request data every 10 seconds for long recordings (helps with memory management)
        mediaRecorder.start(10000);
        setIsRecording(true);
        setRecordingDuration(0);

        // Start duration timer
        recordingTimerRef.current = setInterval(() => {
          setRecordingDuration(prev => {
            const newDuration = prev + 1;
            // Auto-stop at max duration
            if (newDuration >= MAX_RECORDING_DURATION) {
              if (mediaRecorderRef.current?.state === 'recording') {
                mediaRecorderRef.current.stop();
                setIsRecording(false);
              }
              clearRecordingTimer();
            }
            return newDuration;
          });
        }, 1000);

      } catch (error) {
        console.error('Error accessing microphone:', error);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: 'Unable to access microphone. Please check your browser permissions.',
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    }
  };

  const handleApplyItems = (items: EstimateLineItem[]) => {
    onApplyLineItems(items);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Added ${items.length} items to your estimate. The form on the right has been updated.`,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleApplyModifiers = (modifiers: string[]) => {
    onApplyRiskModifiers(modifiers);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Applied ${modifiers.length} risk modifiers to your estimate.`,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-1.5 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
            <Bot className="h-4 w-4 text-white" />
          </div>
          AI Estimate Assistant
          <Badge variant="secondary" className="ml-auto text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            GPT-4
          </Badge>
        </CardTitle>
      </CardHeader>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[90%] rounded-lg px-4 py-3',
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-900'
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                {/* Suggested Line Items */}
                {message.suggestedLineItems && message.suggestedLineItems.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <Separator className="bg-slate-200" />
                    <div className="bg-white rounded-lg p-3 space-y-2">
                      {message.suggestedLineItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-slate-700">{item.description}</span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(item.lineTotal)}
                          </span>
                        </div>
                      ))}
                      <Separator />
                      <div className="flex items-center justify-between font-semibold">
                        <span>Total</span>
                        <span className="text-blue-600">
                          {formatCurrency(
                            message.suggestedLineItems.reduce((sum, item) => sum + item.lineTotal, 0)
                          )}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        className="w-full mt-2 gap-2"
                        onClick={() => handleApplyItems(message.suggestedLineItems!)}
                      >
                        <Plus className="h-4 w-4" />
                        Add to Estimate
                      </Button>
                    </div>
                  </div>
                )}

                {/* Suggested Risk Modifiers */}
                {message.suggestedRiskModifiers && message.suggestedRiskModifiers.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <Separator className="bg-slate-200" />
                    <div className="bg-amber-50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2 text-amber-700 text-sm font-medium">
                        <AlertTriangle className="h-4 w-4" />
                        Risk Modifiers Detected
                      </div>
                      {message.suggestedRiskModifiers.map((modifier, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <span className="text-slate-700">{modifier}</span>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2 gap-2"
                        onClick={() => handleApplyModifiers(message.suggestedRiskModifiers!)}
                      >
                        Apply Modifiers
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Analyzing your request...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Recording Status Bar */}
      {isRecording && (
        <div className="px-4 py-3 bg-red-50 border-t border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75" />
              </div>
              <span className="font-mono text-lg font-semibold text-red-700">
                {formatDuration(recordingDuration)}
              </span>
              <span className="text-sm text-red-600">
                / {formatDuration(MAX_RECORDING_DURATION)} max
              </span>
            </div>
            <div className="flex items-center gap-2">
              {recordingDuration < MIN_RECOMMENDED_DURATION && (
                <span className="text-xs text-amber-600">
                  {formatDuration(MIN_RECOMMENDED_DURATION - recordingDuration)} until recommended min
                </span>
              )}
              {recordingDuration >= MIN_RECOMMENDED_DURATION && (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Good length
                </Badge>
              )}
            </div>
          </div>
          <div className="mt-2 h-1.5 bg-red-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all duration-1000 ease-linear"
              style={{ width: `${(recordingDuration / MAX_RECORDING_DURATION) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isRecording ? "Recording in progress..." : "Describe the painting job..."}
            disabled={isLoading || isRecording}
            className="flex-1"
          />
          <Button
            variant={isRecording ? "destructive" : "outline"}
            onClick={handleVoiceToggle}
            disabled={isLoading}
            className={cn(
              "min-w-[100px] gap-2",
              isRecording && "bg-red-600 hover:bg-red-700"
            )}
          >
            {isRecording ? (
              <>
                <Square className="h-4 w-4" />
                Stop
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                Record
              </>
            )}
          </Button>
          <Button onClick={handleSend} disabled={isLoading || !input.trim() || isRecording}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {isRecording
            ? "Click Stop when finished. Describe all rooms, surfaces, and conditions for your estimate."
            : "Press Enter to send or use Record for voice input (up to 10 min). For detailed estimates, speak for at least 5 minutes."}
        </p>
      </div>
    </Card>
  );
}
