'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  folder?: string;
  className?: string;
  maxSize?: number; // in MB
  accept?: string;
}

export function ImageUpload({
  onUpload,
  folder = 'photos',
  className = '',
  maxSize = 5,
  accept = 'image/jpeg,image/png,image/webp,image/gif',
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem.');
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Máximo ${maxSize}MB.`);
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao fazer upload');
      }

      const data = await res.json();
      onUpload(data.url);
      toast.success('Imagem enviada com sucesso!');
      setPreview(null);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer upload');
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  }, [folder, maxSize, onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const cancelPreview = () => {
    setPreview(null);
    setIsUploading(false);
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />

      {preview ? (
        <div className="relative rounded-lg overflow-hidden border border-slate-200">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-32 object-cover"
          />
          {isUploading ? (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="flex items-center gap-2 text-white">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Enviando...</span>
              </div>
            </div>
          ) : (
            <button
              onClick={cancelPreview}
              className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-colors duration-200
            ${isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
            }
          `}
        >
          <div className="flex flex-col items-center gap-2">
            {isDragging ? (
              <ImageIcon className="h-8 w-8 text-blue-500" />
            ) : (
              <Upload className="h-8 w-8 text-slate-400" />
            )}
            <div className="text-sm text-slate-600">
              {isDragging ? (
                <span className="text-blue-600 font-medium">Solte a imagem aqui</span>
              ) : (
                <>
                  <span className="text-blue-600 font-medium">Clique para selecionar</span>
                  {' '}ou arraste uma imagem
                </>
              )}
            </div>
            <p className="text-xs text-slate-400">
              JPEG, PNG, WebP ou GIF (máx. {maxSize}MB)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

interface ImageGalleryProps {
  images: string[];
  onRemove?: (url: string) => void;
  className?: string;
}

export function ImageGallery({ images, onRemove, className = '' }: ImageGalleryProps) {
  if (images.length === 0) return null;

  return (
    <div className={`grid grid-cols-3 gap-2 ${className}`}>
      {images.map((url, index) => (
        <div key={index} className="relative group rounded-lg overflow-hidden">
          <img
            src={url}
            alt={`Foto ${index + 1}`}
            className="w-full h-24 object-cover"
          />
          {onRemove && (
            <button
              onClick={() => onRemove(url)}
              className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
