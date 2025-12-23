'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  ArrowLeft,
  Save,
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Smile,
  Lightbulb,
  AlertTriangle,
  AlertCircle,
  Upload,
  Video,
  Image,
  Plus,
  X,
  CheckSquare,
  Eye,
  Edit3,
  Link,
} from 'lucide-react';
import { toast } from 'sonner';

// Types
interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

interface Article {
  id: string;
  title: string;
  category: string;
  content: string;
  checklist: ChecklistItem[];
  images: string[];
  videoUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface SopEditorProps {
  article?: Article;
  isNew?: boolean;
}

// Categories
const categories = [
  { id: 'vendas', label: 'Vendas' },
  { id: 'producao', label: 'Producao' },
  { id: 'admin', label: 'Administrativo' },
  { id: 'marketing', label: 'Marketing' },
];

// Quick icons/emojis
const quickIcons = [
  { icon: '✅', label: 'Check' },
  { icon: '❌', label: 'X' },
  { icon: '⭐', label: 'Estrela' },
  { icon: '💡', label: 'Dica' },
  { icon: '⚠️', label: 'Aviso' },
  { icon: '❗', label: 'Importante' },
  { icon: '📞', label: 'Telefone' },
  { icon: '📧', label: 'Email' },
  { icon: '📍', label: 'Local' },
  { icon: '🎯', label: 'Meta' },
  { icon: '📸', label: 'Foto' },
  { icon: '🔧', label: 'Ferramenta' },
  { icon: '💰', label: 'Dinheiro' },
  { icon: '👍', label: 'Positivo' },
  { icon: '👎', label: 'Negativo' },
  { icon: '🚀', label: 'Lancamento' },
  { icon: '📋', label: 'Lista' },
  { icon: '🔥', label: 'Urgente' },
  { icon: '💪', label: 'Forca' },
  { icon: '🎨', label: 'Pintura' },
];

export default function SopEditor({ article, isNew = true }: SopEditorProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Form state
  const [title, setTitle] = useState(article?.title || '');
  const [category, setCategory] = useState(article?.category || '');
  const [content, setContent] = useState(article?.content || '');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(article?.checklist || []);
  const [images, setImages] = useState<string[]>(article?.images || []);
  const [videoUrl, setVideoUrl] = useState(article?.videoUrl || '');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('editar');

  // Load article data if editing
  useEffect(() => {
    if (article) {
      setTitle(article.title);
      setCategory(article.category);
      setContent(article.content);
      setChecklist(article.checklist);
      setImages(article.images);
      setVideoUrl(article.videoUrl);
    }
  }, [article]);

  // Insert text at cursor position
  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + text + content.substring(end);
    setContent(newContent);

    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  // Insert formatting around selected text
  const insertFormatting = (prefix: string, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newContent = content.substring(0, start) + prefix + selectedText + suffix + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  // Insert callout block
  const insertCallout = (type: 'dica' | 'aviso' | 'importante') => {
    const callout = `\n:::${type}\nTexto aqui\n:::\n`;
    insertAtCursor(callout);
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione apenas arquivos de imagem');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Imagem muito grande. Maximo 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setImages((prev) => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  // Add image by URL
  const addImageUrl = () => {
    if (!newImageUrl.trim()) return;
    setImages((prev) => [...prev, newImageUrl]);
    setNewImageUrl('');
  };

  // Remove image
  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Add checklist item
  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    setChecklist((prev) => [
      ...prev,
      { id: Date.now().toString(), text: newChecklistItem, checked: false },
    ]);
    setNewChecklistItem('');
  };

  // Remove checklist item
  const removeChecklistItem = (id: string) => {
    setChecklist((prev) => prev.filter((item) => item.id !== id));
  };

  // Save article
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Preencha o titulo');
      return;
    }
    if (!category) {
      toast.error('Selecione uma categoria');
      return;
    }

    setIsSaving(true);

    try {
      const articleData = {
        title,
        category,
        content,
        checklist,
        images,
        videoUrl,
      };

      if (isNew) {
        // Create new article via API
        const res = await fetch('/api/knowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(articleData),
        });

        if (!res.ok) {
          throw new Error('Failed to create article');
        }

        toast.success('SOP criado com sucesso!');
      } else if (article) {
        // Update existing article via API
        const res = await fetch('/api/knowledge', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: article.id,
            ...articleData,
          }),
        });

        if (!res.ok) {
          throw new Error('Failed to update article');
        }

        toast.success('SOP atualizado com sucesso!');
      }

      router.push('/conhecimento');
    } catch (error) {
      toast.error('Erro ao salvar SOP');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // Render markdown preview
  const renderPreview = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;
    let inCallout = false;
    let calloutType = '';
    let calloutContent: string[] = [];

    while (i < lines.length) {
      const line = lines[i];

      // Check for callout start
      if (line.startsWith(':::dica') || line.startsWith(':::aviso') || line.startsWith(':::importante')) {
        inCallout = true;
        calloutType = line.replace(':::', '').trim();
        calloutContent = [];
        i++;
        continue;
      }

      // Check for callout end
      if (line === ':::' && inCallout) {
        const bgColor = calloutType === 'dica' ? 'bg-green-50 border-green-200' :
          calloutType === 'aviso' ? 'bg-yellow-50 border-yellow-200' :
            'bg-red-50 border-red-200';
        const icon = calloutType === 'dica' ? '💡' :
          calloutType === 'aviso' ? '⚠️' : '❗';
        const title = calloutType === 'dica' ? 'Dica' :
          calloutType === 'aviso' ? 'Aviso' : 'Importante';

        elements.push(
          <div key={`callout-${i}`} className={`p-4 rounded-lg border ${bgColor} my-3`}>
            <div className="font-semibold flex items-center gap-2 mb-1">
              <span>{icon}</span>
              <span>{title}</span>
            </div>
            <div className="text-sm">
              {calloutContent.map((c, idx) => (
                <p key={idx}>{c}</p>
              ))}
            </div>
          </div>
        );
        inCallout = false;
        i++;
        continue;
      }

      // Collect callout content
      if (inCallout) {
        calloutContent.push(line);
        i++;
        continue;
      }

      // Regular markdown parsing
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={i} className="text-2xl font-bold mt-4 mb-2">
            {line.replace('# ', '')}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={i} className="text-xl font-semibold mt-4 mb-2">
            {line.replace('## ', '')}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={i} className="text-lg font-semibold mt-3 mb-1">
            {line.replace('### ', '')}
          </h3>
        );
      } else if (line.startsWith('- ')) {
        elements.push(
          <li key={i} className="ml-4 list-disc">
            {line.replace('- ', '')}
          </li>
        );
      } else if (line.match(/^\d+\. /)) {
        elements.push(
          <li key={i} className="ml-4 list-decimal">
            {line.replace(/^\d+\. /, '')}
          </li>
        );
      } else if (line.trim() === '---') {
        // Horizontal rule
        elements.push(<hr key={i} className="my-4 border-slate-300" />);
      } else if (line.startsWith('|') && line.endsWith('|')) {
        // Table row - collect all table rows
        const tableRows: string[] = [line];
        let j = i + 1;
        while (j < lines.length && lines[j].startsWith('|') && lines[j].endsWith('|')) {
          tableRows.push(lines[j]);
          j++;
        }

        // Parse table
        const headerRow = tableRows[0];
        const dataRows = tableRows.slice(2); // Skip header and separator
        const headers = headerRow.split('|').filter(cell => cell.trim()).map(cell => cell.trim());

        elements.push(
          <table key={i} className="w-full my-3 border-collapse border border-slate-300 text-sm">
            <thead>
              <tr className="bg-slate-100">
                {headers.map((header, idx) => (
                  <th key={idx} className="border border-slate-300 px-3 py-2 text-left font-semibold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, rowIdx) => {
                const cells = row.split('|').filter(cell => cell.trim()).map(cell => cell.trim());
                return (
                  <tr key={rowIdx} className="hover:bg-slate-50">
                    {cells.map((cell, cellIdx) => (
                      <td key={cellIdx} className="border border-slate-300 px-3 py-2">
                        {cell}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        );
        i = j - 1; // Skip processed table rows
      } else if (line.trim() === '') {
        elements.push(<br key={i} />);
      } else {
        // Handle bold, italic, inline code, and links
        let processed = line;
        processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>');
        processed = processed.replace(/`(.+?)`/g, '<code class="bg-slate-100 px-1 py-0.5 rounded text-sm font-mono text-pink-600">$1</code>');
        processed = processed.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" class="text-blue-600 hover:underline">$1</a>');
        elements.push(
          <p key={i} dangerouslySetInnerHTML={{ __html: processed }} />
        );
      }
      i++;
    }

    return elements;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/conhecimento')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">
            {isNew ? 'Criar Novo SOP' : 'Editar SOP'}
          </h1>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>

      {/* Title and Category */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Titulo</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Como fazer orcamento"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Editor with Tabs */}
      <Card>
        <CardContent className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="editar" className="flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                Editar
              </TabsTrigger>
              <TabsTrigger value="visualizar" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Visualizar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="editar" className="space-y-4">
              {/* Toolbar */}
              <div className="flex flex-wrap gap-1 p-2 bg-slate-50 rounded-lg border">
                {/* Headings */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting('# ')}
                  title="Titulo 1"
                >
                  <Heading1 className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting('## ')}
                  title="Titulo 2"
                >
                  <Heading2 className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting('### ')}
                  title="Titulo 3"
                >
                  <Heading3 className="w-4 h-4" />
                </Button>

                <div className="w-px h-6 bg-slate-300 mx-1" />

                {/* Text formatting */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting('**', '**')}
                  title="Negrito"
                >
                  <Bold className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting('*', '*')}
                  title="Italico"
                >
                  <Italic className="w-4 h-4" />
                </Button>

                <div className="w-px h-6 bg-slate-300 mx-1" />

                {/* Lists */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting('- ')}
                  title="Lista"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting('1. ')}
                  title="Lista numerada"
                >
                  <ListOrdered className="w-4 h-4" />
                </Button>

                <div className="w-px h-6 bg-slate-300 mx-1" />

                {/* Icon picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" title="Icones">
                      <Smile className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2">
                    <div className="grid grid-cols-5 gap-1">
                      {quickIcons.map((item) => (
                        <Button
                          key={item.label}
                          variant="ghost"
                          size="sm"
                          className="text-lg p-1 h-8 w-8"
                          onClick={() => {
                            insertAtCursor(item.icon + ' ');
                          }}
                          title={item.label}
                        >
                          {item.icon}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <div className="w-px h-6 bg-slate-300 mx-1" />

                {/* Callouts */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertCallout('dica')}
                  title="Dica"
                  className="text-green-600"
                >
                  <Lightbulb className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertCallout('aviso')}
                  title="Aviso"
                  className="text-yellow-600"
                >
                  <AlertTriangle className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertCallout('importante')}
                  title="Importante"
                  className="text-red-600"
                >
                  <AlertCircle className="w-4 h-4" />
                </Button>

                <div className="w-px h-6 bg-slate-300 mx-1" />

                {/* Link */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting('[texto](', ')')}
                  title="Link"
                >
                  <Link className="w-4 h-4" />
                </Button>

                {/* Code inline */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting('`', '`')}
                  title="Código"
                  className="font-mono text-xs"
                >
                  {'</>'}
                </Button>

                {/* Horizontal line */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertAtCursor('\n---\n')}
                  title="Linha horizontal"
                >
                  <span className="w-4 h-4 flex items-center justify-center">—</span>
                </Button>

                {/* Table template */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertAtCursor('\n| Coluna 1 | Coluna 2 | Coluna 3 |\n|----------|----------|----------|\n| Dado 1   | Dado 2   | Dado 3   |\n')}
                  title="Tabela"
                  className="font-mono text-xs"
                >
                  ⊞
                </Button>
              </div>

              {/* Textarea */}
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Use # para titulos, ## para subtitulos, - para listas..."
                className="min-h-[400px] font-mono text-sm"
              />
            </TabsContent>

            <TabsContent value="visualizar">
              <div className="min-h-[400px] p-4 border rounded-lg bg-white prose prose-sm max-w-none">
                {content ? renderPreview(content) : (
                  <p className="text-slate-400">Nenhum conteudo para visualizar</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Media Section */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Image className="w-4 h-4" />
            Midia
          </h3>

          {/* Video URL */}
          <div>
            <Label className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Video do YouTube (opcional)
            </Label>
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="mt-1"
            />
          </div>

          {/* Images */}
          <div>
            <Label className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Imagens
            </Label>
            <div className="flex gap-2 mt-2">
              <label className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                  <Upload className="w-5 h-5 text-slate-500" />
                  <span className="text-sm text-slate-600">Fazer Upload de Imagens</span>
                </div>
              </label>
            </div>
            <div className="flex gap-2 mt-2">
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Link className="w-3 h-3" />
                Ou cole URL:
              </div>
              <Input
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
                className="flex-1 h-8 text-sm"
              />
              <Button type="button" variant="outline" size="sm" onClick={addImageUrl}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {images.map((img, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={img}
                      alt={`Preview ${i + 1}`}
                      className="w-full h-24 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Checklist Section */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <CheckSquare className="w-4 h-4" />
            Checklist
          </h3>
          <div className="flex gap-2">
            <Input
              value={newChecklistItem}
              onChange={(e) => setNewChecklistItem(e.target.value)}
              placeholder="Adicionar item ao checklist..."
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
            />
            <Button type="button" variant="outline" onClick={addChecklistItem}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {checklist.length > 0 && (
            <div className="space-y-1">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2 bg-slate-50 rounded"
                >
                  <Checkbox checked={item.checked} disabled />
                  <span className="flex-1 text-sm">{item.text}</span>
                  <button
                    type="button"
                    onClick={() => removeChecklistItem(item.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
