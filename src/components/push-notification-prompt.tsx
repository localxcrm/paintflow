'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Loader2, Check, X } from 'lucide-react';
import {
  isPushSupported,
  getNotificationPermission,
  enablePushNotifications,
  isSubscribedToPush,
} from '@/lib/push-notifications';
import { toast } from 'sonner';

interface PushNotificationPromptProps {
  userType: 'admin' | 'subcontractor';
  workOrderToken?: string;
  compact?: boolean; // Compact mode for inline use
}

type PermissionState = 'loading' | 'unsupported' | 'default' | 'granted' | 'denied' | 'subscribed';

export function PushNotificationPrompt({
  userType,
  workOrderToken,
  compact = false,
}: PushNotificationPromptProps) {
  const [state, setState] = useState<PermissionState>('loading');
  const [isEnabling, setIsEnabling] = useState(false);

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    if (!isPushSupported()) {
      setState('unsupported');
      return;
    }

    const permission = getNotificationPermission();
    if (permission === 'unsupported') {
      setState('unsupported');
      return;
    }

    if (permission === 'denied') {
      setState('denied');
      return;
    }

    if (permission === 'granted') {
      // Check if actually subscribed
      const subscribed = await isSubscribedToPush();
      setState(subscribed ? 'subscribed' : 'granted');
      return;
    }

    setState('default');
  };

  const handleEnableNotifications = async () => {
    setIsEnabling(true);
    try {
      const result = await enablePushNotifications({
        userType,
        workOrderToken,
      });

      if (result.success) {
        setState('subscribed');
        toast.success('Notificações ativadas!', {
          description: 'Você receberá alertas de novas mensagens.',
        });
      } else {
        toast.error('Erro ao ativar notificações', {
          description: result.error,
        });
        // Re-check status
        checkPermissionStatus();
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast.error('Erro ao ativar notificações');
    } finally {
      setIsEnabling(false);
    }
  };

  // Loading state - show loading indicator in compact mode
  if (state === 'loading') {
    if (compact) {
      return (
        <Button variant="ghost" size="sm" disabled className="gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando...
        </Button>
      );
    }
    return null;
  }

  // Unsupported browser
  if (state === 'unsupported') {
    if (compact) {
      return (
        <Button variant="ghost" size="sm" disabled className="gap-2 text-slate-400">
          <BellOff className="h-4 w-4" />
          Não suportado
        </Button>
      );
    }
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <BellOff className="h-4 w-4" />
        <span>Notificações não suportadas neste navegador</span>
      </div>
    );
  }

  // Permission denied
  if (state === 'denied') {
    if (compact) {
      return (
        <Button variant="ghost" size="sm" disabled className="gap-2 text-slate-400">
          <BellOff className="h-4 w-4" />
          Bloqueado
        </Button>
      );
    }
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
        <BellOff className="h-5 w-5 text-red-500" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-700">Notificações bloqueadas</p>
          <p className="text-xs text-red-600">
            Habilite nas configurações do navegador para receber alertas.
          </p>
        </div>
      </div>
    );
  }

  // Already subscribed
  if (state === 'subscribed') {
    if (compact) {
      return (
        <Button variant="ghost" size="sm" disabled className="gap-2 text-green-600">
          <Check className="h-4 w-4" />
          Notificações ativas
        </Button>
      );
    }
    return (
      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
        <Bell className="h-5 w-5 text-green-500" />
        <div className="flex-1">
          <p className="text-sm font-medium text-green-700">Notificações ativadas</p>
          <p className="text-xs text-green-600">
            Você receberá alertas de novas mensagens.
          </p>
        </div>
      </div>
    );
  }

  // Default or granted but not subscribed - show enable button
  if (compact) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleEnableNotifications}
        disabled={isEnabling}
        className="gap-2"
      >
        {isEnabling ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
        Ativar notificações
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <Bell className="h-5 w-5 text-blue-500" />
      <div className="flex-1">
        <p className="text-sm font-medium text-blue-700">
          Ativar notificações push
        </p>
        <p className="text-xs text-blue-600">
          Receba alertas mesmo com a aba fechada.
        </p>
      </div>
      <Button
        size="sm"
        onClick={handleEnableNotifications}
        disabled={isEnabling}
        className="gap-2"
      >
        {isEnabling ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
        Ativar
      </Button>
    </div>
  );
}
