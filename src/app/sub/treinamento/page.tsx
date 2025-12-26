'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  BookOpen,
  RefreshCw,
  GraduationCap,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TrainingCourse {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  moduleCount: number;
}

export default function SubTreinamentoPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'training' | 'sop'>('training');

  useEffect(() => {
    loadCourses();
  }, [activeTab]);

  const loadCourses = async (showToast = false) => {
    try {
      if (showToast) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const res = await fetch(`/api/sub/training/courses?type=${activeTab}`);
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }

      if (showToast) {
        toast.success('Atualizado!');
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Erro ao carregar cursos');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-3 text-slate-500">Carregando cursos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10 safe-area-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-xl",
              activeTab === 'training' ? "bg-emerald-100" : "bg-blue-100"
            )}>
              {activeTab === 'training' ? (
                <GraduationCap className="h-6 w-6 text-emerald-600" />
              ) : (
                <FileText className="h-6 w-6 text-blue-600" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {activeTab === 'training' ? 'Treinamento' : 'SOPs'}
              </h1>
              <p className="text-sm text-slate-500">
                {courses.length} {courses.length === 1 ? (activeTab === 'training' ? 'curso' : 'SOP') : (activeTab === 'training' ? 'cursos' : 'SOPs')} disponiveis
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => loadCourses(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-5 w-5 text-slate-500", isRefreshing && "animate-spin")} />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'training' | 'sop')} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
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
      </header>

      {/* Course Grid */}
      <div className="p-4">
        {courses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-6xl mb-4">{activeTab === 'training' ? '📚' : '📋'}</div>
              <p className="text-slate-500 text-lg">
                {activeTab === 'training' ? 'Nenhum curso disponivel' : 'Nenhum SOP disponivel'}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                {activeTab === 'training'
                  ? 'Os cursos aparecerao aqui quando forem publicados'
                  : 'Os SOPs aparecerao aqui quando forem publicados'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {courses.map((course) => (
              <Card
                key={course.id}
                className="overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => router.push(`/sub/treinamento/curso/${course.id}`)}
              >
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
                      <BookOpen className="h-12 w-12 text-slate-300" />
                    </div>
                  )}
                  {/* Module count badge */}
                  <Badge className="absolute top-2 right-2 bg-black/70 text-white">
                    {course.moduleCount} {course.moduleCount === 1 ? 'modulo' : 'modulos'}
                  </Badge>
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium text-slate-900 text-sm line-clamp-2">
                    {course.title}
                  </h3>
                  {course.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {course.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
