'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  MapPin,
  User,
  DollarSign,
  Users,
  FileText,
  Plus,
  Loader2,
  AlertCircle,
  Copy,
  ExternalLink,
  CheckCircle2,
  Save,
  Calendar,
  CreditCard,
  Percent,
  Building,
  Camera,
  Image,
  Trash2,
  TrendingUp,
  TrendingDown,
  Edit,
  Send,
  Clock,
  CheckSquare,
  Square,
  Palette,
  Package,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';
import { Job, JobStatus, ProjectType, TeamMember, Subcontractor, JobPayment, JobPaymentType } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  WorkOrder,
  WorkOrderRoom,
  WorkOrderTask,
  WorkOrderMaterial,
  WORK_ORDER_STATUS_LABELS,
  WORK_ORDER_STATUS_COLORS,
  COMMON_SCOPE_ITEMS,
  DEFAULT_PAINTING_TASKS,
} from '@/types/work-order';
import { RoomType } from '@/types/room-type';
import { MediaGallery } from '@/components/work-order/media-gallery';
import { Progress } from '@/components/ui/progress';
import { WorkOrderDetail } from '@/components/work-orders/work-order-detail';
import { WorkOrderForm } from '@/components/work-orders/work-order-form';
import { formatCurrency, getStatusColor, getProfitFlagColor } from '@/lib/utils/job-calculations';

interface PageProps {
  params: Promise<{ id: string }>;
}

const statusLabels: Record<string, string> = {
  lead: 'Lead',
  quoted: 'Orçamento Enviado',
  follow_up: 'Follow Up',
  negotiation: 'Negociação',
  got_the_job: 'Fechado',
  scheduled: 'Agendado',
  completed: 'Concluído',
  lost: 'Perdido',
  cancelled: 'Cancelado',
};

const statusColors: Record<string, string> = {
  lead: 'bg-gray-100 text-gray-700',
  quoted: 'bg-blue-100 text-blue-700',
  follow_up: 'bg-yellow-100 text-yellow-700',
  negotiation: 'bg-purple-100 text-purple-700',
  got_the_job: 'bg-green-100 text-green-700',
  scheduled: 'bg-cyan-100 text-cyan-700',
  completed: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-100 text-slate-700',
};

const projectTypeLabels: Record<string, string> = {
  interior: 'Interior',
  exterior: 'Exterior',
  both: 'Interior + Exterior',
};

export default function JobDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [job, setJob] = useState<Job | null>(null);
  const [editedJob, setEditedJob] = useState<Job | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Work Order states
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreatingWO, setIsCreatingWO] = useState(false);
  const [deleteWOId, setDeleteWOId] = useState<string | null>(null);

  // Inline OS editing states
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newMaterialName, setNewMaterialName] = useState('');

  // Payment states
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<JobPayment | null>(null);
  const [paymentForm, setPaymentForm] = useState<Partial<JobPayment>>({
    type: 'client_deposit',
    category: 'income',
    description: '',
    amount: 0,
    status: 'pending',
  });

  // Template states
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  // Poll for work order updates (photos) every 15 seconds
  useEffect(() => {
    const pollForUpdates = async () => {
      if (!workOrders.length) return;

      try {
        const res = await fetch(`/api/work-orders?jobId=${id}`);
        if (res.ok) {
          const data = await res.json();
          const updatedWOs = data.workOrders || [];
          if (updatedWOs.length > 0) {
            // Only update if photos changed
            const currentPhotos = JSON.stringify(workOrders[0]?.photos || []);
            const newPhotos = JSON.stringify(updatedWOs[0]?.photos || []);
            if (currentPhotos !== newPhotos) {
              setWorkOrders(updatedWOs);
            }
          }
        }
      } catch (error) {
        console.error('Error polling for updates:', error);
      }
    };

    const interval = setInterval(pollForUpdates, 15000);
    return () => clearInterval(interval);
  }, [id, workOrders]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [jobRes, woRes, teamRes, subsRes, roomTypesRes] = await Promise.all([
        fetch(`/api/jobs/${id}`),
        fetch(`/api/work-orders?jobId=${id}`),
        fetch('/api/team'),
        fetch('/api/subcontractors'),
        fetch('/api/room-types'),
      ]);

      if (!jobRes.ok) {
        setError('Trabalho não encontrado');
        return;
      }

      const jobData = await jobRes.json();
      setJob(jobData);
      setEditedJob(jobData);

      if (woRes.ok) {
        const woData = await woRes.json();
        const wos = woData.workOrders || [];
        setWorkOrders(wos);
      }

      if (teamRes.ok) {
        const teamData = await teamRes.json();
        setTeamMembers(teamData.teamMembers || []);
      }

      if (subsRes.ok) {
        const subsData = await subsRes.json();
        setSubcontractors(subsData.subcontractors || []);
      }

      if (roomTypesRes.ok) {
        const roomTypesData = await roomTypesRes.json();
        setRoomTypes(roomTypesData.roomTypes || []);
      }
    } catch {
      setError('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (field: keyof Job, value: unknown) => {
    if (!editedJob) return;

    const updated = { ...editedJob, [field]: value };

    // Recalculate dependent fields
    if (field === 'jobValue') {
      const jobValue = value as number;
      updated.subMaterials = jobValue * 0.15;
      updated.subLabor = jobValue * 0.45;
      updated.subTotal = jobValue * 0.60;
      updated.grossProfit = jobValue * 0.40;
      updated.grossMarginPct = 40;
      updated.depositRequired = jobValue * 0.30;
      updated.salesCommissionAmount = jobValue * (updated.salesCommissionPct / 100);
      updated.pmCommissionAmount = jobValue * (updated.pmCommissionPct / 100);
      updated.subcontractorPrice = jobValue * 0.60;
      updated.balanceDue = jobValue - (updated.depositPaid ? updated.depositRequired : 0);
      updated.meetsMinGp = updated.grossProfit >= 900;
      updated.profitFlag = updated.grossProfit < 900 ? 'RAISE PRICE' : 'OK';
    }

    if (field === 'salesCommissionPct') {
      updated.salesCommissionAmount = updated.jobValue * ((value as number) / 100);
    }

    if (field === 'pmCommissionPct') {
      updated.pmCommissionAmount = updated.jobValue * ((value as number) / 100);
    }

    if (field === 'depositPaid') {
      updated.balanceDue = updated.jobPaid ? 0 : updated.jobValue - ((value as boolean) ? updated.depositRequired : 0);
    }

    if (field === 'jobPaid') {
      updated.balanceDue = (value as boolean) ? 0 : updated.jobValue - (updated.depositPaid ? updated.depositRequired : 0);
    }

    if (field === 'salesRepId') {
      const member = teamMembers.find(m => m.id === value);
      updated.salesRep = member;
      if (member) {
        updated.salesCommissionPct = member.defaultCommissionPct;
        updated.salesCommissionAmount = updated.jobValue * (member.defaultCommissionPct / 100);
      }
    }

    if (field === 'projectManagerId') {
      const member = teamMembers.find(m => m.id === value);
      updated.projectManager = member;
      if (member) {
        updated.pmCommissionPct = member.defaultCommissionPct;
        updated.pmCommissionAmount = updated.jobValue * (member.defaultCommissionPct / 100);
      }
    }

    if (field === 'subcontractorId') {
      const sub = subcontractors.find(s => s.id === value);
      updated.subcontractor = sub;
      if (sub) {
        updated.subcontractorPrice = updated.jobValue * (sub.defaultPayoutPct / 100);
      }
    }

    setEditedJob(updated);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!editedJob) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedJob),
      });

      if (!res.ok) throw new Error('Failed to save');

      const updatedJob = await res.json();
      setJob(updatedJob);
      setEditedJob(updatedJob);
      setHasChanges(false);
      toast.success('Alterações salvas com sucesso!');
    } catch {
      toast.error('Erro ao salvar alterações');
    } finally {
      setIsSaving(false);
    }
  };

  // Work Order functions
  const createWorkOrder = async () => {
    if (!job) return;

    setIsCreatingWO(true);
    try {
      const res = await fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          scheduledDate: job.scheduledStartDate,
          subcontractorPrice: job.subcontractorPrice,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Work order creation failed:', errorData);
        throw new Error(errorData.error || 'Failed to create');
      }

      const newWO = await res.json();
      setWorkOrders([newWO, ...workOrders]);
      setSelectedWorkOrder(newWO);
      setIsCreateOpen(true);
      toast.success('Ordem de Serviço criada!');
    } catch (err) {
      console.error('Error creating WO:', err);
      toast.error('Erro ao criar OS. Verifique se está logado corretamente.');
    } finally {
      setIsCreatingWO(false);
    }
  };

  const updateWorkOrder = async (woId: string, updates: Partial<WorkOrder>) => {
    try {
      const res = await fetch(`/api/work-orders/${woId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error('Failed to update');

      const updated = await res.json();
      setWorkOrders(workOrders.map(wo => wo.id === woId ? updated : wo));
      setSelectedWorkOrder(updated);
    } catch {
      toast.error('Erro ao atualizar OS');
      throw new Error('Failed to update');
    }
  };

  const deleteWorkOrder = async (woId: string) => {
    try {
      const res = await fetch(`/api/work-orders/${woId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      setWorkOrders(workOrders.filter(wo => wo.id !== woId));
      setIsDetailOpen(false);
      setDeleteWOId(null);
      toast.success('OS excluída');
    } catch {
      toast.error('Erro ao excluir OS');
    }
  };

  // Get the single work order for this job
  const workOrder = workOrders.length > 0 ? workOrders[0] : null;

  // Calculate progress for work order
  const getWOProgress = (wo: WorkOrder) => {
    const completedTasks = wo.tasks.filter(t => t.completed).length;
    const completedRooms = wo.rooms.filter(r => r.completed).length;
    const totalItems = wo.tasks.length + wo.rooms.length;
    const completedItems = completedTasks + completedRooms;
    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  };

  // Toggle task completion
  const toggleTask = async (taskId: string) => {
    if (!workOrder) return;
    const updatedTasks = workOrder.tasks.map(t =>
      t.id === taskId ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined } : t
    );
    await updateWorkOrder(workOrder.id, { tasks: updatedTasks });
  };

  // Toggle room completion
  const toggleRoom = async (roomId: string) => {
    if (!workOrder) return;
    const updatedRooms = workOrder.rooms.map(r =>
      r.id === roomId ? { ...r, completed: !r.completed } : r
    );
    await updateWorkOrder(workOrder.id, { rooms: updatedRooms });
  };

  // Add new room
  const addRoom = async () => {
    if (!workOrder || !newRoomName.trim()) return;
    const newRoom: WorkOrderRoom = {
      id: `room-${Date.now()}`,
      name: newRoomName.trim(),
      type: 'room',
      scope: ['Paredes'],
      completed: false,
    };
    await updateWorkOrder(workOrder.id, { rooms: [...workOrder.rooms, newRoom] });
    setNewRoomName('');
    setIsAddingRoom(false);
  };

  // Add new task
  const addTask = async () => {
    if (!workOrder || !newTaskDescription.trim()) return;
    const newTask: WorkOrderTask = {
      id: `task-${Date.now()}`,
      description: newTaskDescription.trim(),
      order: workOrder.tasks.length + 1,
      completed: false,
    };
    await updateWorkOrder(workOrder.id, { tasks: [...workOrder.tasks, newTask] });
    setNewTaskDescription('');
    setIsAddingTask(false);
  };

  // Remove task
  const removeTask = async (taskId: string) => {
    if (!workOrder) return;
    const updatedTasks = workOrder.tasks.filter(t => t.id !== taskId);
    await updateWorkOrder(workOrder.id, { tasks: updatedTasks });
  };

  // Remove room
  const removeRoom = async (roomId: string) => {
    if (!workOrder) return;
    const updatedRooms = workOrder.rooms.filter(r => r.id !== roomId);
    await updateWorkOrder(workOrder.id, { rooms: updatedRooms });
  };

  // Send OS to subcontractor
  const sendToSubcontractor = async () => {
    if (!workOrder) return;
    try {
      await updateWorkOrder(workOrder.id, { status: 'sent' });
      toast.success('OS enviada para o subcontratado!');
    } catch {
      toast.error('Erro ao enviar OS');
    }
  };

  // Copy public link
  const copyPublicLink = () => {
    if (!workOrder) return;
    const publicUrl = `${window.location.origin}/os/${workOrder.publicToken}`;
    navigator.clipboard.writeText(publicUrl);
    toast.success('Link copiado!');
  };

  // Save as template
  const handleSaveAsTemplate = async () => {
    if (!workOrder || !templateName.trim()) {
      toast.error('Nome do template é obrigatório');
      return;
    }

    setIsSavingTemplate(true);
    try {
      // Remove IDs and completed states from the data
      const roomsForTemplate = workOrder.rooms.map(({ id, completed, ...room }) => room);
      const tasksForTemplate = workOrder.tasks.map(({ id, completed, completedAt, completedBy, ...task }) => task);
      const materialsForTemplate = workOrder.materials.map(({ id, ...material }) => material);

      const res = await fetch('/api/os-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName.trim(),
          description: templateDescription.trim() || undefined,
          rooms: roomsForTemplate,
          tasks: tasksForTemplate,
          materials: materialsForTemplate,
          estimatedDuration: workOrder.estimatedDuration,
          isDefault: false,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao salvar template');
      }

      toast.success('Template salvo com sucesso!');
      setIsTemplateDialogOpen(false);
      setTemplateName('');
      setTemplateDescription('');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar template');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  // Payment management functions
  const paymentTypeLabels: Record<JobPaymentType, string> = {
    client_deposit: 'Depósito do Cliente',
    client_partial: 'Pagamento Parcial',
    client_final: 'Pagamento Final',
    sales_commission: 'Comissão Vendedor',
    pm_commission: 'Comissão PM',
    subcontractor: 'Subcontratado',
  };

  const getPaymentCategory = (type: JobPaymentType): 'income' | 'expense' => {
    if (type.startsWith('client_')) return 'income';
    return 'expense';
  };

  const initializeDefaultPayments = (job: Job): JobPayment[] => {
    const now = new Date().toISOString();
    const paymentsArray: JobPayment[] = [];

    // Ensure numeric values (Supabase may return strings)
    const jobValue = Number(job.jobValue) || 0;
    const depositRequired = Number(job.depositRequired) || 0;
    const salesCommissionAmount = Number(job.salesCommissionAmount) || 0;
    const pmCommissionAmount = Number(job.pmCommissionAmount) || 0;
    const subcontractorPrice = Number(job.subcontractorPrice) || 0;

    // Client deposit
    paymentsArray.push({
      id: crypto.randomUUID(),
      type: 'client_deposit',
      category: 'income',
      description: 'Depósito (30%)',
      amount: depositRequired,
      status: job.depositPaid ? 'paid' : 'pending',
      paidDate: job.depositPaymentDate,
      method: job.depositPaymentMethod as JobPayment['method'],
      createdAt: now,
    });

    // Client final payment
    paymentsArray.push({
      id: crypto.randomUUID(),
      type: 'client_final',
      category: 'income',
      description: 'Pagamento Final',
      amount: jobValue - depositRequired,
      status: job.jobPaid ? 'paid' : 'pending',
      paidDate: job.jobPaymentDate,
      method: job.jobPaymentMethod as JobPayment['method'],
      createdAt: now,
    });

    // Sales commission
    if (salesCommissionAmount > 0) {
      paymentsArray.push({
        id: crypto.randomUUID(),
        type: 'sales_commission',
        category: 'expense',
        description: `Comissão Vendedor (${job.salesCommissionPct}%)`,
        amount: salesCommissionAmount,
        status: job.salesCommissionPaid ? 'paid' : 'pending',
        recipientName: job.salesRep?.name,
        createdAt: now,
      });
    }

    // PM commission
    if (pmCommissionAmount > 0) {
      paymentsArray.push({
        id: crypto.randomUUID(),
        type: 'pm_commission',
        category: 'expense',
        description: `Comissão PM (${job.pmCommissionPct}%)`,
        amount: pmCommissionAmount,
        status: job.pmCommissionPaid ? 'paid' : 'pending',
        recipientName: job.projectManager?.name,
        createdAt: now,
      });
    }

    // Subcontractor
    if (subcontractorPrice > 0) {
      paymentsArray.push({
        id: crypto.randomUUID(),
        type: 'subcontractor',
        category: 'expense',
        description: 'Pagamento Subcontratado',
        amount: subcontractorPrice,
        status: job.subcontractorPaid ? 'paid' : 'pending',
        recipientName: job.subcontractor?.name,
        createdAt: now,
      });
    }

    return paymentsArray;
  };

  // Calculate payments - will be called after we know editedJob exists
  const getPaymentStats = () => {
    if (!editedJob) return { payments: [], incomePayments: [], expensePayments: [], totalReceived: 0, totalPending: 0, totalExpensesPaid: 0, totalExpensesPending: 0 };

    const paymentsArray = editedJob.payments || initializeDefaultPayments(editedJob);
    const income = paymentsArray.filter(p => p.category === 'income');
    const expense = paymentsArray.filter(p => p.category === 'expense');

    return {
      payments: paymentsArray,
      incomePayments: income,
      expensePayments: expense,
      // Use Number() to handle string amounts from database
      totalReceived: income.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0),
      totalPending: income.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0),
      totalExpensesPaid: expense.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0),
      totalExpensesPending: expense.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0),
    };
  };

  const { payments, incomePayments, expensePayments, totalReceived, totalPending, totalExpensesPaid, totalExpensesPending } = getPaymentStats();

  const openPaymentDialog = (payment?: JobPayment) => {
    if (payment) {
      setEditingPayment(payment);
      setPaymentForm({ ...payment });
    } else {
      setEditingPayment(null);
      setPaymentForm({
        type: 'client_partial',
        category: 'income',
        description: '',
        amount: 0,
        status: 'pending',
      });
    }
    setIsPaymentDialogOpen(true);
  };

  const savePayment = () => {
    if (!paymentForm.description || !paymentForm.amount) {
      toast.error('Preencha descrição e valor');
      return;
    }

    const newPayment: JobPayment = {
      id: editingPayment?.id || crypto.randomUUID(),
      type: paymentForm.type as JobPaymentType,
      category: getPaymentCategory(paymentForm.type as JobPaymentType),
      description: paymentForm.description || '',
      amount: paymentForm.amount || 0,
      dueDate: paymentForm.dueDate,
      status: paymentForm.status || 'pending',
      paidDate: paymentForm.paidDate,
      method: paymentForm.method,
      recipientName: paymentForm.recipientName,
      notes: paymentForm.notes,
      createdAt: editingPayment?.createdAt || new Date().toISOString(),
    };

    let updatedPayments: JobPayment[];
    if (editingPayment) {
      updatedPayments = payments.map(p => p.id === editingPayment.id ? newPayment : p);
    } else {
      updatedPayments = [...payments, newPayment];
    }

    handleFieldChange('payments', updatedPayments);
    setIsPaymentDialogOpen(false);
    toast.success(editingPayment ? 'Pagamento atualizado!' : 'Pagamento adicionado!');
  };

  const togglePaymentStatus = (paymentId: string) => {
    const updatedPayments = payments.map(p => {
      if (p.id === paymentId) {
        return {
          ...p,
          status: p.status === 'paid' ? 'pending' : 'paid',
          paidDate: p.status === 'pending' ? new Date().toISOString().split('T')[0] : undefined,
        } as JobPayment;
      }
      return p;
    });
    handleFieldChange('payments', updatedPayments);
  };

  const deletePayment = (paymentId: string) => {
    const updatedPayments = payments.filter(p => p.id !== paymentId);
    handleFieldChange('payments', updatedPayments);
    toast.success('Pagamento removido');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !job || !editedJob) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          {error || 'Trabalho não encontrado'}
        </h2>
        <Link href="/jobs">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Trabalhos
          </Button>
        </Link>
      </div>
    );
  }

  const salesReps = teamMembers.filter(m => m.role === 'sales' || m.role === 'both');
  const pms = teamMembers.filter(m => m.role === 'pm' || m.role === 'both');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/jobs">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                #{editedJob.jobNumber}
              </h1>
              <Badge className={statusColors[editedJob.status]}>
                {statusLabels[editedJob.status]}
              </Badge>
              <Badge variant="outline" className={getProfitFlagColor(editedJob.profitFlag)}>
                {editedJob.profitFlag}
              </Badge>
            </div>
            <p className="text-slate-500">{editedJob.clientName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Alterações
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="team-payments">Equipe & Pagamentos</TabsTrigger>
          <TabsTrigger value="work-orders">
            OS
            {workOrders.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {workOrders.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="media">Mídia</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="clientName">Nome do Cliente</Label>
                  <Input
                    id="clientName"
                    value={editedJob.clientName}
                    onChange={(e) => handleFieldChange('clientName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={editedJob.status}
                    onValueChange={(value) => handleFieldChange('status', value as JobStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="got_the_job">Fechado</SelectItem>
                      <SelectItem value="scheduled">Agendado</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={editedJob.address}
                    onChange={(e) => handleFieldChange('address', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={editedJob.city}
                      onChange={(e) => handleFieldChange('city', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      value={editedJob.state || ''}
                      onChange={(e) => handleFieldChange('state', e.target.value)}
                    />
                  </div>
                </div>
                <Button variant="link" className="px-0" asChild>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(
                      `${editedJob.address}, ${editedJob.city}, ${editedJob.state || ''} ${editedJob.zipCode || ''}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Ver no Google Maps
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Project Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Projeto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Tipo de Projeto</Label>
                  <Select
                    value={editedJob.projectType}
                    onValueChange={(value) => handleFieldChange('projectType', value as ProjectType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interior">Interior</SelectItem>
                      <SelectItem value="exterior">Exterior</SelectItem>
                      <SelectItem value="both">Interior + Exterior</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="jobValue">Valor do Trabalho (R$)</Label>
                  <Input
                    id="jobValue"
                    type="number"
                    value={editedJob.jobValue}
                    onChange={(e) => handleFieldChange('jobValue', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Datas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="jobDate">Data do Job</Label>
                    <Input
                      id="jobDate"
                      type="date"
                      value={editedJob.jobDate}
                      onChange={(e) => handleFieldChange('jobDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="scheduledStartDate">Início Agendado</Label>
                    <Input
                      id="scheduledStartDate"
                      type="date"
                      value={editedJob.scheduledStartDate}
                      onChange={(e) => handleFieldChange('scheduledStartDate', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="scheduledEndDate">Fim Agendado</Label>
                    <Input
                      id="scheduledEndDate"
                      type="date"
                      value={editedJob.scheduledEndDate}
                      onChange={(e) => handleFieldChange('scheduledEndDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="actualStartDate">Início Real</Label>
                    <Input
                      id="actualStartDate"
                      type="date"
                      value={editedJob.actualStartDate || ''}
                      onChange={(e) => handleFieldChange('actualStartDate', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Resumo Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Valor Total</p>
                  <p className="text-lg font-bold">{formatCurrency(editedJob.jobValue)}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Subcontratado</p>
                  <p className="text-lg font-bold">{formatCurrency(editedJob.subcontractorPrice)}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Lucro Bruto</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(editedJob.grossProfit)}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Margem</p>
                  <p className="text-lg font-bold">{editedJob.grossMarginPct}%</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Saldo Devedor</p>
                  <p className="text-lg font-bold text-orange-600">{formatCurrency(editedJob.balanceDue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team & Payments Tab - Unified */}
        <TabsContent value="team-payments" className="space-y-4 mt-4">
          {/* Team Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Equipe do Projeto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Sales Rep */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Vendedor</Label>
                  <Select
                    value={editedJob.salesRepId || ''}
                    onValueChange={(value) => handleFieldChange('salesRepId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {salesReps.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name} ({member.defaultCommissionPct}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {editedJob.salesRepId && (
                    <div className="flex items-center justify-between text-sm bg-blue-50 px-3 py-2 rounded">
                      <span className="text-blue-700">
                        Comissão: {editedJob.salesCommissionPct}%
                      </span>
                      <span className="font-semibold text-blue-800">
                        {formatCurrency(editedJob.salesCommissionAmount)}
                      </span>
                    </div>
                  )}
                </div>

                {/* PM */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Gerente de Projeto</Label>
                  <Select
                    value={editedJob.projectManagerId || ''}
                    onValueChange={(value) => handleFieldChange('projectManagerId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {pms.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name} ({member.defaultCommissionPct}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {editedJob.projectManagerId && (
                    <div className="flex items-center justify-between text-sm bg-purple-50 px-3 py-2 rounded">
                      <span className="text-purple-700">
                        Comissão: {editedJob.pmCommissionPct}%
                      </span>
                      <span className="font-semibold text-purple-800">
                        {formatCurrency(editedJob.pmCommissionAmount)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Subcontractor */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Subcontratado</Label>
                  <Select
                    value={editedJob.subcontractorId || ''}
                    onValueChange={(value) => handleFieldChange('subcontractorId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {subcontractors.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {sub.name} ({sub.defaultPayoutPct}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {editedJob.subcontractorId && (
                    <div className="flex items-center justify-between text-sm bg-orange-50 px-3 py-2 rounded">
                      <span className="text-orange-700">
                        Valor ({subcontractors.find(s => s.id === editedJob.subcontractorId)?.defaultPayoutPct || 60}%)
                      </span>
                      <span className="font-semibold text-orange-800">
                        {formatCurrency(editedJob.subcontractorPrice)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <p className="text-sm text-green-700">Valor Total</p>
                <p className="text-xl font-bold text-green-800">{formatCurrency(editedJob.jobValue)}</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <p className="text-sm text-blue-700">Recebido</p>
                <p className="text-xl font-bold text-blue-800">{formatCurrency(totalReceived)}</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4">
                <p className="text-sm text-orange-700">A Receber</p>
                <p className="text-xl font-bold text-orange-800">{formatCurrency(totalPending)}</p>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <p className="text-sm text-purple-700">Lucro Líquido</p>
                <p className="text-xl font-bold text-purple-800">
                  {formatCurrency(totalReceived - totalExpensesPaid)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Income Section - Client Payments */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Entradas (Pagamentos do Cliente)
                </CardTitle>
                <Button size="sm" onClick={() => openPaymentDialog()}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Pago</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Data Pago</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead className="w-20">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomePayments.map((payment) => (
                    <TableRow key={payment.id} className={payment.status === 'paid' ? 'bg-green-50' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={payment.status === 'paid'}
                          onCheckedChange={() => togglePaymentStatus(payment.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{payment.description}</TableCell>
                      <TableCell className="text-right font-semibold text-green-700">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>{payment.paidDate ? formatDate(payment.paidDate) : '-'}</TableCell>
                      <TableCell>
                        {payment.method ? payment.method.toUpperCase() : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openPaymentDialog(payment)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            onClick={() => deletePayment(payment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {incomePayments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-slate-400 py-8">
                        Nenhum pagamento do cliente
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="mt-3 flex justify-end gap-6 text-sm">
                <span className="text-slate-500">
                  Total Recebido: <span className="font-bold text-green-600">{formatCurrency(totalReceived)}</span>
                </span>
                <span className="text-slate-500">
                  Pendente: <span className="font-bold text-orange-600">{formatCurrency(totalPending)}</span>
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Expenses Section - Commissions & Subcontractor */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  Saídas (Comissões e Subcontratado)
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Pago</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Destinatário</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Data Pago</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead className="w-20">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expensePayments.map((payment) => (
                    <TableRow key={payment.id} className={payment.status === 'paid' ? 'bg-red-50' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={payment.status === 'paid'}
                          onCheckedChange={() => togglePaymentStatus(payment.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{payment.description}</TableCell>
                      <TableCell>{payment.recipientName || '-'}</TableCell>
                      <TableCell className="text-right font-semibold text-red-700">
                        -{formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>{payment.paidDate ? formatDate(payment.paidDate) : '-'}</TableCell>
                      <TableCell>
                        {payment.method ? payment.method.toUpperCase() : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openPaymentDialog(payment)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {expensePayments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                        Nenhuma saída registrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="mt-3 flex justify-end gap-6 text-sm">
                <span className="text-slate-500">
                  Total Pago: <span className="font-bold text-red-600">{formatCurrency(totalExpensesPaid)}</span>
                </span>
                <span className="text-slate-500">
                  Pendente: <span className="font-bold text-orange-600">{formatCurrency(totalExpensesPending)}</span>
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Net Summary */}
          <Card className="bg-slate-900 text-white">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-slate-400 text-sm">Resumo Financeiro</p>
                  <p className="text-2xl font-bold">
                    Lucro Líquido Atual: {formatCurrency(totalReceived - totalExpensesPaid)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">Projetado (quando tudo pago)</p>
                  <p className="text-xl font-semibold text-green-400">
                    {formatCurrency((totalReceived + totalPending) - (totalExpensesPaid + totalExpensesPending))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Work Orders Tab - Single OS Inline View */}
        <TabsContent value="work-orders" className="mt-4 space-y-4">
          {!workOrder ? (
            // No OS yet - show create button
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-800 mb-2">
                  Nenhuma Ordem de Serviço
                </h3>
                <p className="text-slate-500 mb-4">
                  Crie uma OS para detalhar o escopo do trabalho para o subcontratado
                </p>
                <Button onClick={createWorkOrder} disabled={isCreatingWO} size="lg">
                  {isCreatingWO ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Criar Ordem de Serviço
                </Button>
              </CardContent>
            </Card>
          ) : (
            // Single OS - Full inline view
            <>
              {/* Header with status and actions */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-bold">{workOrder.osNumber}</span>
                          <Badge className={WORK_ORDER_STATUS_COLORS[workOrder.status]}>
                            {WORK_ORDER_STATUS_LABELS[workOrder.status]}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                          {workOrder.rooms.length} cômodos • {workOrder.tasks.length} tarefas
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Progress */}
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{getWOProgress(workOrder)}%</p>
                        <Progress value={getWOProgress(workOrder)} className="w-32 h-2" />
                      </div>

                      {/* Value */}
                      <div className="text-right">
                        <p className="text-sm text-slate-500">Valor Subcontratado</p>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(workOrder.subcontractorPrice || 0)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {workOrder.status === 'draft' && (
                          <Button onClick={sendToSubcontractor} size="sm">
                            <Send className="h-4 w-4 mr-2" />
                            Enviar p/ Sub
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => setIsTemplateDialogOpen(true)}>
                          <Star className="h-4 w-4 mr-2" />
                          Salvar Template
                        </Button>
                        <Button variant="outline" size="sm" onClick={copyPublicLink}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar Link
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/os/${workOrder.publicToken}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Ver Público
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Basic Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Informações Básicas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm text-slate-500">Data Agendada</Label>
                      <p className="font-medium">{formatDate(workOrder.scheduledDate)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-500">Duração Estimada</Label>
                      <p className="font-medium">{workOrder.estimatedDuration || 8}h</p>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-500">Subcontratado</Label>
                      <p className="font-medium">{editedJob.subcontractor?.name || 'Não definido'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rooms/Areas */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Palette className="h-5 w-5 text-purple-600" />
                      Cômodos / Áreas ({workOrder.rooms.filter(r => r.completed).length}/{workOrder.rooms.length})
                    </CardTitle>
                    <Button size="sm" variant="outline" onClick={() => setIsAddingRoom(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {workOrder.rooms.length === 0 ? (
                    <p className="text-slate-400 text-center py-4">Nenhum cômodo adicionado</p>
                  ) : (
                    workOrder.rooms.map((room) => (
                      <div
                        key={room.id}
                        className={`p-3 rounded-lg border ${room.completed ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'} flex items-center justify-between group`}
                      >
                        <div className="flex items-center gap-3">
                          <button onClick={() => toggleRoom(room.id)} className="text-slate-400 hover:text-slate-600">
                            {room.completed ? (
                              <CheckSquare className="h-5 w-5 text-green-600" />
                            ) : (
                              <Square className="h-5 w-5" />
                            )}
                          </button>
                          <div>
                            <p className={`font-medium ${room.completed ? 'line-through text-slate-400' : ''}`}>
                              {room.name}
                            </p>
                            <p className="text-sm text-slate-500">
                              {room.scope?.join(', ')}
                              {room.color && ` • ${room.color}`}
                              {room.colorCode && ` (${room.colorCode})`}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                          onClick={() => removeRoom(room.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                  {isAddingRoom && (
                    <div className="flex gap-2 p-2 bg-slate-50 rounded-lg">
                      <Select value={newRoomName} onValueChange={setNewRoomName}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Selecione um cômodo..." />
                        </SelectTrigger>
                        <SelectContent>
                          {roomTypes.length > 0 ? (
                            roomTypes.map((roomType) => (
                              <SelectItem key={roomType.id} value={roomType.name}>
                                {roomType.name}
                                {roomType.description && (
                                  <span className="text-xs text-slate-400 ml-2">({roomType.description})</span>
                                )}
                              </SelectItem>
                            ))
                          ) : (
                            <>
                              <SelectItem value="Sala de Estar">Sala de Estar</SelectItem>
                              <SelectItem value="Quarto">Quarto</SelectItem>
                              <SelectItem value="Cozinha">Cozinha</SelectItem>
                              <SelectItem value="Banheiro">Banheiro</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      <Button size="sm" onClick={addRoom}>Adicionar</Button>
                      <Button size="sm" variant="ghost" onClick={() => setIsAddingRoom(false)}>Cancelar</Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tasks Checklist */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Checklist de Tarefas ({workOrder.tasks.filter(t => t.completed).length}/{workOrder.tasks.length})
                    </CardTitle>
                    <Button size="sm" variant="outline" onClick={() => setIsAddingTask(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  {workOrder.tasks.length === 0 ? (
                    <p className="text-slate-400 text-center py-4">Nenhuma tarefa adicionada</p>
                  ) : (
                    workOrder.tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-2 rounded flex items-center justify-between group hover:bg-slate-50 ${task.completed ? 'bg-green-50' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <button onClick={() => toggleTask(task.id)} className="text-slate-400 hover:text-slate-600">
                            {task.completed ? (
                              <CheckSquare className="h-5 w-5 text-green-600" />
                            ) : (
                              <Square className="h-5 w-5" />
                            )}
                          </button>
                          <span className={task.completed ? 'line-through text-slate-400' : ''}>
                            {task.description}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 h-7 w-7 text-red-500 hover:text-red-700"
                          onClick={() => removeTask(task.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  )}
                  {isAddingTask && (
                    <div className="flex gap-2 p-2 bg-slate-50 rounded-lg mt-2">
                      <Input
                        value={newTaskDescription}
                        onChange={(e) => setNewTaskDescription(e.target.value)}
                        placeholder="Descrição da tarefa..."
                        className="flex-1"
                        onKeyDown={(e) => e.key === 'Enter' && addTask()}
                      />
                      <Button size="sm" onClick={addTask}>Adicionar</Button>
                      <Button size="sm" variant="ghost" onClick={() => setIsAddingTask(false)}>Cancelar</Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Materials */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="h-5 w-5 text-orange-600" />
                      Materiais ({workOrder.materials?.length || 0})
                    </CardTitle>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedWorkOrder(workOrder);
                        setIsCreateOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {!workOrder.materials || workOrder.materials.length === 0 ? (
                    <p className="text-slate-400 text-center py-4">Nenhum material adicionado</p>
                  ) : (
                    <div className="space-y-2">
                      {workOrder.materials.map((material) => (
                        <div key={material.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                          <div>
                            <span className="font-medium">{material.quantity} {material.unit}</span>
                            <span className="mx-2">-</span>
                            <span>{material.name}</span>
                            {material.color && <span className="text-slate-500 ml-2">({material.color})</span>}
                          </div>
                          {material.provided && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">Cliente fornece</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Galeria de Fotos */}
              <Card>
                <CardContent className="pt-6">
                  <MediaGallery
                    items={(workOrder.photos || []).map((photo) => {
                      const isVideo = photo.url?.includes('.mp4') || photo.url?.includes('.mov') || photo.url?.includes('.webm');
                      return {
                        id: photo.id,
                        url: photo.url,
                        path: photo.path,
                        type: isVideo ? 'video' as const : photo.type,
                        caption: photo.caption,
                        uploadedAt: photo.uploadedAt,
                        uploadedBy: photo.uploadedBy === 'subcontractor' ? 'Subcontratado' : 'Empresa',
                      };
                    })}
                    canAdd={false}
                    title="Fotos do Trabalho"
                  />
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Notas e Observações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={editedJob.notes || ''}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                placeholder="Adicione notas sobre este trabalho..."
                rows={5}
                className="resize-none"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Camera className="h-5 w-5 text-blue-600" />
                Fotos do Trabalho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    Antes
                  </h4>
                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 min-h-[120px] flex items-center justify-center">
                    {editedJob.photos?.filter(p => p.type === 'before').length ? (
                      <div className="grid grid-cols-2 gap-2 w-full">
                        {editedJob.photos.filter(p => p.type === 'before').map((photo) => (
                          <div key={photo.id} className="relative aspect-video bg-slate-100 rounded overflow-hidden group">
                            <img src={photo.url} alt="Antes" className="w-full h-full object-cover" />
                            <button
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                const newPhotos = editedJob.photos?.filter(p => p.id !== photo.id);
                                handleFieldChange('photos', newPhotos);
                              }}
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

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Depois
                  </h4>
                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 min-h-[120px] flex items-center justify-center">
                    {editedJob.photos?.filter(p => p.type === 'after').length ? (
                      <div className="grid grid-cols-2 gap-2 w-full">
                        {editedJob.photos.filter(p => p.type === 'after').map((photo) => (
                          <div key={photo.id} className="relative aspect-video bg-slate-100 rounded overflow-hidden group">
                            <img src={photo.url} alt="Depois" className="w-full h-full object-cover" />
                            <button
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                const newPhotos = editedJob.photos?.filter(p => p.id !== photo.id);
                                handleFieldChange('photos', newPhotos);
                              }}
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Work Order Detail Dialog */}
      {selectedWorkOrder && (
        <WorkOrderDetail
          workOrder={selectedWorkOrder}
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          onUpdate={(updates) => updateWorkOrder(selectedWorkOrder.id, updates)}
          onDelete={() => setDeleteWOId(selectedWorkOrder.id)}
        />
      )}

      {/* Create Work Order Dialog */}
      {selectedWorkOrder && isCreateOpen && (
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Configurar {selectedWorkOrder.osNumber}</DialogTitle>
            </DialogHeader>
            <WorkOrderForm
              workOrder={selectedWorkOrder}
              onSave={async (updates) => {
                await updateWorkOrder(selectedWorkOrder.id, updates);
                setIsCreateOpen(false);
              }}
              onClose={() => setIsCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPayment ? 'Editar Pagamento' : 'Novo Pagamento'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <Select
                value={paymentForm.type}
                onValueChange={(value) => setPaymentForm({
                  ...paymentForm,
                  type: value as JobPaymentType,
                  category: getPaymentCategory(value as JobPaymentType),
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client_deposit">Depósito do Cliente</SelectItem>
                  <SelectItem value="client_partial">Pagamento Parcial</SelectItem>
                  <SelectItem value="client_final">Pagamento Final</SelectItem>
                  <SelectItem value="sales_commission">Comissão Vendedor</SelectItem>
                  <SelectItem value="pm_commission">Comissão PM</SelectItem>
                  <SelectItem value="subcontractor">Subcontratado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Descrição</Label>
              <Input
                value={paymentForm.description || ''}
                onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                placeholder="Ex: Depósito inicial"
              />
            </div>

            <div>
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                value={paymentForm.amount || ''}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
              />
            </div>

            {paymentForm.category === 'expense' && (
              <div>
                <Label>Destinatário</Label>
                <Input
                  value={paymentForm.recipientName || ''}
                  onChange={(e) => setPaymentForm({ ...paymentForm, recipientName: e.target.value })}
                  placeholder="Nome de quem recebe"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select
                  value={paymentForm.status}
                  onValueChange={(value) => setPaymentForm({
                    ...paymentForm,
                    status: value as 'pending' | 'paid',
                    paidDate: value === 'paid' ? new Date().toISOString().split('T')[0] : undefined,
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentForm.status === 'paid' && (
                <div>
                  <Label>Data do Pagamento</Label>
                  <Input
                    type="date"
                    value={paymentForm.paidDate || ''}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paidDate: e.target.value })}
                  />
                </div>
              )}
            </div>

            {paymentForm.status === 'paid' && (
              <div>
                <Label>Método de Pagamento</Label>
                <Select
                  value={paymentForm.method || ''}
                  onValueChange={(value) => setPaymentForm({ ...paymentForm, method: value as JobPayment['method'] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="check">Cheque</SelectItem>
                    <SelectItem value="credit_card">Cartão</SelectItem>
                    <SelectItem value="bank_transfer">Transferência</SelectItem>
                    <SelectItem value="venmo">Venmo</SelectItem>
                    <SelectItem value="zelle">Zelle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Notas (opcional)</Label>
              <Textarea
                value={paymentForm.notes || ''}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                placeholder="Observações sobre este pagamento..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={savePayment}>
                {editingPayment ? 'Salvar' : 'Adicionar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteWOId} onOpenChange={() => setDeleteWOId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Ordem de Serviço?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os dados da OS serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteWOId && deleteWorkOrder(deleteWOId)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Save as Template Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Salvar como Template
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-500">
              Salve a configuração atual desta OS como um template para reutilizar em futuros trabalhos.
            </p>
            <div className="space-y-2">
              <Label htmlFor="templateName">Nome do Template *</Label>
              <Input
                id="templateName"
                placeholder="Ex: Pintura Residencial Padrão"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="templateDescription">Descrição (opcional)</Label>
              <Textarea
                id="templateDescription"
                placeholder="Descrição do template..."
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                rows={2}
              />
            </div>
            {workOrder && (
              <div className="text-xs text-slate-400 bg-slate-50 p-3 rounded-lg">
                <p className="font-medium text-slate-600 mb-1">O que será salvo:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>{workOrder.rooms.length} cômodos</li>
                  <li>{workOrder.tasks.length} tarefas</li>
                  <li>{workOrder.materials.length} materiais</li>
                  {workOrder.estimatedDuration && <li>Duração: {workOrder.estimatedDuration}h</li>}
                </ul>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveAsTemplate} disabled={isSavingTemplate || !templateName.trim()}>
                {isSavingTemplate ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Star className="h-4 w-4 mr-2" />
                )}
                Salvar Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
