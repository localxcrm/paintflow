'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Home,
  CheckSquare,
  Package,
  Camera,
  MessageSquare,
  Copy,
  ExternalLink,
  MoreVertical,
  Edit,
  Send,
  Trash2,
  Check,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  WorkOrder,
  WorkOrderRoom,
  WorkOrderTask,
  WorkOrderPhoto,
  WorkOrderComment,
  WORK_ORDER_STATUS_LABELS,
  WORK_ORDER_STATUS_COLORS,
  PHOTO_TYPE_LABELS,
} from '@/types/work-order';
import { WorkOrderForm } from './work-order-form';

interface WorkOrderDetailProps {
  workOrder: WorkOrder;
  onUpdate: (updates: Partial<WorkOrder>) => Promise<void>;
  onDelete: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkOrderDetail({
  workOrder,
  onUpdate,
  onDelete,
  open,
  onOpenChange,
}: WorkOrderDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const job = workOrder.job;

  const completedTasks = workOrder.tasks.filter((t: WorkOrderTask) => t.completed).length;
  const totalTasks = workOrder.tasks.length;
  const completedRooms = workOrder.rooms.filter((r: WorkOrderRoom) => r.completed).length;
  const totalRooms = workOrder.rooms.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/os/${workOrder.publicToken}`;

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success('Link copiado para a área de transferência!');
  };

  const sendToSubcontractor = async () => {
    setIsSending(true);
    try {
      await onUpdate({ status: 'sent' });
      copyLink();
      toast.success('OS marcada como enviada! Link copiado.');
    } catch {
      toast.error('Erro ao enviar OS');
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return '-';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (isEditing) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar {workOrder.osNumber}</DialogTitle>
          </DialogHeader>
          <WorkOrderForm
            workOrder={workOrder}
            onSave={async (updates) => {
              await onUpdate(updates);
              setIsEditing(false);
            }}
            onClose={() => setIsEditing(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                🎨 {workOrder.osNumber}
                <Badge className={WORK_ORDER_STATUS_COLORS[workOrder.status]}>
                  {WORK_ORDER_STATUS_LABELS[workOrder.status]}
                </Badge>
              </DialogTitle>
              {job && (
                <p className="text-sm text-slate-500 mt-1">
                  #{job.jobNumber} - {job.clientName}
                </p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyLink}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(publicUrl, '_blank')}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir Página Pública
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress */}
          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progresso</span>
                <span className="text-sm font-bold">{progress}%</span>
              </div>
              <div className="w-full bg-blue-400/30 rounded-full h-2">
                <div
                  className="bg-white rounded-full h-2 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-blue-100">
                <span>{completedTasks}/{totalTasks} tarefas</span>
                <span>{completedRooms}/{totalRooms} cômodos</span>
              </div>
            </CardContent>
          </Card>

          {/* Info */}
          <Card>
            <CardContent className="p-4 space-y-3">
              {job && (
                <>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-slate-800">{job.address}</p>
                      <p className="text-sm text-slate-500">
                        {job.city}{job.state ? `, ${job.state}` : ''} {job.zipCode}
                      </p>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Data</p>
                    <p className="font-medium">{formatDate(workOrder.scheduledDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Duração</p>
                    <p className="font-medium">{workOrder.estimatedDuration || 8}h</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-slate-500">Valor Sub</p>
                    <p className="font-medium text-green-600">
                      {formatCurrency(workOrder.subcontractorPrice)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rooms */}
          {workOrder.rooms.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Home className="h-4 w-4 text-blue-600" />
                  Cômodos ({completedRooms}/{totalRooms})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1">
                  {workOrder.rooms.map((room: WorkOrderRoom) => (
                    <div
                      key={room.id}
                      className={`flex items-center justify-between p-2 rounded text-sm ${
                        room.completed ? 'bg-green-50' : 'bg-slate-50'
                      }`}
                    >
                      <div>
                        <span className={room.completed ? 'line-through text-green-700' : ''}>
                          {room.name}
                        </span>
                        <span className="text-xs text-slate-400 ml-2">
                          {room.scope.join(', ')}
                        </span>
                      </div>
                      {room.completed && <Check className="h-4 w-4 text-green-600" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tasks */}
          {workOrder.tasks.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                  Checklist ({completedTasks}/{totalTasks})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1">
                  {workOrder.tasks
                    .sort((a: WorkOrderTask, b: WorkOrderTask) => a.order - b.order)
                    .map((task: WorkOrderTask) => (
                      <div
                        key={task.id}
                        className={`flex items-center gap-2 p-1 text-sm ${
                          task.completed ? 'text-green-700' : 'text-slate-700'
                        }`}
                      >
                        {task.completed ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <div className="w-4 h-4 border rounded" />
                        )}
                        <span className={task.completed ? 'line-through' : ''}>
                          {task.description}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Materials */}
          {workOrder.materials.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  Materiais
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-1 text-sm">
                  {workOrder.materials.map((material) => (
                    <li key={material.id} className="flex items-center gap-2">
                      <span className="text-slate-400">•</span>
                      <span>
                        {material.quantity} {material.unit} - {material.name}
                        {material.color && (
                          <span className="text-blue-600 ml-1">
                            ({material.color})
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Photos */}
          {workOrder.photos.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Camera className="h-4 w-4 text-blue-600" />
                  Fotos ({workOrder.photos.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-4 gap-2">
                  {workOrder.photos.map((photo: WorkOrderPhoto) => (
                    <a
                      key={photo.id}
                      href={photo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative aspect-square bg-slate-100 rounded overflow-hidden group"
                    >
                      <img
                        src={photo.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                        {PHOTO_TYPE_LABELS[photo.type]}
                      </div>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          {workOrder.comments.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  Comentários ({workOrder.comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {workOrder.comments.map((comment: WorkOrderComment) => (
                    <div
                      key={comment.id}
                      className={`p-2 rounded text-sm ${
                        comment.authorType === 'company'
                          ? 'bg-blue-50'
                          : 'bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">
                          {comment.authorType === 'company' ? 'Empresa' : 'Sub'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(comment.createdAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-slate-700">{comment.text}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            {workOrder.status === 'draft' ? (
              <Button className="flex-1" onClick={sendToSubcontractor} disabled={isSending}>
                {isSending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Enviar para Subcontratado
              </Button>
            ) : (
              <Button variant="outline" className="flex-1" onClick={copyLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar Link
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
