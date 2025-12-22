'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
} from 'lucide-react';
import { toast } from 'sonner';

interface Article {
  id: string;
  title: string;
  category: string;
  content: string;
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
    createdAt: '2024-01-16',
    updatedAt: '2024-01-16',
  },
  {
    id: '3',
    title: 'Checklist de Qualidade',
    category: 'producao',
    content: `# Checklist de Qualidade

## Antes de Começar
- [ ] Área protegida com lona
- [ ] Móveis cobertos
- [ ] Fitas de proteção aplicadas
- [ ] Superfícies limpas

## Durante o Trabalho
- [ ] Aplicação uniforme
- [ ] Sem escorridos
- [ ] Demãos corretas aplicadas
- [ ] Tempo de secagem respeitado

## Finalização
- [ ] Limpeza completa do local
- [ ] Retoques finais feitos
- [ ] Fitas removidas cuidadosamente
- [ ] Fotos do resultado final

## Entrega
- [ ] Cliente acompanha a inspeção
- [ ] Lista de pendências (se houver)
- [ ] Assinatura de aprovação`,
    createdAt: '2024-01-17',
    updatedAt: '2024-01-17',
  },
];

export default function ConhecimentoPage() {
  const [articles, setArticles] = useState<Article[]>(sampleArticles);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    content: '',
  });

  // Filter articles
  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group by category
  const articlesByCategory = filteredArticles.reduce((acc, article) => {
    if (!acc[article.category]) {
      acc[article.category] = [];
    }
    acc[article.category].push(article);
    return acc;
  }, {} as Record<string, Article[]>);

  const handleCreate = () => {
    if (!formData.title || !formData.category || !formData.content) {
      toast.error('Preencha todos os campos');
      return;
    }

    const newArticle: Article = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setArticles([...articles, newArticle]);
    setFormData({ title: '', category: '', content: '' });
    setIsCreateOpen(false);
    toast.success('SOP criado com sucesso!');
  };

  const handleDelete = (id: string) => {
    setArticles(articles.filter((a) => a.id !== id));
    setSelectedArticle(null);
    toast.success('SOP excluído');
  };

  const getCategoryInfo = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId) || categories[0];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Base de Conhecimento</h1>
          <p className="text-slate-500">SOPs e procedimentos do negócio</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo SOP
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo SOP</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
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
              <div>
                <Label>Conteúdo (Markdown)</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Use # para títulos, - para listas, etc."
                  rows={10}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate}>Salvar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
              <div className="divide-y">
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
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
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
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  {/* Simple markdown rendering */}
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
                    if (line.startsWith('- [ ] ')) {
                      return (
                        <div key={i} className="flex items-center gap-2 ml-4">
                          <input type="checkbox" disabled />
                          <span>{line.replace('- [ ] ', '')}</span>
                        </div>
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
