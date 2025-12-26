'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Camera, ImagePlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  isNativeApp,
  takePhoto,
  pickFromGallery,
  photoToFile,
  requestCameraPermission,
} from '@/lib/capacitor-camera';

interface CameraButtonProps {
  onCapture: (file: File) => void;
  onCaptureMultiple?: (files: File[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
}

export function CameraButton({
  onCapture,
  onCaptureMultiple,
  multiple = false,
  disabled = false,
  variant = 'outline',
  size = 'default',
  className,
  children,
}: CameraButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle native camera capture
  const handleNativeCamera = async () => {
    setIsLoading(true);
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        toast.error('Permissao de camera negada');
        return;
      }

      const photo = await takePhoto();
      if (!photo) {
        return; // User cancelled
      }

      const file = await photoToFile(photo);
      if (file) {
        onCapture(file);
        toast.success('Foto capturada!');
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      toast.error('Erro ao capturar foto');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle native gallery pick
  const handleNativeGallery = async () => {
    setIsLoading(true);
    try {
      const photo = await pickFromGallery();
      if (!photo) {
        return; // User cancelled
      }

      const file = await photoToFile(photo);
      if (file) {
        onCapture(file);
      }
    } catch (error) {
      console.error('Error picking photo:', error);
      toast.error('Erro ao selecionar foto');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle web file input
  const handleWebFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (multiple && onCaptureMultiple) {
      onCaptureMultiple(Array.from(files));
    } else {
      onCapture(files[0]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // For native app, show dropdown with camera/gallery options
  if (isNativeApp()) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            disabled={disabled || isLoading}
            className={className}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              children || (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Foto
                </>
              )
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleNativeCamera}>
            <Camera className="h-4 w-4 mr-2" />
            Tirar Foto
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleNativeGallery}>
            <ImagePlus className="h-4 w-4 mr-2" />
            Escolher da Galeria
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // For web, use file input with camera capture support
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple={multiple}
        onChange={handleWebFileInput}
        className="hidden"
      />
      <Button
        variant={variant}
        size={size}
        disabled={disabled || isLoading}
        className={className}
        onClick={() => fileInputRef.current?.click()}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          children || (
            <>
              <Camera className="h-4 w-4 mr-2" />
              Foto
            </>
          )
        )}
      </Button>
    </>
  );
}

// Simple camera icon button variant
export function CameraIconButton({
  onCapture,
  disabled = false,
  className,
}: {
  onCapture: (file: File) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <CameraButton
      onCapture={onCapture}
      disabled={disabled}
      variant="ghost"
      size="icon"
      className={className}
    >
      <Camera className="h-5 w-5" />
    </CameraButton>
  );
}
