'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PortfolioImage, ProjectType } from '@/types';
import { Images, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

interface PortfolioGalleryProps {
  images: PortfolioImage[];
}

export function PortfolioGallery({ images }: PortfolioGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (images.length === 0) return null;

  const currentImage = images[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const projectTypeColors: Record<ProjectType, string> = {
    interior: 'bg-blue-100 text-blue-800',
    exterior: 'bg-green-100 text-green-800',
    both: 'bg-purple-100 text-purple-800',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Images className="h-5 w-5 text-purple-600" />
          Our Recent Work
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Main Image Display */}
          <div className="relative rounded-lg overflow-hidden bg-slate-100">
            <div className="flex items-center">
              {/* Before Image */}
              <div className="w-1/2 relative">
                <img
                  src={currentImage.beforeUrl}
                  alt="Before"
                  className="w-full h-64 object-cover"
                />
                <div className="absolute bottom-3 left-3 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
                  Before
                </div>
              </div>

              {/* Arrow Indicator */}
              <div className="absolute left-1/2 -translate-x-1/2 z-10">
                <div className="bg-slate-900 rounded-full p-2">
                  <ArrowRight className="h-6 w-6 text-white" />
                </div>
              </div>

              {/* After Image */}
              <div className="w-1/2 relative">
                <img
                  src={currentImage.afterUrl}
                  alt="After"
                  className="w-full h-64 object-cover"
                />
                <div className="absolute bottom-3 right-3 bg-green-600 text-white text-sm px-3 py-1 rounded-full">
                  After
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          {images.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                onClick={handleNext}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>

        {/* Image Info */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={projectTypeColors[currentImage.projectType]}>
              {currentImage.projectType}
            </Badge>
            {currentImage.description && (
              <span className="text-sm text-slate-600">{currentImage.description}</span>
            )}
          </div>
          {images.length > 1 && (
            <span className="text-sm text-slate-500">
              {currentIndex + 1} of {images.length}
            </span>
          )}
        </div>

        {/* Thumbnail Navigation */}
        {images.length > 1 && (
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-transparent hover:border-slate-300'
                }`}
              >
                <img
                  src={image.afterUrl}
                  alt={`Project ${index + 1}`}
                  className="w-16 h-12 object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
