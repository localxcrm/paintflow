'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Bot, User, Send, Loader2, Sparkles, Mic, Square,
    Volume2, VolumeX, Phone, PhoneOff, X, MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export function AIAssistantWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: 'Olá! Sou seu assistente PaintFlow. Como posso ajudar com seus dados hoje?'
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    const [isCallActive, setIsCallActive] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    // Handle incoming assistant messages for TTS
    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.role === 'assistant' && (isVoiceMode || isCallActive) && lastMessage.id !== 'welcome') {
            playMessage(lastMessage.content);
        }
    }, [messages, isVoiceMode, isCallActive]);

    const playMessage = async (text: string) => {
        try {
            const response = await fetch('/api/ai/speech', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            if (!response.ok) throw new Error('Failed to generate speech');

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            if (audioPlayerRef.current) {
                audioPlayerRef.current.src = url;
                audioPlayerRef.current.play();
            }
        } catch (error) {
            console.error('Speech error:', error);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                await handleAudioUpload(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Mic error:', error);
            toast.error('Erro ao acessar o microfone.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleAudioUpload = async (blob: Blob) => {
        setIsLoading(true);
        const formData = new FormData();
        formData.append('file', blob, 'recording.wav');

        try {
            const res = await fetch('/api/ai/transcribe', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.text) {
                await sendMessage(data.text);
            }
        } catch (error) {
            console.error('Transcription error:', error);
            toast.error('Erro ao transcrever áudio.');
            setIsLoading(false);
        }
    };

    const sendMessage = async (text: string) => {
        if (!text.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text.trim()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Capture Business Strategy context from localStorage
            const vto = typeof window !== 'undefined' ? localStorage.getItem('paintpro_vto') : null;
            const rocks = typeof window !== 'undefined' ? localStorage.getItem('paintpro_rocks') : null;

            const contextMessages = messages.slice(-10).map(m => ({
                role: m.role,
                content: m.content
            }));
            contextMessages.push({ role: 'user', content: userMessage.content });

            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: contextMessages,
                    strategyContext: {
                        vto: vto ? JSON.parse(vto) : null,
                        rocks: rocks ? JSON.parse(rocks) : null
                    }
                })
            });

            if (!response.ok) throw new Error('Failed to fetch response');
            const data = await response.json();

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.content || 'Erro no processamento.'
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            toast.error('Erro ao conectar com o assistente.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    const toggleCall = () => {
        setIsCallActive(!isCallActive);
        if (!isCallActive) {
            toast.success('Modo de Ligação Ativado');
        }
    };

    return (
        <>
            <audio ref={audioPlayerRef} className="hidden" />

            {/* Floating Toggle Button */}
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-50 p-0 overflow-hidden group hover:scale-110 transition-transform bg-blue-600 hover:bg-blue-700"
                >
                    <MessageCircle className="h-7 w-7 text-white group-hover:hidden" />
                    <Sparkles className="h-7 w-7 text-white hidden group-hover:block animate-pulse" />
                </Button>
            )}

            {/* Chat Widget Pop-up */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-[400px] h-[600px] flex flex-col z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <Card className="flex-1 flex flex-col overflow-hidden border-slate-200 shadow-2xl">
                        <CardHeader className="p-4 border-b bg-slate-900 text-white flex-row items-center justify-between space-y-0">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-blue-600 rounded">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-bold">Assistente PaintFlow</CardTitle>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-[10px] text-slate-400 font-medium">Online</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-white"
                                    onClick={() => setIsVoiceMode(!isVoiceMode)}
                                >
                                    {isVoiceMode ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-white"
                                    onClick={toggleCall}
                                >
                                    {isCallActive ? <PhoneOff className="h-4 w-4 text-red-500" /> : <Phone className="h-4 w-4" />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-white"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="flex-1 p-0 overflow-hidden relative flex flex-col bg-white">
                            <ScrollArea className="flex-1 p-4">
                                <div className="space-y-4 pb-4">
                                    {messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={cn(
                                                "flex gap-3 max-w-[85%]",
                                                message.role === 'user' ? "ml-auto flex-row-reverse" : ""
                                            )}
                                        >
                                            <Avatar className={cn(
                                                "h-7 w-7 mt-0.5 shrink-0",
                                                message.role === 'assistant' ? "bg-blue-600" : "bg-slate-100 border text-slate-600"
                                            )}>
                                                <AvatarFallback className={cn("text-[10px]", message.role === 'assistant' ? "text-white" : "")}>
                                                    {message.role === 'assistant' ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div
                                                className={cn(
                                                    "rounded-2xl px-3 py-2 text-sm",
                                                    message.role === 'user'
                                                        ? "bg-blue-600 text-white"
                                                        : "bg-slate-100 text-slate-800"
                                                )}
                                            >
                                                <div className="whitespace-pre-wrap leading-relaxed">
                                                    {message.content}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex gap-3 max-w-[80%]">
                                            <Avatar className="h-7 w-7 bg-blue-600">
                                                <AvatarFallback className="text-white">
                                                    <Bot className="h-3.5 w-3.5" />
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="bg-slate-50 rounded-2xl px-3 py-2 flex items-center gap-2">
                                                <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                                                <span className="text-[10px] text-slate-400">Analisando...</span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={scrollRef} />
                                </div>
                            </ScrollArea>

                            {isCallActive && (
                                <div className="absolute inset-x-0 bottom-20 flex justify-center p-4 pointer-events-none">
                                    <div className="bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-3 animate-pulse pointer-events-auto">
                                        <div className="flex gap-1 items-end h-3">
                                            <div className="w-0.5 bg-blue-400 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <div className="w-0.5 bg-blue-400 h-3 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <div className="w-0.5 bg-blue-400 h-2 rounded-full animate-bounce" />
                                        </div>
                                        <span className="text-[10px] font-medium uppercase tracking-wider">Modo Voz Ativo</span>
                                    </div>
                                </div>
                            )}

                            <div className="p-3 border-t bg-white">
                                <form onSubmit={handleSubmit} className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            placeholder={isRecording ? "Gravando áudio..." : "Pergunte algo..."}
                                            className={cn(
                                                "pr-10 h-10 text-sm focus-visible:ring-blue-600",
                                                isRecording && "border-red-500 focus-visible:ring-red-500"
                                            )}
                                            disabled={isLoading || isRecording}
                                        />
                                        <div className="absolute right-1 top-1 flex gap-1">
                                            {isRecording ? (
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={stopRecording}
                                                >
                                                    <Square className="h-3.5 w-3.5" />
                                                </Button>
                                            ) : (
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-slate-400 hover:text-blue-600"
                                                    onClick={startRecording}
                                                    disabled={isLoading}
                                                >
                                                    <Mic className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    <Button type="submit" size="icon" className="h-10 w-10 shrink-0 bg-blue-600 hover:bg-blue-700" disabled={isLoading || isRecording || !input.trim()}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </form>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </>
    );
}
