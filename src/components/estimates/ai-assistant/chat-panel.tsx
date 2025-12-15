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
- "Older house that needs extra prep"`,
    timestamp: new Date().toISOString(),
  },
];

export function ChatPanel({ onApplyLineItems, onApplyRiskModifiers }: ChatPanelProps) {
  const [messages, setMessages] = useState<AIMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Find matching mock response
    const inputLower = input.toLowerCase();
    let response = mockResponses.find((r) =>
      r.trigger.some((t) => inputLower.includes(t))
    );

    const assistantMessage: AIMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response?.response ||
        `I understand you're looking for a quote. Could you specify:
- Room types (bedroom, bathroom, kitchen, etc.)
- Room sizes (small, medium, large)
- Scope (walls only, walls+trim, full refresh)

For example: "2 medium bedrooms, walls and trim"`,
      timestamp: new Date().toISOString(),
      suggestedLineItems: response?.lineItems,
      suggestedRiskModifiers: response?.riskModifiers,
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceToggle = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        const audioChunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());

          // For demo, simulate transcription
          // In production, send audioChunks to Whisper API
          const mockTranscription = "3 medium bedrooms with walls and trim";
          setInput(mockTranscription);

          // Add a message showing voice was captured
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content: `Voice captured. I heard: "${mockTranscription}"\n\nPress Enter or click Send to process.`,
              timestamp: new Date().toISOString(),
            },
          ]);
        };

        mediaRecorder.start();
        setIsRecording(true);

        // Auto-stop after 10 seconds
        setTimeout(() => {
          if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
          }
        }, 10000);
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

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe the painting job..."
            disabled={isLoading || isRecording}
            className="flex-1"
          />
          <Button
            variant={isRecording ? "destructive" : "outline"}
            onClick={handleVoiceToggle}
            disabled={isLoading}
            className={cn(isRecording && "animate-pulse")}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {isRecording
            ? "Recording... Click mic to stop (auto-stops in 10s)"
            : "Press Enter to send or use the mic for voice input."}
        </p>
      </div>
    </Card>
  );
}
