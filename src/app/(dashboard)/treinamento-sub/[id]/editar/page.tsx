'use client';

import { useState, useRef, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Save,
  Bold,
  Italic,
  List,
  Heading1,
  Heading2,
  Lightbulb,
  AlertTriangle,
  AlertCircle,
  Upload,
  Video,
  Plus,
  X,
  CheckSquare,
  Eye,
  Edit3,
  Loader2,
  Wrench,
  Shield,
  CheckCircle,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

const categories = [
  { id: 'producao', label: 'Producao', icon: Wrench },
  { id: 'seguranca', label: 'Seguranca', icon: Shield },
  { id: 'qualidade', label: 'Qualidade', icon: CheckCircle },
  { id: 'atendimento', label: 'Atendimento', icon: Users },
];

const quickIcons = [
  { icon: '✅', label: 'Check' },
  { icon: '❌', label: 'X' },
  { icon: '⭐', label: 'Estrela' },
  { icon: '💡', label: 'Dica' },
  { icon: '⚠️', label: 'Aviso' },
  { icon: '❗', label: 'Importante' },
  { icon: '📸', label: 'Foto' },
  { icon: '🔧', label: 'Ferramenta' },
  { icon: '🎯', label: 'Meta' },
  { icon: '👍', label: 'Positivo' },
];

export default function EditarTreinamentoSubPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('producao');
  const [content, setContent] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('edit');
  const [newChecklistItem, setNewChecklistItem] = useState('');

  useEffect(() => {
    loadTraining();
  }, [id]);

  const loadTraining = async () => {
    try {
      const res = await fetch(`/api/sub-training?id=${id}`);
      if (!res.ok) throw new Error('Failed to load');

      const data = await res.json();
      setTitle(data.title || '');
      setCategory(data.category || 'producao');
      setContent(data.content || '');
      setChecklist(data.checklist || []);
      setImages(data.images || []);
      setVideoUrl(data.videoUrl || '');
      setIsPublished(data.isPublished || false);
    } catch {
      toast.error('Erro ao carregar modulo');
      router.push('/treinamento-sub');
    } finally {
      setIsLoading(false);
    }
  };

  const insertText = (before: string, after = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);

    const newContent =
      content.substring(0, start) + before + selected + after + content.substring(end);

    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selected.length
      );
    }, 0);
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    setChecklist([
      ...checklist,
      { id: crypto.randomUUID(), text: newChecklistItem.trim(), checked: false },
    ]);
    setNewChecklistItem('');
  };

  const removeChecklistItem = (itemId: string) => {
    setChecklist(checklist.filter((item) => item.id !== itemId));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Maximo 5MB');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImages([...images, base64]);
        toast.success('Imagem adicionada');
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error('Erro ao carregar imagem');
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Titulo e obrigatorio');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/sub-training', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          title: title.trim(),
          category,
          content,
          checklist,
          images,
          videoUrl,
          isPublished,
        }),
      });

      if (!res.ok) throw new Error('Failed to save');

      toast.success('Modulo atualizado com sucesso!');
      router.push('/treinamento-sub');
    } catch {
      toast.error('Erro ao salvar modulo');
    } finally {
      setIsSaving(false);
    }
  };

  // Render markdown preview
  const renderContent = (text: string) => {
    let html = text
      // Escape HTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Headers
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
      // Bold and italic
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Lists
      .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
      // Callouts
      .replace(
        /:::dica\n([\s\S]*?):::/g,
        '<div class="bg-green-50 border-l-4 border-green-500 p-4 my-4 rounded-r"><div class="flex gap-2"><span>💡</span><div>$1</div></div></div>'
      )
      .replace(
        /:::aviso\n([\s\S]*?):::/g,
        '<div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded-r"><div class="flex gap-2"><span>⚠️</span><div>$1</div></div></div>'
      )
      .replace(
        /:::importante\n([\s\S]*?):::/g,
        '<div class="bg-red-50 border-l-4 border-red-500 p-4 my-4 rounded-r"><div class="flex gap-2"><span>❗</span><div>$1</div></div></div>'
      )
      // Line breaks
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br />');

    return `<p class="mb-4">${html}</p>`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Editar Modulo</h1>
          <p className="text-slate-500">Atualize o conteudo do treinamento</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="published"
              checked={isPublished}
              onCheckedChange={setIsPublished}
            />
            <Label htmlFor="published" className="text-sm">
              {isPublished ? 'Publicado' : 'Rascunho'}
            </Label>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar
          </Button>
        </div>
      </div>

      {/* Title and Category */}
      <Card className="mb-6">
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label htmlFor="title">Titulo do Modulo</Label>
            <Input
              id="title"
              placeholder="Ex: Como preparar o local de trabalho"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <cat.icon className="h-4 w-4" />
                      {cat.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content Editor */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="edit" className="gap-2">
                  <Edit3 className="h-4 w-4" />
                  Editar
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Visualizar
                </TabsTrigger>
              </TabsList>

              {activeTab === 'edit' && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertText('**', '**')}
                    title="Negrito"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertText('*', '*')}
                    title="Italico"
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertText('# ')}
                    title="Titulo"
                  >
                    <Heading1 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertText('## ')}
                    title="Subtitulo"
                  >
                    <Heading2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertText('- ')}
                    title="Lista"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <div className="w-px h-6 bg-slate-200 mx-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertText(':::dica\n', '\n:::')}
                    title="Dica"
                    className="text-green-600"
                  >
                    <Lightbulb className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertText(':::aviso\n', '\n:::')}
                    title="Aviso"
                    className="text-yellow-600"
                  >
                    <AlertTriangle className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertText(':::importante\n', '\n:::')}
                    title="Importante"
                    className="text-red-600"
                  >
                    <AlertCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <TabsContent value="edit" className="mt-0">
              <Textarea
                ref={textareaRef}
                placeholder="Escreva o conteudo do modulo aqui...

Use markdown para formatar:
# Titulo
## Subtitulo
**negrito** e *italico*
- Lista de itens

:::dica
Dica importante
:::
"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
              />

              {/* Quick icons */}
              <div className="flex flex-wrap gap-1 mt-3">
                {quickIcons.map((item) => (
                  <Button
                    key={item.icon}
                    variant="ghost"
                    size="sm"
                    onClick={() => insertText(item.icon + ' ')}
                    title={item.label}
                  >
                    {item.icon}
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-0">
              <div
                className="prose prose-slate max-w-none min-h-[400px] p-4 bg-slate-50 rounded-lg"
                dangerouslySetInnerHTML={{ __html: renderContent(content) }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Checklist */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckSquare className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">Checklist</h3>
          </div>

          {checklist.length > 0 && (
            <div className="space-y-2 mb-4">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg"
                >
                  <Checkbox checked={item.checked} disabled />
                  <span className="flex-1">{item.text}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeChecklistItem(item.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="Adicionar item ao checklist..."
              value={newChecklistItem}
              onChange={(e) => setNewChecklistItem(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
            />
            <Button onClick={addChecklistItem} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">Imagens</h3>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Imagem
            </Button>
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {images.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img}
                    alt={`Imagem ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Video className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">Video do YouTube</h3>
          </div>
          <Input
            placeholder="Cole a URL do video do YouTube"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
          {videoUrl && (
            <div className="mt-4 aspect-video">
              <iframe
                src={videoUrl.replace('watch?v=', 'embed/')}
                className="w-full h-full rounded-lg"
                allowFullScreen
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
