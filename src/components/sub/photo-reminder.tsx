'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, Check } from 'lucide-react';

interface PhotoReminderProps {
  type: 'before' | 'after';
  onTakePhoto: () => void;
  onSkip: () => void;
  isOpen: boolean;
}

export function PhotoReminder({ type, onTakePhoto, onSkip, isOpen }: PhotoReminderProps) {
  if (!isOpen) return null;

  const isBefore = type === 'before';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center animate-in zoom-in-95 duration-300">
        {/* Icon */}
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
          isBefore ? 'bg-amber-100' : 'bg-emerald-100'
        }`}>
          <Camera className={`h-10 w-10 ${isBefore ? 'text-amber-600' : 'text-emerald-600'}`} />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {isBefore ? 'Tire foto ANTES!' : 'Trabalho Concluido!'}
        </h2>

        {/* Description */}
        <p className="text-slate-500 mb-6">
          {isBefore
            ? 'Registre o estado inicial do ambiente antes de comecar'
            : 'Nao esqueca de registrar o resultado final!'}
        </p>

        {/* Primary Action */}
        <Button
          className={`w-full h-14 text-lg font-bold gap-3 ${
            isBefore
              ? 'bg-amber-500 hover:bg-amber-600'
              : 'bg-emerald-500 hover:bg-emerald-600'
          }`}
          onClick={onTakePhoto}
        >
          <Camera className="h-6 w-6" />
          Tirar Foto {isBefore ? 'Agora' : 'do Resultado'}
        </Button>

        {/* Skip Button */}
        <Button
          variant="ghost"
          className="w-full mt-3 text-slate-500"
          onClick={onSkip}
        >
          {isBefore ? 'Pular - ja tenho fotos' : 'Ja registrei'}
        </Button>
      </div>
    </div>
  );
}

// Hook to manage photo reminders
export function usePhotoReminder() {
  const [showBeforeReminder, setShowBeforeReminder] = useState(false);
  const [showAfterReminder, setShowAfterReminder] = useState(false);
  const [hasShownBefore, setHasShownBefore] = useState(false);
  const [hasShownAfter, setHasShownAfter] = useState(false);

  const checkAndShowBeforeReminder = (progress: number, totalTasks: number) => {
    // Show before reminder when opening a job with 0% progress
    if (progress === 0 && totalTasks > 0 && !hasShownBefore) {
      setShowBeforeReminder(true);
      setHasShownBefore(true);
    }
  };

  const checkAndShowAfterReminder = (progress: number, previousProgress: number) => {
    // Show after reminder when completing all tasks (100%)
    if (progress === 100 && previousProgress < 100 && !hasShownAfter) {
      setShowAfterReminder(true);
      setHasShownAfter(true);
    }
  };

  const dismissBeforeReminder = () => {
    setShowBeforeReminder(false);
  };

  const dismissAfterReminder = () => {
    setShowAfterReminder(false);
  };

  return {
    showBeforeReminder,
    showAfterReminder,
    checkAndShowBeforeReminder,
    checkAndShowAfterReminder,
    dismissBeforeReminder,
    dismissAfterReminder,
  };
}
