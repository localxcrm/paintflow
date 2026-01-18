'use client';

import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ImageUpload } from '@/components/ui/image-upload';
import { JobPhoto } from '@/types';
import { FileText, Camera, Image, Trash2, Plus } from 'lucide-react';
import { JobMediaTabProps } from './types';

export function JobMediaTab({ job, onFieldChange, onPhotosChange }: JobMediaTabProps) {
  const handleAddPhoto = (url: string, type: 'before' | 'after') => {
    const newPhoto: JobPhoto = {
      id: Date.now().toString(),
      url,
      type,
      uploadedAt: new Date().toISOString(),
    };
    onPhotosChange([...(job.photos || []), newPhoto]);
  };

  const handleRemovePhoto = (photoId: string) => {
    const newPhotos = job.photos?.filter(p => p.id !== photoId);
    onPhotosChange(newPhotos || []);
  };

  const beforePhotos = job.photos?.filter(p => p.type === 'before') || [];
  const afterPhotos = job.photos?.filter(p => p.type === 'after') || [];

  return (
    <div className="space-y-6">
      {/* Notes Section */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-base font-semibold">
          <FileText className="h-4 w-4" />
          Notas e Observações
        </Label>
        <Textarea
          value={job.notes || ''}
          onChange={(e) => onFieldChange('notes', e.target.value)}
          placeholder="Adicione notas sobre este trabalho..."
          rows={5}
          className="resize-none"
        />
      </div>

      <Separator />

      {/* Photos Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-base font-semibold">
            <Camera className="h-4 w-4" />
            Fotos do Trabalho
          </Label>
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Foto
          </Button>
        </div>

        {/* Photo Categories */}
        <div className="grid grid-cols-2 gap-4">
          {/* Before Photos */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Antes
            </h4>
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 min-h-[120px] flex items-center justify-center">
              {beforePhotos.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 w-full">
                  {beforePhotos.map((photo) => (
                    <div key={photo.id} className="relative aspect-video bg-slate-100 rounded overflow-hidden group">
                      <img src={photo.url} alt={photo.description || 'Antes'} className="w-full h-full object-cover" />
                      <button
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemovePhoto(photo.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-slate-400">
                  <Image className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma foto</p>
                </div>
              )}
            </div>
          </div>

          {/* After Photos */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Depois
            </h4>
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 min-h-[120px] flex items-center justify-center">
              {afterPhotos.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 w-full">
                  {afterPhotos.map((photo) => (
                    <div key={photo.id} className="relative aspect-video bg-slate-100 rounded overflow-hidden group">
                      <img src={photo.url} alt={photo.description || 'Depois'} className="w-full h-full object-cover" />
                      <button
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemovePhoto(photo.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-slate-400">
                  <Image className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma foto</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Photo Upload */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-600">Adicionar foto &quot;Antes&quot;</Label>
            <ImageUpload
              folder={`jobs/${job.id}/before`}
              onUpload={(url) => handleAddPhoto(url, 'before')}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-600">Adicionar foto &quot;Depois&quot;</Label>
            <ImageUpload
              folder={`jobs/${job.id}/after`}
              onUpload={(url) => handleAddPhoto(url, 'after')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
