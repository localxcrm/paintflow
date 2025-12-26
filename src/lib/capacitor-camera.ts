'use client';

import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

// Check if running in Capacitor native app
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

// Check if camera is available
export async function isCameraAvailable(): Promise<boolean> {
  if (!isNativeApp()) {
    // On web, check for mediaDevices
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  try {
    const permissions = await Camera.checkPermissions();
    return permissions.camera !== 'denied';
  } catch {
    return false;
  }
}

// Request camera permissions
export async function requestCameraPermission(): Promise<boolean> {
  if (!isNativeApp()) {
    // On web, permission is requested when getUserMedia is called
    return true;
  }

  try {
    const permissions = await Camera.requestPermissions({ permissions: ['camera', 'photos'] });
    return permissions.camera === 'granted';
  } catch {
    return false;
  }
}

// Take a photo using native camera
export async function takePhoto(): Promise<Photo | null> {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      promptLabelHeader: 'Foto',
      promptLabelCancel: 'Cancelar',
      promptLabelPhoto: 'Da Galeria',
      promptLabelPicture: 'Tirar Foto',
    });

    return image;
  } catch (error) {
    console.error('Error taking photo:', error);
    return null;
  }
}

// Pick photo from gallery
export async function pickFromGallery(): Promise<Photo | null> {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos,
    });

    return image;
  } catch (error) {
    console.error('Error picking photo:', error);
    return null;
  }
}

// Pick photo with choice (camera or gallery)
export async function pickPhoto(): Promise<Photo | null> {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Prompt, // Shows action sheet with Camera/Gallery options
      promptLabelHeader: 'Selecionar Foto',
      promptLabelCancel: 'Cancelar',
      promptLabelPhoto: 'Escolher da Galeria',
      promptLabelPicture: 'Tirar Foto',
    });

    return image;
  } catch (error) {
    // User cancelled
    if ((error as Error).message?.includes('cancelled')) {
      return null;
    }
    console.error('Error picking photo:', error);
    return null;
  }
}

// Convert Photo to File for upload
export async function photoToFile(photo: Photo, filename?: string): Promise<File | null> {
  if (!photo.webPath) return null;

  try {
    const response = await fetch(photo.webPath);
    const blob = await response.blob();

    const name = filename || `photo_${Date.now()}.${photo.format || 'jpeg'}`;
    return new File([blob], name, { type: `image/${photo.format || 'jpeg'}` });
  } catch (error) {
    console.error('Error converting photo to file:', error);
    return null;
  }
}

// Take photo and convert to File directly
export async function capturePhotoAsFile(filename?: string): Promise<File | null> {
  const photo = await takePhoto();
  if (!photo) return null;

  return photoToFile(photo, filename);
}

// Pick photo and convert to File directly
export async function pickPhotoAsFile(filename?: string): Promise<File | null> {
  const photo = await pickPhoto();
  if (!photo) return null;

  return photoToFile(photo, filename);
}
