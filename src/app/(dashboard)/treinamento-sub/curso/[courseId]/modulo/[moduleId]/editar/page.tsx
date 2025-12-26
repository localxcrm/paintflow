'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
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
  Plus,
  X,
  CheckSquare,
  Loader2,
  Wrench,
  Shield,
  CheckCircle,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

// Dynamic import for TinyMCE to avoid SSR issues
const Editor = dynamic(() => import('@tinymce/tinymce-react').then(mod => mod.Editor), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] bg-slate-100 rounded-lg flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
    </div>
  ),
});

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

interface PageProps {
  params: Promise<{ courseId: string; moduleId: string }>;
}

const categories = [
  { id: 'producao', label: 'Producao', icon: Wrench },
  { id: 'seguranca', label: 'Seguranca', icon: Shield },
  { id: 'qualidade', label: 'Qualidade', icon: CheckCircle },
  { id: 'atendimento', label: 'Atendimento', icon: Users },
];

export default function EditarModuloPage({ params }: PageProps) {
  const { courseId, moduleId } = use(params);
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('producao');
  const [content, setContent] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  useEffect(() => {
    loadTraining();
  }, [moduleId]);

  const loadTraining = async () => {
    try {
      const res = await fetch(`/api/sub-training?id=${moduleId}`);
      if (!res.ok) throw new Error('Failed to load');

      const data = await res.json();
      setTitle(data.title || '');
      setCategory(data.category || 'producao');
      setContent(data.content || '');
      setChecklist(data.checklist || []);
      setIsPublished(data.isPublished || false);
    } catch {
      toast.error('Erro ao carregar modulo');
      router.push(`/treinamento-sub/curso/${courseId}`);
    } finally {
      setIsLoading(false);
    }
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
          id: moduleId,
          title: title.trim(),
          category,
          content,
          checklist,
          images: [], // Images are now inline in the content
          videoUrl: '',
          isPublished,
        }),
      });

      if (!res.ok) throw new Error('Failed to save');

      toast.success('Modulo atualizado com sucesso!');
      router.push(`/treinamento-sub/curso/${courseId}`);
    } catch {
      toast.error('Erro ao salvar modulo');
    } finally {
      setIsSaving(false);
    }
  };

  // TinyMCE image upload handler
  const handleImageUpload = async (blobInfo: { blob: () => Blob; filename: () => string }) => {
    const file = blobInfo.blob();
    const fileName = `training/${Date.now()}-${blobInfo.filename()}`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('context', 'training');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const { url } = await res.json();
      return url;
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Erro ao fazer upload da imagem');
      throw error;
    }
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
        <Button variant="ghost" size="icon" onClick={() => router.push(`/treinamento-sub/curso/${courseId}`)}>
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

      {/* Rich Content Editor */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <Label className="mb-3 block">Conteudo do Modulo</Label>
          <Editor
            apiKey="gizi0acpnuz76w6xxnf3c8alhxpwp8icpy3e3gmvw95eontf"
            value={content}
            onEditorChange={(newContent) => setContent(newContent)}
            init={{
              height: 500,
              menubar: false,
              plugins: [
                'anchor', 'autolink', 'charmap', 'codesample', 'emoticons',
                'image', 'link', 'lists', 'media', 'searchreplace', 'table',
                'visualblocks', 'wordcount'
              ],
              toolbar: 'undo redo | blocks | bold italic underline strikethrough | ' +
                'alignleft aligncenter alignright | bullist numlist | ' +
                'link image media | table | emoticons charmap | removeformat',
              content_style: `
                body {
                  font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
                  font-size: 14px;
                  line-height: 1.6;
                  padding: 16px;
                }
                img { max-width: 100%; height: auto; border-radius: 8px; }
                h1, h2, h3 { margin-top: 1.5em; margin-bottom: 0.5em; }
                p { margin-bottom: 1em; }
                ul, ol { margin-left: 1.5em; margin-bottom: 1em; }
              `,
              images_upload_handler: handleImageUpload,
              automatic_uploads: true,
              file_picker_types: 'image',
              branding: false,
              promotion: false,
              language: 'pt_BR',
            }}
          />
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
    </div>
  );
}
