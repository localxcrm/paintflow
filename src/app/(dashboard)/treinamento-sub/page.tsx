'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  BookOpen,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  GraduationCap,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

interface TrainingCourse {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  order: number;
  isPublished: boolean;
  courseType: 'training' | 'sop';
  moduleCount: number;
  createdAt: string;
  updatedAt: string;
}

// Cursos pre-definidos para importacao
const defaultCourses = [
  {
    title: 'Wolf Academy - Cabinet Refinishing',
    description: 'Curso completo de refinishing de cabinets com 16 modulos. Aprenda tecnicas profissionais de preparacao, pintura e acabamento.',
    coverImage: '/training-images/covers/wolf-academy.png',
    isPublished: true,
    courseType: 'training',
    targetAudience: 'subcontractor',
  },
  {
    title: 'US PRO Book - Manual do Pintor',
    description: 'Manual completo do pintor profissional. Tecnicas, ferramentas e boas praticas para trabalhos de pintura.',
    coverImage: '/training-images/covers/us-pro-book.png',
    isPublished: true,
    courseType: 'training',
    targetAudience: 'subcontractor',
  },
];

function TreinamentoSubContent() {
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteCourseId, setDeleteCourseId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'training' | 'sop'>('training');

  // Set initial tab from URL params
  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'sop') {
      setActiveTab('sop');
    } else if (type === 'training') {
      setActiveTab('training');
    }
  }, [searchParams]);

  useEffect(() => {
    loadCourses();
  }, [activeTab]);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/sub-training/courses?type=${activeTab}`);
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Erro ao carregar cursos');
    } finally {
      setIsLoading(false);
    }
  };

  const importDefaultCourses = async () => {
    setIsImporting(true);
    try {
      for (const course of defaultCourses) {
        const res = await fetch('/api/sub-training/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(course),
        });
        if (!res.ok) {
          throw new Error('Failed to create course');
        }
      }
      toast.success('Cursos importados com sucesso!');
      loadCourses();
    } catch (error) {
      console.error('Error importing courses:', error);
      toast.error('Erro ao importar cursos');
    } finally {
      setIsImporting(false);
    }
  };

  const togglePublished = async (course: TrainingCourse) => {
    try {
      const res = await fetch('/api/sub-training/courses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: course.id,
          isPublished: !course.isPublished,
        }),
      });

      if (res.ok) {
        setCourses((prev) =>
          prev.map((c) =>
            c.id === course.id ? { ...c, isPublished: !c.isPublished } : c
          )
        );
        toast.success(
          course.isPublished
            ? 'Curso despublicado'
            : 'Curso publicado para subcontratados!'
        );
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      console.error('Error toggling published:', error);
      toast.error('Erro ao atualizar curso');
    }
  };

  const deleteCourse = async () => {
    if (!deleteCourseId) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/sub-training/courses?id=${deleteCourseId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setCourses((prev) => prev.filter((c) => c.id !== deleteCourseId));
        toast.success('Curso excluido');
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Erro ao excluir curso');
    } finally {
      setIsDeleting(false);
      setDeleteCourseId(null);
    }
  };

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
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            {activeTab === 'training' ? (
              <GraduationCap className="h-7 w-7 text-blue-600" />
            ) : (
              <FileText className="h-7 w-7 text-emerald-600" />
            )}
            {activeTab === 'training' ? 'Cursos de Treinamento' : 'SOPs - Procedimentos'}
          </h1>
          <p className="text-slate-500 mt-1">
            {activeTab === 'training'
              ? 'Gerencie cursos de treinamento para seus subcontratados'
              : 'Gerencie SOPs e procedimentos do negocio'}
          </p>
        </div>
        <div className="flex gap-2">
          {courses.length === 0 && activeTab === 'training' && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={importDefaultCourses}
              disabled={isImporting}
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Importar Cursos
            </Button>
          )}
          <Link href={`/treinamento-sub/curso/novo?type=${activeTab}`}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {activeTab === 'training' ? 'Novo Curso' : 'Novo SOP'}
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'training' | 'sop')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="training" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Treinamentos
          </TabsTrigger>
          <TabsTrigger value="sop" className="gap-2">
            <FileText className="h-4 w-4" />
            SOPs
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-slate-900">{courses.length}</div>
            <p className="text-sm text-slate-500">Total de Cursos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">
              {courses.filter((c) => c.isPublished).length}
            </div>
            <p className="text-sm text-slate-500">Publicados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">
              {courses.reduce((acc, c) => acc + (c.moduleCount || 0), 0)}
            </div>
            <p className="text-sm text-slate-500">Total de Modulos</p>
          </CardContent>
        </Card>
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">{activeTab === 'training' ? '📚' : '📋'}</div>
            <h3 className="text-lg font-medium text-slate-700 mb-2">
              {activeTab === 'training' ? 'Nenhum curso cadastrado' : 'Nenhum SOP cadastrado'}
            </h3>
            <p className="text-slate-500 mb-4">
              {activeTab === 'training'
                ? 'Importe os cursos padrao ou crie um novo curso'
                : 'Crie seu primeiro SOP para documentar procedimentos'}
            </p>
            {activeTab === 'training' ? (
              <Button onClick={importDefaultCourses} disabled={isImporting} className="gap-2">
                {isImporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Importar Cursos Padrao
              </Button>
            ) : (
              <Link href="/treinamento-sub/curso/novo?type=sop">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Primeiro SOP
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {courses.map((course) => (
            <Card
              key={course.id}
              className={`group overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer ${
                !course.isPublished ? 'opacity-60' : ''
              }`}
            >
              <Link href={`/treinamento-sub/curso/${course.id}`}>
                <div className="relative aspect-[3/4] bg-slate-100">
                  {course.coverImage ? (
                    <Image
                      src={course.coverImage}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <BookOpen className="h-16 w-16 text-slate-300" />
                    </div>
                  )}
                  {/* Module count badge */}
                  <Badge className="absolute top-2 right-2 bg-black/70 text-white">
                    {course.moduleCount || 0} modulos
                  </Badge>
                  {/* Published status */}
                  {!course.isPublished && (
                    <Badge className="absolute top-2 left-2 bg-amber-500 text-white">
                      Rascunho
                    </Badge>
                  )}
                </div>
              </Link>
              <CardContent className="p-3">
                <h3 className="font-medium text-slate-900 truncate text-sm">
                  {course.title}
                </h3>
                {course.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {course.description}
                  </p>
                )}
                {/* Actions */}
                <div className="flex items-center gap-1 mt-2 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      togglePublished(course);
                    }}
                    className={`h-7 px-2 text-xs ${
                      course.isPublished
                        ? 'text-amber-600 hover:text-amber-700'
                        : 'text-green-600 hover:text-green-700'
                    }`}
                  >
                    {course.isPublished ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </Button>
                  <Link href={`/treinamento-sub/curso/${course.id}/editar`}>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-blue-600">
                      <Edit className="h-3 w-3" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      setDeleteCourseId(course.id);
                    }}
                    className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteCourseId} onOpenChange={() => setDeleteCourseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir curso?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao nao pode ser desfeita. O curso e todos os seus modulos serao permanentemente excluidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteCourse}
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

export default function TreinamentoSubPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <TreinamentoSubContent />
    </Suspense>
  );
}
