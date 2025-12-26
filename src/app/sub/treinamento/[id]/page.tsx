'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft,
  Loader2,
  Wrench,
  Shield,
  CheckCircle,
  Users,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

interface TrainingModule {
  id: string;
  title: string;
  category: string;
  content: string;
  checklist: ChecklistItem[];
  images: string[];
  videoUrl: string;
  order: number;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  producao: Wrench,
  seguranca: Shield,
  qualidade: CheckCircle,
  atendimento: Users,
};

const categoryLabels: Record<string, string> = {
  producao: 'Producao',
  seguranca: 'Seguranca',
  qualidade: 'Qualidade',
  atendimento: 'Atendimento',
};

const categoryColors: Record<string, string> = {
  producao: 'bg-blue-100 text-blue-600',
  seguranca: 'bg-orange-100 text-orange-600',
  qualidade: 'bg-green-100 text-green-600',
  atendimento: 'bg-purple-100 text-purple-600',
};

export default function SubTreinamentoDetalhePage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [module, setModule] = useState<TrainingModule | null>(null);
  const [allModules, setAllModules] = useState<TrainingModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [localChecklist, setLocalChecklist] = useState<ChecklistItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    loadModule();
    loadAllModules();
  }, [id]);

  const loadModule = async () => {
    try {
      const res = await fetch(`/api/sub/training?id=${id}`);
      if (!res.ok) {
        throw new Error('Module not found');
      }
      const data = await res.json();
      setModule(data);
      setLocalChecklist(data.checklist || []);
    } catch (error) {
      console.error('Error loading module:', error);
      toast.error('Erro ao carregar modulo');
      router.push('/sub/treinamento');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllModules = async () => {
    try {
      const res = await fetch('/api/sub/training');
      if (res.ok) {
        const data = await res.json();
        setAllModules(data.modules || []);
      }
    } catch (error) {
      console.error('Error loading all modules:', error);
    }
  };

  const toggleCheckItem = (itemId: string) => {
    setLocalChecklist(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return '';
    // Handle different YouTube URL formats
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return url.replace('watch?v=', 'embed/');
  };

  // Render content - supports both HTML (TinyMCE) and legacy markdown
  const renderContent = (text: string) => {
    if (!text) return '';

    // Check if content is already HTML (from TinyMCE)
    if (text.trim().startsWith('<') || text.includes('<p>') || text.includes('<h')) {
      // Already HTML, return as-is
      return text;
    }

    // Legacy markdown support for old content
    let html = text
      // Escape HTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Headers
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-6 mb-2 text-slate-800">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-8 mb-3 text-slate-900">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-4 text-slate-900">$1</h1>')
      // Bold and italic
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Lists
      .replace(/^- (.+)$/gm, '<li class="ml-4 mb-1 flex items-start gap-2"><span class="text-emerald-500 mt-1">•</span><span>$1</span></li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 mb-1 list-decimal">$2</li>')
      // Callouts
      .replace(
        /:::dica\n([\s\S]*?):::/g,
        '<div class="bg-green-50 border-l-4 border-green-500 p-4 my-4 rounded-r-lg"><div class="flex gap-3"><span class="text-2xl">💡</span><div class="flex-1 text-green-800">$1</div></div></div>'
      )
      .replace(
        /:::aviso\n([\s\S]*?):::/g,
        '<div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded-r-lg"><div class="flex gap-3"><span class="text-2xl">⚠️</span><div class="flex-1 text-yellow-800">$1</div></div></div>'
      )
      .replace(
        /:::importante\n([\s\S]*?):::/g,
        '<div class="bg-red-50 border-l-4 border-red-500 p-4 my-4 rounded-r-lg"><div class="flex gap-3"><span class="text-2xl">❗</span><div class="flex-1 text-red-800">$1</div></div></div>'
      )
      // Line breaks
      .replace(/\n\n/g, '</p><p class="mb-4 text-slate-600 leading-relaxed">')
      .replace(/\n/g, '<br />');

    return `<p class="mb-4 text-slate-600 leading-relaxed">${html}</p>`;
  };

  // Navigation
  const currentIndex = allModules.findIndex(m => m.id === id);
  const prevModule = currentIndex > 0 ? allModules[currentIndex - 1] : null;
  const nextModule = currentIndex < allModules.length - 1 ? allModules[currentIndex + 1] : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-3 text-slate-500">Carregando modulo...</p>
        </div>
      </div>
    );
  }

  if (!module) {
    return null;
  }

  const Icon = categoryIcons[module.category] || BookOpen;
  const colorClass = categoryColors[module.category] || 'bg-slate-100 text-slate-600';
  const catLabel = categoryLabels[module.category] || module.category;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10 safe-area-top">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-slate-900 truncate">{module.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className={cn('p-1 rounded', colorClass)}>
                <Icon className="h-3 w-3" />
              </div>
              <span className="text-sm text-slate-500">{catLabel}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Main Content */}
        {module.content && (
          <Card>
            <CardContent className="pt-6">
              <div
                className="prose prose-slate max-w-none"
                dangerouslySetInnerHTML={{ __html: renderContent(module.content) }}
              />
            </CardContent>
          </Card>
        )}

        {/* Video */}
        {module.videoUrl && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Play className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold text-slate-900">Video</h3>
              </div>
              <div className="aspect-video rounded-lg overflow-hidden bg-black">
                <iframe
                  src={getYoutubeEmbedUrl(module.videoUrl)}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Images */}
        {module.images && module.images.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-slate-900 mb-4">
                📷 Imagens ({module.images.length})
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {module.images.map((img, index) => (
                  <div
                    key={index}
                    className="cursor-pointer rounded-lg overflow-hidden bg-slate-100"
                    onClick={() => setSelectedImage(img)}
                  >
                    <img
                      src={img}
                      alt={`Imagem ${index + 1}`}
                      className="w-full h-32 object-cover"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Checklist */}
        {localChecklist.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                <h3 className="font-semibold text-slate-900">Checklist</h3>
                <span className="text-sm text-slate-400">
                  ({localChecklist.filter(i => i.checked).length}/{localChecklist.length})
                </span>
              </div>
              <div className="space-y-3">
                {localChecklist.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer',
                      item.checked ? 'bg-emerald-50' : 'bg-slate-50'
                    )}
                    onClick={() => toggleCheckItem(item.id)}
                  >
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={() => toggleCheckItem(item.id)}
                      className="h-5 w-5"
                    />
                    <span className={cn(
                      'flex-1',
                      item.checked && 'text-slate-500 line-through'
                    )}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          {prevModule ? (
            <Button
              variant="outline"
              className="flex-1 h-auto py-3"
              onClick={() => router.push(`/sub/treinamento/${prevModule.id}`)}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              <div className="text-left min-w-0">
                <p className="text-xs text-slate-400">Anterior</p>
                <p className="text-sm font-medium truncate">{prevModule.title}</p>
              </div>
            </Button>
          ) : (
            <div className="flex-1" />
          )}
          {nextModule ? (
            <Button
              variant="default"
              className="flex-1 h-auto py-3 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => router.push(`/sub/treinamento/${nextModule.id}`)}
            >
              <div className="text-right min-w-0">
                <p className="text-xs text-emerald-200">Proximo</p>
                <p className="text-sm font-medium truncate">{nextModule.title}</p>
              </div>
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              variant="default"
              className="flex-1 h-auto py-3 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => router.push('/sub/treinamento')}
            >
              <div className="text-center">
                <p className="text-xs text-emerald-200">Parabens!</p>
                <p className="text-sm font-medium">Voltar ao Inicio</p>
              </div>
            </Button>
          )}
        </div>
      </div>

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setSelectedImage(null)}
          >
            ✕
          </Button>
          <img
            src={selectedImage}
            alt="Imagem ampliada"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
