'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  CheckSquare,
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
  { id: 'producao', label: 'Producao', icon: Wrench, color: 'bg-green-50 text-green-600' },
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

## Passo 1: Atenda em ate 3 toques
- Sempre atenda com um sorriso (isso transparece na voz)
- Seja profissional e amigavel

## Passo 2: Saudacao Padrao
"Bom dia/tarde! [Nome da Empresa], [Seu Nome] falando. Como posso ajuda-lo?"

## Passo 3: Colete as Informacoes
- Nome completo do cliente
- Telefone de contato
- Endereco do servico
- Tipo de servico desejado
- Melhor horario para visita

:::dica
Nunca diga "nao sei" - diga "vou verificar e retorno"
:::

## Passo 4: Agende a Visita
- Ofereca 2-3 opcoes de horario
- Confirme o endereco
- Envie confirmacao por WhatsApp`,
    checklist: [
      { id: '1', text: 'Atender em ate 3 toques', checked: false },
      { id: '2', text: 'Usar saudacao padrao', checked: false },
      { id: '3', text: 'Coletar nome completo', checked: false },
      { id: '4', text: 'Coletar telefone', checked: false },
      { id: '5', text: 'Coletar endereco', checked: false },
      { id: '6', text: 'Agendar visita', checked: false },
      { id: '7', text: 'Enviar confirmacao WhatsApp', checked: false },
    ],
    images: [],
    videoUrl: '',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
  },
  {
    id: '2',
    title: 'Processo de Orcamento',
    category: 'vendas',
    content: `# Processo de Orcamento

## Antes da Visita
1. Revise as informacoes do cliente
2. Prepare o material de apresentacao
3. Chegue 5 minutos antes

:::importante
Sempre chegue no horario combinado!
:::

## Durante a Visita
1. Apresente-se profissionalmente
2. Faca um tour completo da area
3. Tire fotos de todos os ambientes
4. Pergunte sobre preferencias de cores
5. Identifique problemas (mofo, descascando, etc.)

## Calculo do Orcamento
- Use a tabela de precos padrao
- Considere complexidade do trabalho
- Inclua margem de 30% minima

:::aviso
Nunca de desconto maior que 10% sem aprovacao
:::`,
    checklist: [
      { id: '1', text: 'Revisar informacoes do cliente', checked: false },
      { id: '2', text: 'Preparar material', checked: false },
      { id: '3', text: 'Tirar fotos', checked: false },
      { id: '4', text: 'Identificar problemas', checked: false },
      { id: '5', text: 'Calcular orcamento', checked: false },
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

## Antes de Comecar
- Area protegida com lona
- Moveis cobertos
- Fitas de protecao aplicadas
- Superficies limpas

## Durante o Trabalho
- Aplicacao uniforme
- Sem escorridos
- Demaos corretas aplicadas
- Tempo de secagem respeitado

:::dica
Sempre tire fotos antes, durante e depois do trabalho
:::

## Finalizacao
- Limpeza completa do local
- Retoques finais feitos
- Fitas removidas cuidadosamente
- Fotos do resultado final`,
    checklist: [
      { id: '1', text: 'Area protegida com lona', checked: false },
      { id: '2', text: 'Moveis cobertos', checked: false },
      { id: '3', text: 'Fitas de protecao aplicadas', checked: false },
      { id: '4', text: 'Aplicacao uniforme', checked: false },
      { id: '5', text: 'Sem escorridos', checked: false },
      { id: '6', text: 'Limpeza completa', checked: false },
      { id: '7', text: 'Fotos do resultado', checked: false },
      { id: '8', text: 'Assinatura de aprovacao', checked: false },
    ],
    images: [],
    videoUrl: '',
    createdAt: '2024-01-17',
    updatedAt: '2024-01-17',
  },
];

export default function ConhecimentoPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('paintpro_knowledge');
    if (saved) {
      try {
        setArticles(JSON.parse(saved));
      } catch {
        setArticles(sampleArticles);
        localStorage.setItem('paintpro_knowledge', JSON.stringify(sampleArticles));
      }
    } else {
      setArticles(sampleArticles);
      localStorage.setItem('paintpro_knowledge', JSON.stringify(sampleArticles));
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

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este SOP?')) {
      saveArticles(articles.filter((a) => a.id !== id));
      setSelectedArticle(null);
      toast.success('SOP excluido');
    }
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

  // Render content with callouts support
  const renderContent = (text: string) => {
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
          <h1 key={i} className="text-xl font-bold mt-4 mb-2">
            {line.replace('# ', '')}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={i} className="text-lg font-semibold mt-4 mb-2">
            {line.replace('## ', '')}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={i} className="text-base font-semibold mt-3 mb-1">
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
      } else if (line.trim() === '') {
        elements.push(<br key={i} />);
      } else {
        // Handle bold and italic
        let processed = line;
        processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>');
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Base de Conhecimento</h1>
          <p className="text-slate-500">SOPs e procedimentos do negocio</p>
        </div>
        <Link href="/conhecimento/novo">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo SOP
          </Button>
        </Link>
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
                  <Link href={`/conhecimento/${selectedArticle.id}/editar`}>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                  </Link>
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
                  {renderContent(selectedArticle.content)}
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
    </div>
  );
}
