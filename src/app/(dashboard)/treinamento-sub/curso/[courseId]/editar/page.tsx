'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Upload,
  X,
  Loader2,
  BookOpen,
  Users,
  UserCog,
  UsersRound,
  GraduationCap,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default function EditarCursoPage({ params }: PageProps) {
  const { courseId } = use(params);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [targetAudience, setTargetAudience] = useState<'admin' | 'subcontractor' | 'both'>('subcontractor');
  const [courseType, setCourseType] = useState<'training' | 'sop'>('training');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      const res = await fetch(`/api/sub-training/courses?id=${courseId}`);
      if (!res.ok) throw new Error('Failed to load');

      const data = await res.json();
      setTitle(data.title || '');
      setDescription(data.description || '');
      setCoverImage(data.coverImage || null);
      setIsPublished(data.isPublished || false);
      setTargetAudience(data.targetAudience || 'subcontractor');
      setCourseType(data.courseType || 'training');
    } catch {
      toast.error('Erro ao carregar curso');
      router.push('/treinamento-sub');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Imagem muito grande. Maximo 10MB');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('context', 'training');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const { url } = await res.json();
      setCoverImage(url);
      toast.success('Imagem carregada');
    } catch {
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Titulo e obrigatorio');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/sub-training/courses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: courseId,
          title: title.trim(),
          description: description.trim() || null,
          coverImage,
          isPublished,
          targetAudience,
          courseType,
        }),
      });

      if (!res.ok) throw new Error('Failed to save');

      toast.success(courseType === 'sop' ? 'SOP atualizado com sucesso!' : 'Curso atualizado com sucesso!');
      router.push(`/treinamento-sub?type=${courseType}`);
    } catch {
      toast.error('Erro ao salvar curso');
    } finally {
      setIsSaving(false);
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
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/treinamento-sub?type=${courseType}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            {courseType === 'sop' ? (
              <FileText className="h-6 w-6 text-emerald-600" />
            ) : (
              <GraduationCap className="h-6 w-6 text-blue-600" />
            )}
            {courseType === 'sop' ? 'Editar SOP' : 'Editar Curso'}
          </h1>
          <p className="text-slate-500">
            {courseType === 'sop' ? 'Atualize as informacoes do SOP' : 'Atualize as informacoes do curso'}
          </p>
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

      {/* Cover Image */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <Label className="mb-3 block">
            {courseType === 'sop' ? 'Capa do SOP (opcional)' : 'Capa do Curso (opcional)'}
          </Label>
          <div className="flex gap-4">
            <div className="relative w-32 h-44 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
              {coverImage ? (
                <>
                  <Image
                    src={coverImage}
                    alt="Capa"
                    fill
                    className="object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => setCoverImage(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <BookOpen className="h-10 w-10 text-slate-300" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="gap-2"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {coverImage ? 'Trocar Imagem' : 'Adicionar Capa'}
              </Button>
              <p className="text-xs text-slate-500 mt-2">
                Recomendado: 300x400px (proporcao 3:4)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Title and Description */}
      <Card className="mb-6">
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label htmlFor="title">
              {courseType === 'sop' ? 'Titulo do SOP *' : 'Titulo do Curso *'}
            </Label>
            <Input
              id="title"
              placeholder={courseType === 'sop' ? 'Ex: Como Atender o Telefone' : 'Ex: Pintura Residencial Avancada'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="description">Descricao (opcional)</Label>
            <Textarea
              id="description"
              placeholder={courseType === 'sop' ? 'Descreva o procedimento...' : 'Descreva o conteudo do curso...'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 min-h-[100px]"
            />
          </div>
          <div>
            <Label>Publico-Alvo</Label>
            <Select value={targetAudience} onValueChange={(v) => setTargetAudience(v as 'admin' | 'subcontractor' | 'both')}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="subcontractor">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Para Subcontratados
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <UserCog className="h-4 w-4" />
                    Para Administradores
                  </div>
                </SelectItem>
                <SelectItem value="both">
                  <div className="flex items-center gap-2">
                    <UsersRound className="h-4 w-4" />
                    Para Ambos
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
