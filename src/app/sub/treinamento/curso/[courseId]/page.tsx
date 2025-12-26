'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Loader2,
  BookOpen,
  ChevronRight,
  Wrench,
  Shield,
  CheckCircle,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TrainingModule {
  id: string;
  title: string;
  category: string;
  order: number;
}

interface TrainingCourse {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
}

interface PageProps {
  params: Promise<{ courseId: string }>;
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

export default function SubCursoModulosPage({ params }: PageProps) {
  const { courseId } = use(params);
  const router = useRouter();
  const [course, setCourse] = useState<TrainingCourse | null>(null);
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCourseAndModules();
  }, [courseId]);

  const loadCourseAndModules = async () => {
    try {
      // Load course info and modules in parallel
      const [coursesRes, modulesRes] = await Promise.all([
        fetch('/api/sub/training/courses'),
        fetch(`/api/sub/training?courseId=${courseId}`),
      ]);

      if (coursesRes.ok) {
        const data = await coursesRes.json();
        const foundCourse = data.courses?.find((c: TrainingCourse) => c.id === courseId);
        setCourse(foundCourse || null);
      }

      if (modulesRes.ok) {
        const data = await modulesRes.json();
        setModules(data.modules || []);
      }
    } catch (error) {
      console.error('Error loading course:', error);
      toast.error('Erro ao carregar curso');
    } finally {
      setIsLoading(false);
    }
  };

  // Group modules by category
  const groupedModules = modules.reduce((acc, module) => {
    const cat = module.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(module);
    return acc;
  }, {} as Record<string, TrainingModule[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-3 text-slate-500">Carregando modulos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10 safe-area-top">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/sub/treinamento')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {course?.coverImage && (
            <div className="relative w-10 h-14 rounded overflow-hidden shrink-0">
              <Image
                src={course.coverImage}
                alt={course.title || 'Curso'}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-slate-900 truncate">
              {course?.title || 'Curso'}
            </h1>
            <p className="text-sm text-slate-500">
              {modules.length} {modules.length === 1 ? 'modulo' : 'modulos'}
            </p>
          </div>
        </div>
      </header>

      {/* Module List */}
      <div className="p-4 space-y-6">
        {modules.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-6xl mb-4">📖</div>
              <p className="text-slate-500 text-lg">Nenhum modulo disponivel</p>
              <p className="text-slate-400 text-sm mt-1">
                Os modulos aparecerao aqui quando forem publicados
              </p>
            </CardContent>
          </Card>
        ) : Object.keys(groupedModules).length > 1 ? (
          // Grouped view when multiple categories
          Object.entries(groupedModules).map(([category, categoryModules]) => {
            const Icon = categoryIcons[category] || BookOpen;
            const colorClass = categoryColors[category] || 'bg-slate-100 text-slate-600';
            const catLabel = categoryLabels[category] || category;

            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn('p-1.5 rounded-lg', colorClass)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <h2 className="font-semibold text-slate-700">{catLabel}</h2>
                  <span className="text-sm text-slate-400">
                    ({categoryModules.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {categoryModules.map((module, index) => (
                    <Card
                      key={module.id}
                      className="cursor-pointer active:scale-[0.98] transition-transform"
                      onClick={() => router.push(`/sub/treinamento/${module.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 font-bold text-sm">
                            {index + 1}
                          </div>
                          <span className="flex-1 font-medium text-slate-800">
                            {module.title}
                          </span>
                          <ChevronRight className="h-5 w-5 text-slate-300" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          // Flat list when single category or no category distinction needed
          <div className="space-y-2">
            {modules.map((module, index) => (
              <Card
                key={module.id}
                className="cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => router.push(`/sub/treinamento/${module.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <span className="flex-1 font-medium text-slate-800">
                      {module.title}
                    </span>
                    <ChevronRight className="h-5 w-5 text-slate-300" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
