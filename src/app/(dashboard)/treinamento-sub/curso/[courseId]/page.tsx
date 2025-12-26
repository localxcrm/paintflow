'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Plus,
  Search,
  BookOpen,
  Wrench,
  Shield,
  CheckCircle,
  Users,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  Loader2,
  Sparkles,
} from 'lucide-react';
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
  isPublished: boolean;
  courseId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TrainingCourse {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  moduleCount: number;
}

interface PageProps {
  params: Promise<{ courseId: string }>;
}

const categories = [
  { id: 'producao', label: 'Producao', icon: Wrench, color: 'bg-green-50 text-green-600 border-green-200' },
  { id: 'seguranca', label: 'Seguranca', icon: Shield, color: 'bg-orange-50 text-orange-600 border-orange-200' },
  { id: 'qualidade', label: 'Qualidade', icon: CheckCircle, color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { id: 'atendimento', label: 'Atendimento', icon: Users, color: 'bg-purple-50 text-purple-600 border-purple-200' },
];

// Wolf Academy Modules (pre-defined)
const wolfAcademyModules = [
  { title: 'Modulo 1: Introducao ao Cabinet Refinishing', category: 'producao', images: ['/training-images/module-01/page1_img2.png'] },
  { title: 'Modulo 2: Cronograma e Planejamento', category: 'producao', images: ['/training-images/module-02/page4_img1.png'] },
  { title: 'Modulo 3: Processos On-Site (20 Steps)', category: 'producao', images: ['/training-images/module-03/page6_img4.png'] },
  { title: 'Modulo 4: Processos no Shop (19 Steps)', category: 'producao', images: ['/training-images/module-04/page7_img1.png'] },
  { title: 'Modulo 5: Produtos de Protecao e Masking', category: 'producao', images: ['/training-images/module-05/page9_img1.png'] },
  { title: 'Modulo 6: Produtos de Limpeza', category: 'producao', images: ['/training-images/module-06/page11_img2.png'] },
  { title: 'Modulo 7: Fillers e Reparos', category: 'producao', images: ['/training-images/module-07/page13_img5.png'] },
  { title: 'Modulo 8: Ventilacao e Filtros', category: 'seguranca', images: ['/training-images/module-08/page15_img5.png'] },
  { title: 'Modulo 9: Tintas e Primers', category: 'producao', images: ['/training-images/module-09/page17_img4.png'] },
  { title: 'Modulo 10: Tipos de Spray', category: 'producao', images: ['/training-images/module-10/page19_img2.png'] },
  { title: 'Modulo 11: Otimizacao da Airless', category: 'producao', images: ['/training-images/module-11/page21_img1.png'] },
  { title: 'Modulo 12: Erros Comuns e Solucoes', category: 'qualidade', images: ['/training-images/module-12/page23_img1.png'] },
  { title: 'Modulo 13: Grain Filler para Oak Cabinets', category: 'producao', images: ['/training-images/module-13/page25_img1.png'] },
  { title: 'Modulo 14: Refacing - Portas HDF', category: 'producao', images: ['/training-images/module-14/page27_img1.png'] },
  { title: 'Modulo 15: Servicos Extras (Add-Ons)', category: 'atendimento', images: ['/training-images/module-15/page29_img2.png'] },
  { title: 'Modulo 16: Precificacao', category: 'atendimento', images: ['/training-images/module-16/page33_img1.png'] },
];

// US PRO Book Modules (pre-defined)
const usProBookModules = [
  { title: '1. Abrindo Sua Empresa de Pintura', category: 'atendimento', images: ['/training-images/us-pro-book/page04.png'] },
  { title: '2. Primeira Impressao com o Cliente', category: 'atendimento', images: ['/training-images/us-pro-book/page06.png'] },
  { title: '3. Como se Diferenciar da Concorrencia', category: 'atendimento', images: ['/training-images/us-pro-book/page07.png'] },
  { title: '4. Cliente como Divulgador', category: 'atendimento', images: ['/training-images/us-pro-book/page10_img1.png'] },
  { title: '5. Marketing a Seu Favor', category: 'atendimento', images: ['/training-images/us-pro-book/page11_img1.png'] },
  { title: '6. Servicos Integrados', category: 'producao', images: ['/training-images/us-pro-book/page13.png'] },
  { title: '7. Carpintaria Light', category: 'producao', images: ['/training-images/us-pro-book/page13_img2.png'] },
  { title: '8. Power Wash: Uso e Manutencao', category: 'producao', images: ['/training-images/us-pro-book/page14.png'] },
  { title: '9. Soft Wash: Misturas Quimicas', category: 'producao', images: ['/training-images/us-pro-book/page18_img2.jpeg'] },
  { title: '10. Instalacao de Downspouts e Shutters', category: 'producao', images: ['/training-images/us-pro-book/page20.png'] },
  { title: '11. Maquinas de Spray', category: 'producao', images: ['/training-images/us-pro-book/page23.png'] },
  { title: '12. Prime e Preparacao', category: 'producao', images: ['/training-images/us-pro-book/page25.png'] },
  { title: '13. Tipos de Siding', category: 'producao', images: ['/training-images/us-pro-book/page30.png'] },
  { title: '14. Tipos de Stain', category: 'producao', images: ['/training-images/us-pro-book/page36.png'] },
  { title: '15. Pintura Comercial', category: 'producao', images: ['/training-images/us-pro-book/page42.png'] },
  { title: '16. Remocao de Papel de Parede', category: 'producao', images: ['/training-images/us-pro-book/page45.png'] },
  { title: '17. Plaster e Reparos', category: 'producao', images: ['/training-images/us-pro-book/page47.png'] },
  { title: '18. Fuligem e Manchas', category: 'producao', images: ['/training-images/us-pro-book/page49.png'] },
  { title: '19. Surfactant Leaching', category: 'qualidade', images: ['/training-images/us-pro-book/page51.png'] },
  { title: '20. Pintura de Banheiro e Cozinha', category: 'producao', images: ['/training-images/us-pro-book/page53.png'] },
];

export default function CourseModulesPage({ params }: PageProps) {
  const { courseId } = use(params);
  const router = useRouter();
  const [course, setCourse] = useState<TrainingCourse | null>(null);
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [deleteModuleId, setDeleteModuleId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    loadCourse();
    loadModules();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      const res = await fetch(`/api/sub-training/courses?id=${courseId}`);
      if (res.ok) {
        const data = await res.json();
        setCourse(data);
      }
    } catch (error) {
      console.error('Error loading course:', error);
    }
  };

  const loadModules = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/sub-training?courseId=${courseId}`);
      if (res.ok) {
        const data = await res.json();
        setModules(data.modules || []);
      }
    } catch (error) {
      console.error('Error loading modules:', error);
      toast.error('Erro ao carregar modulos');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePublished = async (module: TrainingModule) => {
    setIsToggling(module.id);
    try {
      const res = await fetch('/api/sub-training', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: module.id,
          isPublished: !module.isPublished,
        }),
      });

      if (res.ok) {
        setModules((prev) =>
          prev.map((m) =>
            m.id === module.id ? { ...m, isPublished: !m.isPublished } : m
          )
        );
        toast.success(
          module.isPublished
            ? 'Modulo despublicado'
            : 'Modulo publicado!'
        );
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      console.error('Error toggling published:', error);
      toast.error('Erro ao atualizar modulo');
    } finally {
      setIsToggling(null);
    }
  };

  const deleteModule = async () => {
    if (!deleteModuleId) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/sub-training?id=${deleteModuleId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setModules((prev) => prev.filter((m) => m.id !== deleteModuleId));
        toast.success('Modulo excluido');
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting module:', error);
      toast.error('Erro ao excluir modulo');
    } finally {
      setIsDeleting(false);
      setDeleteModuleId(null);
    }
  };

  const importModules = async (moduleList: typeof wolfAcademyModules, courseName: string) => {
    if (modules.length > 0) {
      if (!confirm(`Ja existem modulos. Deseja adicionar os modulos de ${courseName}?`)) {
        return;
      }
    }

    setIsImporting(true);
    try {
      for (let i = 0; i < moduleList.length; i++) {
        const mod = moduleList[i];
        await fetch('/api/sub-training', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: mod.title,
            category: mod.category,
            content: `# ${mod.title}\n\nConteudo do modulo...`,
            checklist: [],
            images: mod.images,
            videoUrl: '',
            courseId: courseId,
            isPublished: true,
          }),
        });
      }
      toast.success(`${moduleList.length} modulos importados!`);
      loadModules();
    } catch (error) {
      console.error('Error importing modules:', error);
      toast.error('Erro ao importar modulos');
    } finally {
      setIsImporting(false);
    }
  };

  // Helper to detect course type
  const isWolfAcademyCourse = course?.title?.toLowerCase().includes('wolf');
  const isUsProBookCourse = course?.title?.toLowerCase().includes('us pro') ||
                            course?.title?.toLowerCase().includes('pintor') ||
                            course?.title?.toLowerCase().includes('uspro');

  const getCategoryInfo = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId) || categories[0];
  };

  // Filter modules
  const filteredModules = modules.filter((module) => {
    const matchesSearch =
      module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || module.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Stats
  const publishedCount = modules.filter((m) => m.isPublished).length;
  const draftCount = modules.filter((m) => !m.isPublished).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/treinamento-sub')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            {course?.coverImage && (
              <div className="relative w-12 h-16 rounded overflow-hidden">
                <Image
                  src={course.coverImage}
                  alt={course.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {course?.title || 'Curso'}
              </h1>
              <p className="text-sm text-slate-500">
                {modules.length} modulos
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {isWolfAcademyCourse && modules.length === 0 && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => importModules(wolfAcademyModules, 'Wolf Academy')}
              disabled={isImporting}
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Importar 16 Modulos
            </Button>
          )}
          {isUsProBookCourse && modules.length === 0 && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => importModules(usProBookModules, 'US PRO Book')}
              disabled={isImporting}
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Importar 20 Modulos
            </Button>
          )}
          <Link href={`/treinamento-sub/curso/${courseId}/modulo/novo`}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Modulo
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-slate-900">{modules.length}</div>
            <p className="text-sm text-slate-500">Total de Modulos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{publishedCount}</div>
            <p className="text-sm text-slate-500">Publicados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-600">{draftCount}</div>
            <p className="text-sm text-slate-500">Rascunhos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{categories.length}</div>
            <p className="text-sm text-slate-500">Categorias</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar modulos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Todas categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Modules List */}
      {filteredModules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-slate-700 mb-2">
              {modules.length === 0
                ? 'Nenhum modulo cadastrado'
                : 'Nenhum modulo encontrado'}
            </h3>
            <p className="text-slate-500 mb-4">
              {modules.length === 0
                ? 'Crie seu primeiro modulo ou importe os modulos padrao'
                : 'Tente ajustar os filtros de busca'}
            </p>
            {modules.length === 0 && (
              <Link href={`/treinamento-sub/curso/${courseId}/modulo/novo`}>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Primeiro Modulo
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredModules.map((module, index) => {
            const categoryInfo = getCategoryInfo(module.category);
            const CategoryIcon = categoryInfo.icon;

            return (
              <Card
                key={module.id}
                className={`transition-all ${
                  module.isPublished ? 'border-green-200' : 'border-slate-200'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Order indicator */}
                    <div className="flex flex-col items-center gap-1 text-slate-400">
                      <GripVertical className="h-5 w-5 cursor-grab" />
                      <span className="text-xs font-medium">{index + 1}</span>
                    </div>

                    {/* Thumbnail - only show if exists */}
                    {module.images?.[0] ? (
                      <div className="relative w-16 h-16 rounded overflow-hidden shrink-0">
                        <Image
                          src={module.images[0]}
                          alt={module.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded bg-slate-100 flex items-center justify-center shrink-0">
                        <BookOpen className="h-6 w-6 text-slate-300" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-slate-900 truncate">
                          {module.title}
                        </h3>
                        {module.isPublished ? (
                          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                            <Eye className="h-3 w-3 mr-1" />
                            Publicado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Rascunho
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <Badge variant="outline" className={categoryInfo.color}>
                          <CategoryIcon className="h-3 w-3 mr-1" />
                          {categoryInfo.label}
                        </Badge>
                        {module.checklist.length > 0 && (
                          <span>{module.checklist.length} itens no checklist</span>
                        )}
                        {module.images.length > 0 && (
                          <span>{module.images.length} imagens</span>
                        )}
                        {module.videoUrl && <span>Com video</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePublished(module)}
                        disabled={isToggling === module.id}
                        className={
                          module.isPublished
                            ? 'text-amber-600 hover:text-amber-700'
                            : 'text-green-600 hover:text-green-700'
                        }
                      >
                        {isToggling === module.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : module.isPublished ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-1" />
                            Despublicar
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            Publicar
                          </>
                        )}
                      </Button>
                      <Link href={`/treinamento-sub/curso/${courseId}/modulo/${module.id}/editar`}>
                        <Button variant="ghost" size="sm" className="text-blue-600">
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteModuleId(module.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteModuleId} onOpenChange={() => setDeleteModuleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir modulo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao nao pode ser desfeita. O modulo sera permanentemente excluido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteModule}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
