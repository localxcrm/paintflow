'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SopEditor from '@/components/sop-editor/SopEditor';

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

export default function EditarSopPage() {
  const params = useParams();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadArticle = async () => {
      const id = params.id as string;
      if (!id) {
        router.push('/conhecimento');
        return;
      }

      try {
        const res = await fetch('/api/knowledge');
        if (res.ok) {
          const data = await res.json();
          const found = data.articles?.find((a: Article) => a.id === id);
          if (found) {
            setArticle(found);
          } else {
            router.push('/conhecimento');
          }
        } else {
          router.push('/conhecimento');
        }
      } catch (error) {
        console.error('Error loading article:', error);
        router.push('/conhecimento');
      } finally {
        setIsLoading(false);
      }
    };

    loadArticle();
  }, [params.id, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Carregando...</div>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  return <SopEditor article={article} isNew={false} />;
}
