'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CompanyEstimateSettings, PortfolioImage, ProjectType } from '@/types';
import { Images, Plus, Upload, Trash2, ArrowRight } from 'lucide-react';

interface PortfolioManagerProps {
  settings: CompanyEstimateSettings;
  onUpdate: (settings: Partial<CompanyEstimateSettings>) => void;
}

export function PortfolioManager({ settings, onUpdate }: PortfolioManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newImage, setNewImage] = useState<Partial<PortfolioImage>>({
    projectType: 'interior',
  });
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);

  const handleBeforeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setBeforePreview(dataUrl);
        setNewImage((prev) => ({ ...prev, beforeUrl: dataUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAfterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setAfterPreview(dataUrl);
        setNewImage((prev) => ({ ...prev, afterUrl: dataUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddImage = () => {
    if (newImage.beforeUrl && newImage.afterUrl) {
      const portfolioImage: PortfolioImage = {
        id: Date.now().toString(),
        beforeUrl: newImage.beforeUrl,
        afterUrl: newImage.afterUrl,
        projectType: newImage.projectType as ProjectType,
        description: newImage.description,
      };

      onUpdate({
        portfolioImages: [...(settings.portfolioImages || []), portfolioImage],
      });

      // Reset form
      setNewImage({ projectType: 'interior' });
      setBeforePreview(null);
      setAfterPreview(null);
      setIsAddDialogOpen(false);
    }
  };

  const handleRemoveImage = (id: string) => {
    onUpdate({
      portfolioImages: settings.portfolioImages.filter((img) => img.id !== id),
    });
  };

  const projectTypeColors: Record<ProjectType, string> = {
    interior: 'bg-blue-100 text-blue-800',
    exterior: 'bg-green-100 text-green-800',
    both: 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Images className="h-5 w-5 text-purple-600" />
                Portfolio Gallery
              </CardTitle>
              <CardDescription>
                Showcase your before & after transformations on estimates
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Before & After Photos</DialogTitle>
                  <DialogDescription>
                    Upload photos to showcase your work quality
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 mt-4">
                  {/* Before & After Upload */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Before */}
                    <div className="space-y-2">
                      <Label>Before Photo</Label>
                      {beforePreview ? (
                        <div className="relative">
                          <img
                            src={beforePreview}
                            alt="Before"
                            className="w-full h-48 object-cover rounded-lg border"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setBeforePreview(null);
                              setNewImage((prev) => ({ ...prev, beforeUrl: undefined }));
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                          <Upload className="h-8 w-8 text-slate-400 mb-2" />
                          <span className="text-sm text-slate-500">Upload Before</span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleBeforeUpload}
                          />
                        </label>
                      )}
                    </div>

                    {/* After */}
                    <div className="space-y-2">
                      <Label>After Photo</Label>
                      {afterPreview ? (
                        <div className="relative">
                          <img
                            src={afterPreview}
                            alt="After"
                            className="w-full h-48 object-cover rounded-lg border"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setAfterPreview(null);
                              setNewImage((prev) => ({ ...prev, afterUrl: undefined }));
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                          <Upload className="h-8 w-8 text-slate-400 mb-2" />
                          <span className="text-sm text-slate-500">Upload After</span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleAfterUpload}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Project Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Project Type</Label>
                      <Select
                        value={newImage.projectType}
                        onValueChange={(value) =>
                          setNewImage((prev) => ({ ...prev, projectType: value as ProjectType }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="interior">Interior</SelectItem>
                          <SelectItem value="exterior">Exterior</SelectItem>
                          <SelectItem value="both">Interior & Exterior</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Description (Optional)</Label>
                      <Input
                        placeholder="e.g., Kitchen refresh in Greenwich"
                        value={newImage.description || ''}
                        onChange={(e) =>
                          setNewImage((prev) => ({ ...prev, description: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddImage}
                      disabled={!newImage.beforeUrl || !newImage.afterUrl}
                    >
                      Add to Portfolio
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {settings.portfolioImages.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Images className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>No portfolio images yet</p>
              <p className="text-sm">Add before & after photos to showcase your work</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {settings.portfolioImages.map((image) => (
                <Card key={image.id} className="overflow-hidden">
                  <div className="relative">
                    <div className="flex items-center">
                      <div className="w-1/2 relative">
                        <img
                          src={image.beforeUrl}
                          alt="Before"
                          className="w-full h-32 object-cover"
                        />
                        <span className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                          Before
                        </span>
                      </div>
                      <ArrowRight className="absolute left-1/2 -translate-x-1/2 h-6 w-6 text-white bg-slate-900 rounded-full p-1 z-10" />
                      <div className="w-1/2 relative">
                        <img
                          src={image.afterUrl}
                          alt="After"
                          className="w-full h-32 object-cover"
                        />
                        <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                          After
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 h-7 w-7 p-0"
                      onClick={() => handleRemoveImage(image.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <Badge className={projectTypeColors[image.projectType]}>
                        {image.projectType}
                      </Badge>
                    </div>
                    {image.description && (
                      <p className="text-sm text-slate-600 mt-2">{image.description}</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
