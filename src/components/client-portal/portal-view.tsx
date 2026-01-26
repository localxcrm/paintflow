'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CheckCircle2,
  Clock,
  Calendar,
  MapPin,
  MessageCircle,
  Image,
  FileText,
  Send,
  Phone,
  Mail,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ClientPortalData, JOB_STATUS_LABELS, PHOTO_TYPE_LABELS } from '@/types/client-portal';

interface PortalViewProps {
  data: ClientPortalData;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  lead: { label: 'Orçamento', color: 'bg-slate-500' },
  got_the_job: { label: 'Aprovado', color: 'bg-blue-500' },
  scheduled: { label: 'Agendado', color: 'bg-amber-500' },
  completed: { label: 'Concluído', color: 'bg-green-500' },
};

export function ClientPortalView({ data }: PortalViewProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState(data.messages);

  const { job, photos, invoice, organization } = data;
  const statusInfo = STATUS_LABELS[job.status] || STATUS_LABELS.lead;

  // Send message handler
  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setSending(true);
    try {
      const res = await fetch('/api/client-portal/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: data.token, message }),
      });

      if (res.ok) {
        const newMessage = await res.json();
        setMessages([...messages, newMessage.message]);
        setMessage('');
        toast.success('Mensagem enviada!');
      } else {
        toast.error('Erro ao enviar mensagem');
      }
    } catch (error) {
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          {organization.name}
        </h1>
        <p className="text-slate-500">Portal do Cliente</p>
      </div>

      {/* Job Status Card */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{job.jobNumber}</CardTitle>
            <Badge className={cn('text-white', statusInfo.color)}>
              {statusInfo.label}
            </Badge>
          </div>
          <CardDescription className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {job.address}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-slate-500">Progresso</span>
              <span className="font-medium">{job.completionPercentage}%</span>
            </div>
            <Progress value={job.completionPercentage} className="h-2" />
          </div>

          {/* Schedule info */}
          {job.scheduledStartDate && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="h-4 w-4" />
              <span>
                Início previsto: {format(parseISO(job.scheduledStartDate), 'd MMM yyyy', { locale: ptBR })}
              </span>
            </div>
          )}

          {/* Last update */}
          <div className="flex items-center gap-2 text-sm text-slate-400 mt-2">
            <Clock className="h-4 w-4" />
            <span>
              Atualizado: {format(parseISO(job.lastUpdated), "d MMM 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Photos, Messages, Invoice */}
      <Tabs defaultValue="photos" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="photos" className="flex items-center gap-1">
            <Image className="h-4 w-4" />
            Fotos
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            Mensagens
          </TabsTrigger>
          <TabsTrigger value="invoice" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            Fatura
          </TabsTrigger>
        </TabsList>

        {/* Photos Tab */}
        <TabsContent value="photos" className="mt-4">
          {photos.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma foto disponível ainda</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {photos.map((photo) => (
                <div key={photo.id} className="relative rounded-lg overflow-hidden">
                  <img
                    src={photo.url}
                    alt={photo.caption || 'Photo'}
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <span className="text-xs text-white font-medium">
                      {photo.type === 'before' ? 'Antes' : photo.type === 'after' ? 'Depois' : 'Progresso'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="mt-4">
          <div className="space-y-4">
            {/* Message list */}
            <div className="space-y-3 max-h-[300px] overflow-auto">
              {messages.length === 0 ? (
                <p className="text-center text-slate-400 py-4">
                  Nenhuma mensagem ainda
                </p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'p-3 rounded-lg max-w-[80%]',
                      msg.authorType === 'client'
                        ? 'ml-auto bg-blue-100 text-blue-900'
                        : 'bg-slate-100 text-slate-900'
                    )}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {format(parseISO(msg.createdAt), "d MMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Send message */}
            <div className="flex gap-2">
              <Textarea
                placeholder="Digite sua mensagem..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || sending}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar
            </Button>
          </div>
        </TabsContent>

        {/* Invoice Tab */}
        <TabsContent value="invoice" className="mt-4">
          {!invoice ? (
            <div className="text-center py-8 text-slate-400">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma fatura disponível</p>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Orçamento</span>
                    <span className="font-medium">{invoice.estimateNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Valor Total</span>
                    <span className="font-bold text-lg">{formatCurrency(invoice.totalPrice)}</span>
                  </div>
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Entrada</span>
                      <div className="flex items-center gap-2">
                        <span>{formatCurrency(invoice.depositAmount)}</span>
                        {invoice.depositPaid && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Saldo</span>
                      <div className="flex items-center gap-2">
                        <span>{formatCurrency(invoice.balanceDue)}</span>
                        {invoice.balancePaid && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Contact Footer */}
      <div className="mt-8 pt-6 border-t text-center">
        <p className="text-sm text-slate-500 mb-3">Precisa de ajuda?</p>
        <div className="flex justify-center gap-4">
          {organization.phone && (
            <a
              href={`tel:${organization.phone}`}
              className="flex items-center gap-1 text-blue-600 hover:underline"
            >
              <Phone className="h-4 w-4" />
              Ligar
            </a>
          )}
          {organization.email && (
            <a
              href={`mailto:${organization.email}`}
              className="flex items-center gap-1 text-blue-600 hover:underline"
            >
              <Mail className="h-4 w-4" />
              Email
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
