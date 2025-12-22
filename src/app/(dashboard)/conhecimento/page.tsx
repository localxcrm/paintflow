'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Plus,
  Search,
  BookOpen,
  Users,
  Wrench,
  FileText,
  Megaphone,
  ChevronRight,
  Edit,
  Trash2,
  Image,
  Video,
  CheckSquare,
  Bold,
  List,
  ListOrdered,
  Save,
  X,
  Upload,
  Link,
} from 'lucide-react';
import { toast } from 'sonner';

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

const categories = [
  { id: 'vendas', label: 'Vendas', icon: Users, color: 'bg-blue-50 text-blue-600' },
  { id: 'producao', label: 'Produção', icon: Wrench, color: 'bg-green-50 text-green-600' },
  { id: 'admin', label: 'Administrativo', icon: FileText, color: 'bg-purple-50 text-purple-600' },
  { id: 'marketing', label: 'Marketing', icon: Megaphone, color: 'bg-yellow-50 text-yellow-600' },
];

// Sample articles for demo
const sampleArticles: Article[] = [
  {
    id: '1',
    title: 'Como Atender o Telefone',
    category: 'vendas',
    content: `# Como Atender o Telefone

## Passo 1: Atenda em até 3 toques
- Sempre atenda com um sorriso (isso transparece na voz)
- Seja profissional e amigável

## Passo 2: Saudação Padrão
"Bom dia/tarde! [Nome da Empresa], [Seu Nome] falando. Como posso ajudá-lo?"

## Passo 3: Colete as Informações
- Nome completo do cliente
- Telefone de contato
- Endereço do serviço
- Tipo de serviço desejado
- Melhor horário para visita

## Passo 4: Agende a Visita
- Ofereça 2-3 opções de horário
- Confirme o endereço
- Envie confirmação por WhatsApp

## Dicas Importantes
- Nunca diga "não sei" - diga "vou verificar e retorno"
- Sempre anote todas as informações
- Agradeça pela ligação`,
    checklist: [
      { id: '1', text: 'Atender em até 3 toques', checked: false },
      { id: '2', text: 'Usar saudação padrão', checked: false },
      { id: '3', text: 'Coletar nome completo', checked: false },
      { id: '4', text: 'Coletar telefone', checked: false },
      { id: '5', text: 'Coletar endereço', checked: false },
      { id: '6', text: 'Agendar visita', checked: false },
      { id: '7', text: 'Enviar confirmação WhatsApp', checked: false },
    ],
    images: [],
    videoUrl: '',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
  },
  {
    id: '2',
    title: 'Processo de Orçamento',
    category: 'vendas',
    content: `# Processo de Orçamento

## Antes da Visita
1. Revise as informações do cliente
2. Prepare o material de apresentação
3. Chegue 5 minutos antes

## Durante a Visita
1. Apresente-se profissionalmente
2. Faça um tour completo da área
3. Tire fotos de todos os ambientes
4. Pergunte sobre preferências de cores
5. Identifique problemas (mofo, descascando, etc.)

## Cálculo do Orçamento
- Use a tabela de preços padrão
- Considere complexidade do trabalho
- Inclua margem de 30% mínima

## Apresentação
- Envie em até 24 horas
- Use o modelo padrão
- Destaque os diferenciais`,
    checklist: [
      { id: '1', text: 'Revisar informações do cliente', checked: false },
      { id: '2', text: 'Preparar material', checked: false },
      { id: '3', text: 'Tirar fotos', checked: false },
      { id: '4', text: 'Identificar problemas', checked: false },
      { id: '5', text: 'Calcular orçamento', checked: false },
      { id: '6', text: 'Enviar em 24h', checked: false },
    ],
    images: [],
    videoUrl: '',
    createdAt: '2024-01-16',
    updatedAt: '2024-01-16',
  },
  {
    id: '3',
    title: 'Checklist de Qualidade',
    category: 'producao',
    content: `# Checklist de Qualidade

## Antes de Começar
- Área protegida com lona
- Móveis cobertos
- Fitas de proteção aplicadas
- Superfícies limpas

## Durante o Trabalho
- Aplicação uniforme
- Sem escorridos
- Demãos corretas aplicadas
- Tempo de secagem respeitado

## Finalização
- Limpeza completa do local
- Retoques finais feitos
- Fitas removidas cuidadosamente
- Fotos do resultado final

## Entrega
- Cliente acompanha a inspeção
- Lista de pendências (se houver)
- Assinatura de aprovação`,
    checklist: [
      { id: '1', text: 'Área protegida com lona', checked: false },
      { id: '2', text: 'Móveis cobertos', checked: false },
      { id: '3', text: 'Fitas de proteção aplicadas', checked: false },
      { id: '4', text: 'Aplicação uniforme', checked: false },
      { id: '5', text: 'Sem escorridos', checked: false },
      { id: '6', text: 'Limpeza completa', checked: false },
      { id: '7', text: 'Fotos do resultado', checked: false },
      { id: '8', text: 'Assinatura de aprovação', checked: false },
    ],
    images: [],
    videoUrl: '',
    createdAt: '2024-01-17',
    updatedAt: '2024-01-17',
  },
];

const emptyArticle: Omit<Article, 'id' | 'createdAt' | 'updatedAt'> = {
  title: '',
  category: '',
  content: '',
  checklist: [],
  images: [],
  videoUrl: '',
};

export default function ConhecimentoPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [formData, setFormData] = useState(emptyArticle);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('paintpro_knowledge');
    if (saved) {
      try {
        setArticles(JSON.parse(saved));
      } catch (e) {
        setArticles(sampleArticles);
      }
    } else {
      setArticles(sampleArticles);
    }
  }, []);

  // Save to localStorage
  const saveArticles = (newArticles: Article[]) => {
    localStorage.setItem('paintpro_knowledge', JSON.stringify(newArticles));
    setArticles(newArticles);
  };

  // Filter articles
  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const openEditor = (article?: Article) => {
    if (article) {
      setEditingArticle(article);
      setFormData({
        title: article.title,
        category: article.category,
        content: article.content,
        checklist: [...article.checklist],
        images: [...article.images],
        videoUrl: article.videoUrl,
      });
    } else {
      setEditingArticle(null);
      setFormData(emptyArticle);
    }
    setIsEditorOpen(true);
  };

  const handleSave = () => {
    if (!formData.title || !formData.category) {
      toast.error('Preencha título e categoria');
      return;
    }

    const now = new Date().toISOString();

    if (editingArticle) {
      // Update existing
      const updated = articles.map((a) =>
        a.id === editingArticle.id
          ? { ...a, ...formData, updatedAt: now }
          : a
      );
      saveArticles(updated);
      setSelectedArticle({ ...editingArticle, ...formData, updatedAt: now });
      toast.success('SOP atualizado!');
    } else {
      // Create new
      const newArticle: Article = {
        id: Date.now().toString(),
        ...formData,
        createdAt: now,
        updatedAt: now,
      };
      saveArticles([...articles, newArticle]);
      setSelectedArticle(newArticle);
      toast.success('SOP criado!');
    }

    setIsEditorOpen(false);
    setEditingArticle(null);
    setFormData(emptyArticle);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este SOP?')) {
      saveArticles(articles.filter((a) => a.id !== id));
      setSelectedArticle(null);
      toast.success('SOP excluído');
    }
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    setFormData({
      ...formData,
      checklist: [
        ...formData.checklist,
        { id: Date.now().toString(), text: newChecklistItem, checked: false },
      ],
    });
    setNewChecklistItem('');
  };

  const removeChecklistItem = (id: string) => {
    setFormData({
      ...formData,
      checklist: formData.checklist.filter((item) => item.id !== id),
    });
  };

  const addImage = () => {
    if (!newImageUrl.trim()) return;
    setFormData({
      ...formData,
      images: [...formData.images, newImageUrl],
    });
    setNewImageUrl('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione apenas arquivos de imagem');
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Imagem muito grande. Máximo 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, base64],
        }));
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const toggleChecklistItem = (articleId: string, itemId: string) => {
    const updated = articles.map((a) => {
      if (a.id === articleId) {
        return {
          ...a,
          checklist: a.checklist.map((item) =>
            item.id === itemId ? { ...item, checked: !item.checked } : item
          ),
        };
      }
      return a;
    });
    saveArticles(updated);
    if (selectedArticle?.id === articleId) {
      const updatedArticle = updated.find((a) => a.id === articleId);
      if (updatedArticle) setSelectedArticle(updatedArticle);
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId) || categories[0];
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const insertFormatting = (prefix: string, suffix = '') => {
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.content;
    const selectedText = text.substring(start, end);

    const newText =
      text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);

    setFormData({ ...formData, content: newText });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Base de Conhecimento</h1>
          <p className="text-slate-500">SOPs e procedimentos do negócio</p>
        </div>
        <Button onClick={() => openEditor()}>
          <Plus className="w-4 h-4 mr-2" />
          Novo SOP
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar SOPs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Articles List */}
        <div className="lg:col-span-1 space-y-4">
          {/* Category Stats */}
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => {
              const count = articles.filter((a) => a.category === cat.id).length;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id === selectedCategory ? 'all' : cat.id)}
                  className={`p-3 rounded-lg border transition-colors ${
                    selectedCategory === cat.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded ${cat.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">{cat.label}</p>
                      <p className="text-xs text-slate-500">{count} SOPs</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Articles List */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium text-slate-500">
                {filteredArticles.length} SOPs encontrados
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y max-h-[500px] overflow-y-auto">
                {filteredArticles.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">
                    Nenhum SOP encontrado.
                  </div>
                ) : (
                  filteredArticles.map((article) => {
                    const cat = getCategoryInfo(article.category);
                    const Icon = cat.icon;
                    return (
                      <button
                        key={article.id}
                        onClick={() => setSelectedArticle(article)}
                        className={`w-full p-3 text-left hover:bg-slate-50 transition-colors ${
                          selectedArticle?.id === article.id ? 'bg-slate-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded ${cat.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {article.title}
                            </p>
                            <p className="text-xs text-slate-500">{cat.label}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Article Content */}
        <div className="lg:col-span-2">
          {selectedArticle ? (
            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle>{selectedArticle.title}</CardTitle>
                  <p className="text-sm text-slate-500 mt-1">
                    Atualizado em{' '}
                    {new Date(selectedArticle.updatedAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditor(selectedArticle)}>
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(selectedArticle.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Video */}
                {selectedArticle.videoUrl && getYouTubeEmbedUrl(selectedArticle.videoUrl) && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-slate-100">
                    <iframe
                      src={getYouTubeEmbedUrl(selectedArticle.videoUrl)!}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                )}

                {/* Images */}
                {selectedArticle.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedArticle.images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`Imagem ${i + 1}`}
                        className="rounded-lg w-full h-48 object-cover"
                      />
                    ))}
                  </div>
                )}

                {/* Content */}
                <div className="prose prose-sm max-w-none">
                  {selectedArticle.content.split('\n').map((line, i) => {
                    if (line.startsWith('# ')) {
                      return (
                        <h1 key={i} className="text-xl font-bold mt-4 mb-2">
                          {line.replace('# ', '')}
                        </h1>
                      );
                    }
                    if (line.startsWith('## ')) {
                      return (
                        <h2 key={i} className="text-lg font-semibold mt-4 mb-2">
                          {line.replace('## ', '')}
                        </h2>
                      );
                    }
                    if (line.startsWith('### ')) {
                      return (
                        <h3 key={i} className="text-base font-semibold mt-3 mb-1">
                          {line.replace('### ', '')}
                        </h3>
                      );
                    }
                    if (line.startsWith('- ')) {
                      return (
                        <li key={i} className="ml-4">
                          {line.replace('- ', '')}
                        </li>
                      );
                    }
                    if (line.match(/^\d+\. /)) {
                      return (
                        <li key={i} className="ml-4 list-decimal">
                          {line.replace(/^\d+\. /, '')}
                        </li>
                      );
                    }
                    if (line.trim() === '') {
                      return <br key={i} />;
                    }
                    return <p key={i}>{line}</p>;
                  })}
                </div>

                {/* Checklist */}
                {selectedArticle.checklist.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckSquare className="w-5 h-5 text-green-600" />
                      Checklist
                    </h3>
                    <div className="space-y-2">
                      {selectedArticle.checklist.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-2 rounded hover:bg-slate-50 cursor-pointer"
                          onClick={() => toggleChecklistItem(selectedArticle.id, item.id)}
                        >
                          <Checkbox checked={item.checked} />
                          <span
                            className={
                              item.checked ? 'line-through text-slate-500' : ''
                            }
                          >
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600">
                  Selecione um SOP
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Clique em um item da lista para visualizar
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-[90vw] w-[90vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingArticle ? 'Editar SOP' : 'Criar Novo SOP'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Como fazer orçamento"
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
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

            {/* Video URL */}
            <div>
              <Label className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                Vídeo do YouTube (opcional)
              </Label>
              <Input
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>

            {/* Images */}
            <div>
              <Label className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                Imagens
              </Label>
              <div className="flex gap-2 mt-2">
                {/* File Upload Button */}
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                    <Upload className="w-5 h-5 text-slate-500" />
                    <span className="text-sm text-slate-600">Fazer Upload de Imagens</span>
                  </div>
                </label>
              </div>
              {/* URL Alternative */}
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
                <Button type="button" variant="outline" size="sm" onClick={addImage}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {formData.images.map((img, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={img}
                        alt={`Preview ${i + 1}`}
                        className="w-full h-20 object-cover rounded"
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

            {/* Content Editor */}
            <div>
              <Label>Conteúdo</Label>
              <div className="flex gap-1 mb-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting('# ')}
                  title="Título"
                >
                  H1
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting('## ')}
                  title="Subtítulo"
                >
                  H2
                </Button>
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
                  title="Lista Numerada"
                >
                  <ListOrdered className="w-4 h-4" />
                </Button>
              </div>
              <Textarea
                id="content-editor"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Use # para títulos, ## para subtítulos, - para listas..."
                rows={12}
                className="font-mono text-sm"
              />
            </div>

            {/* Checklist */}
            <div>
              <Label className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                Checklist
              </Label>
              <div className="flex gap-2 mt-1">
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
              {formData.checklist.length > 0 && (
                <div className="space-y-1 mt-2">
                  {formData.checklist.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 p-2 bg-slate-50 rounded"
                    >
                      <CheckSquare className="w-4 h-4 text-slate-400" />
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
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsEditorOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
