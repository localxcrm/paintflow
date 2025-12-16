'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  ExternalLink,
  Plus,
  Trash2,
  Loader2,
  RefreshCw,
  UserPlus,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  source: string;
  status: string;
  projectType: string;
  leadDate: string;
  nextFollowupDate: string | null;
  estimatedJobValue: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

const emptyLead: Partial<Lead> = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: 'CT',
  zipCode: '',
  source: 'Website',
  status: 'new',
  projectType: 'interior',
  notes: '',
};

const sourceColors: Record<string, string> = {
  Website: 'bg-blue-100 text-blue-800',
  Referral: 'bg-green-100 text-green-800',
  Google: 'bg-red-100 text-red-800',
  Yelp: 'bg-orange-100 text-orange-800',
  Facebook: 'bg-indigo-100 text-indigo-800',
  Other: 'bg-slate-100 text-slate-800',
};

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  qualified: 'bg-green-100 text-green-800',
  proposal_sent: 'bg-purple-100 text-purple-800',
  won: 'bg-emerald-100 text-emerald-800',
  lost: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  new: 'Novo',
  contacted: 'Contatado',
  qualified: 'Qualificado',
  proposal_sent: 'Proposta Enviada',
  won: 'Ganho',
  lost: 'Perdido',
};

const sourceOptions = ['Website', 'Referral', 'Google', 'Yelp', 'Facebook', 'Other'];
const statusOptions = ['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'];
const projectTypeOptions = ['interior', 'exterior', 'both', 'cabinet', 'deck', 'commercial'];

export default function LeadsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Lead>>(emptyLead);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch leads from API
  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      params.set('limit', '100');

      const response = await fetch(`/api/leads?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads || []);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleRowClick = (lead: Lead) => {
    setEditForm({ ...lead });
    setIsCreating(false);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditForm({ ...emptyLead });
    setIsCreating(true);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editForm.firstName || !editForm.lastName) return;

    setIsSaving(true);
    try {
      if (isCreating) {
        // Create new lead
        const response = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm),
        });
        if (response.ok) {
          await fetchLeads();
          setIsModalOpen(false);
        }
      } else {
        // Update existing lead
        const response = await fetch(`/api/leads/${editForm.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm),
        });
        if (response.ok) {
          await fetchLeads();
          setIsModalOpen(false);
        }
      }
    } catch (error) {
      console.error('Error saving lead:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (selectedLeads.size === 0) return;

    setIsDeleting(true);
    try {
      const response = await fetch('/api/leads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedLeads) }),
      });
      if (response.ok) {
        setSelectedLeads(new Set());
        await fetchLeads();
      }
    } catch (error) {
      console.error('Error deleting leads:', error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleDeleteSingle = async (id: string) => {
    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchLeads();
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const toggleSelectAll = () => {
    if (selectedLeads.size === leads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(leads.map(l => l.id)));
    }
  };

  const toggleSelectLead = (id: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedLeads(newSelected);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditForm(emptyLead);
    setIsCreating(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <p className="text-slate-500">
            {leads.length} leads cadastrados
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchLeads} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Atualizar
          </Button>
          <Button onClick={handleAddNew} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* Search and Bulk Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome, email, telefone ou cidade..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {selectedLeads.size > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">
              {selectedLeads.size} selecionado(s)
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Excluir Selecionados
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedLeads(new Set())}
            >
              Limpar Seleção
            </Button>
          </div>
        )}
      </div>

      {/* Leads Table */}
      <Card>
        {isLoading && leads.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={leads.length > 0 && selectedLeads.size === leads.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <User className="h-12 w-12 text-slate-300" />
                      <p className="text-slate-500">Nenhum lead encontrado</p>
                      <Button variant="outline" size="sm" onClick={handleAddNew}>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar primeiro lead
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className={cn(
                      "cursor-pointer hover:bg-slate-50",
                      selectedLeads.has(lead.id) && "bg-blue-50"
                    )}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedLeads.has(lead.id)}
                        onCheckedChange={() => toggleSelectLead(lead.id)}
                      />
                    </TableCell>
                    <TableCell onClick={() => handleRowClick(lead)}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {lead.firstName} {lead.lastName}
                          </p>
                          {lead.email && (
                            <p className="text-sm text-slate-500 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {lead.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell onClick={() => handleRowClick(lead)}>
                      {lead.phone ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell onClick={() => handleRowClick(lead)}>
                      {lead.city ? (
                        <>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {lead.city}, {lead.state}
                          </div>
                          {lead.address && (
                            <p className="text-xs text-slate-400">{lead.address}</p>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell onClick={() => handleRowClick(lead)}>
                      <Badge
                        variant="secondary"
                        className={sourceColors[lead.source] || 'bg-slate-100 text-slate-800'}
                      >
                        {lead.source}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={() => handleRowClick(lead)}>
                      <Badge
                        variant="secondary"
                        className={statusColors[lead.status] || 'bg-slate-100 text-slate-800'}
                      >
                        {statusLabels[lead.status] || lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={() => handleRowClick(lead)}>
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <Calendar className="h-3 w-3" />
                        {format(parseISO(lead.leadDate || lead.createdAt), 'dd/MM/yyyy')}
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {lead.phone && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            asChild
                          >
                            <a href={`tel:${lead.phone}`}>
                              <Phone className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {lead.email && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            asChild
                          >
                            <a href={`mailto:${lead.email}`}>
                              <Mail className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          asChild
                        >
                          <a href={`/estimates/new?leadId=${lead.id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja excluir {selectedLeads.size} lead(s)?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add/Edit Lead Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {isCreating ? 'Novo Lead' : 'Editar Lead'}
            </DialogTitle>
            <DialogDescription>
              {isCreating
                ? 'Preencha as informações do novo lead'
                : 'Atualize as informações do lead'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="firstName">Nome *</Label>
                <Input
                  id="firstName"
                  value={editForm.firstName || ''}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  placeholder="Nome"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lastName">Sobrenome *</Label>
                <Input
                  id="lastName"
                  value={editForm.lastName || ''}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  placeholder="Sobrenome"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email || ''}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={editForm.phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={editForm.address || ''}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="Rua, número"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={editForm.city || ''}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    placeholder="Cidade"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={editForm.state || ''}
                    onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                    placeholder="UF"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="zipCode">CEP</Label>
                  <Input
                    id="zipCode"
                    value={editForm.zipCode || ''}
                    onChange={(e) => setEditForm({ ...editForm, zipCode: e.target.value })}
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </div>

            {/* Source, Status, Project Type */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="source">Origem</Label>
                <Select
                  value={editForm.source || 'Website'}
                  onValueChange={(value) => setEditForm({ ...editForm, source: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceOptions.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editForm.status || 'new'}
                  onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusLabels[status] || status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="projectType">Tipo de Projeto</Label>
                <Select
                  value={editForm.projectType || 'interior'}
                  onValueChange={(value) => setEditForm({ ...editForm, projectType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {projectTypeOptions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Estimated Value */}
            <div className="space-y-1">
              <Label htmlFor="estimatedJobValue">Valor Estimado (R$)</Label>
              <Input
                id="estimatedJobValue"
                type="number"
                value={editForm.estimatedJobValue || ''}
                onChange={(e) => setEditForm({ ...editForm, estimatedJobValue: e.target.value ? Number(e.target.value) : null })}
                placeholder="0.00"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={editForm.notes || ''}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3}
                placeholder="Adicione observações sobre o lead..."
              />
            </div>

            {/* Date Added (read-only for existing leads) */}
            {!isCreating && editForm.createdAt && (
              <div className="text-xs text-slate-500">
                Criado em {format(parseISO(editForm.createdAt), "dd/MM/yyyy 'às' HH:mm")}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap justify-between gap-2 pt-3 border-t">
              {!isCreating && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => editForm.id && handleDeleteSingle(editForm.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Lead
                </Button>
              )}
              <div className={cn("flex gap-2", isCreating && "ml-auto")}>
                <Button variant="outline" size="sm" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || !editForm.firstName || !editForm.lastName}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
