'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  Image as ImageIcon,
  Video,
  Plus,
  Loader2,
} from 'lucide-react';
import { uploadFileDirect } from '@/lib/supabase';
import { toast } from 'sonner';

export interface MediaItem {
  id: string;
  url: string;
  path?: string;
  type: 'photo' | 'video' | 'before' | 'progress' | 'after' | 'image';
  caption?: string;
  uploadedAt: string;
  uploadedBy?: string;
}

interface MediaGalleryProps {
  items: MediaItem[];
  onAddMedia?: (media: MediaItem) => void;
  organizationId?: string;
  workOrderId?: string;
  canAdd?: boolean;
  title?: string;
}

export function MediaGallery({
  items,
  onAddMedia,
  organizationId,
  workOrderId,
  canAdd = true,
  title = 'Fotos do Trabalho',
}: MediaGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isVideo = (item: MediaItem) => {
    return item.type === 'video' || item.url?.includes('.mp4') || item.url?.includes('.mov') || item.url?.includes('.webm');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !organizationId || !onAddMedia) return;

    setIsUploading(true);
    try {
      const data = await uploadFileDirect(
        file,
        organizationId,
        'work-order',
        workOrderId,
        file.name
      );

      const newMedia: MediaItem = {
        id: crypto.randomUUID(),
        url: data.url,
        path: data.path,
        type: data.type === 'video' ? 'video' : 'photo',
        caption: '',
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'Subcontratado',
      };

      onAddMedia(newMedia);
      toast.success('Foto adicionada!');
    } catch (error) {
      console.error('Error uploading:', error);
      toast.error('Erro ao enviar foto');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const goToPrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedIndex !== null && selectedIndex < items.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const selectedItem = selectedIndex !== null ? items[selectedIndex] : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Camera className="h-5 w-5" />
          {title} ({items.length})
        </h3>
        {canAdd && onAddMedia && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Adicionar
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Grid */}
      {items.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed">
          <ImageIcon className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">Nenhuma foto ainda</p>
          {canAdd && onAddMedia && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-4 w-4 mr-2" />
              Adicionar primeira foto
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="aspect-square relative rounded-lg overflow-hidden bg-slate-100 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setSelectedIndex(index)}
            >
              {isVideo(item) ? (
                <>
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="h-5 w-5 text-slate-700 ml-0.5" />
                    </div>
                  </div>
                </>
              ) : (
                <img
                  src={item.url}
                  alt={item.caption || 'Foto do trabalho'}
                  className="w-full h-full object-cover"
                />
              )}
              {/* Type badge */}
              <div className="absolute bottom-1 right-1">
                {isVideo(item) ? (
                  <Video className="h-4 w-4 text-white drop-shadow-md" />
                ) : (
                  <ImageIcon className="h-4 w-4 text-white drop-shadow-md" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black border-0">
          {selectedItem && (
            <div className="relative">
              {/* Header */}
              <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
                <span className="text-white text-sm">
                  {(selectedIndex ?? 0) + 1} de {items.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => setSelectedIndex(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Navigation - Previous */}
              {selectedIndex !== null && selectedIndex > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
              )}

              {/* Media Content */}
              <div className="flex items-center justify-center min-h-[60vh] max-h-[80vh]">
                {isVideo(selectedItem) ? (
                  <video
                    src={selectedItem.url}
                    controls
                    autoPlay
                    className="max-w-full max-h-[80vh] object-contain"
                  />
                ) : (
                  <img
                    src={selectedItem.url}
                    alt={selectedItem.caption || 'Foto do trabalho'}
                    className="max-w-full max-h-[80vh] object-contain"
                  />
                )}
              </div>

              {/* Navigation - Next */}
              {selectedIndex !== null && selectedIndex < items.length - 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              )}

              {/* Footer */}
              <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/50 to-transparent">
                <div className="text-white text-sm flex items-center gap-4">
                  <span>{formatDate(selectedItem.uploadedAt)}</span>
                  {selectedItem.uploadedBy && (
                    <span>Por: {selectedItem.uploadedBy}</span>
                  )}
                </div>
                {selectedItem.caption && (
                  <p className="text-white/80 text-sm mt-1">{selectedItem.caption}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
