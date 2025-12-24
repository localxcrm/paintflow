'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus,
  Trash2,
  Home,
  CheckSquare,
  Package,
  Save,
  Loader2,
  GripVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  WorkOrder,
  WorkOrderRoom,
  WorkOrderTask,
  WorkOrderMaterial,
  DEFAULT_PAINTING_TASKS,
  COMMON_ROOMS,
  COMMON_SCOPE_ITEMS,
  ROOM_TYPE_LABELS,
} from '@/types/work-order';

interface WorkOrderFormProps {
  workOrder: WorkOrder;
  onSave: (updates: Partial<WorkOrder>) => Promise<void>;
  onClose: () => void;
}

export function WorkOrderForm({ workOrder, onSave, onClose }: WorkOrderFormProps) {
  const [rooms, setRooms] = useState<WorkOrderRoom[]>(workOrder.rooms || []);
  const [tasks, setTasks] = useState<WorkOrderTask[]>(
    workOrder.tasks.length > 0
      ? workOrder.tasks
      : DEFAULT_PAINTING_TASKS.map((t, i) => ({ ...t, id: `task-${Date.now()}-${i}` }))
  );
  const [materials, setMaterials] = useState<WorkOrderMaterial[]>(workOrder.materials || []);
  const [isSaving, setIsSaving] = useState(false);
  const [estimatedDuration, setEstimatedDuration] = useState(workOrder.estimatedDuration || 8);
  const [subcontractorPrice, setSubcontractorPrice] = useState(workOrder.subcontractorPrice || 0);

  // Room dialog
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<WorkOrderRoom | null>(null);
  const [roomForm, setRoomForm] = useState({
    name: '',
    type: 'room' as 'room' | 'area' | 'exterior',
    scope: [] as string[],
    color: '',
    colorCode: '',
    notes: '',
  });

  // Material dialog
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [materialForm, setMaterialForm] = useState({
    name: '',
    quantity: 1,
    unit: 'galões',
    color: '',
    colorCode: '',
    provided: false,
  });

  // Task dialog
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [newTaskDescription, setNewTaskDescription] = useState('');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        rooms,
        tasks,
        materials,
        estimatedDuration,
        subcontractorPrice,
      });
      toast.success('Ordem de serviço salva!');
      onClose();
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  // Room handlers
  const openAddRoom = () => {
    setEditingRoom(null);
    setRoomForm({
      name: '',
      type: 'room',
      scope: [],
      color: '',
      colorCode: '',
      notes: '',
    });
    setRoomDialogOpen(true);
  };

  const openEditRoom = (room: WorkOrderRoom) => {
    setEditingRoom(room);
    setRoomForm({
      name: room.name,
      type: room.type,
      scope: room.scope,
      color: room.color || '',
      colorCode: room.colorCode || '',
      notes: room.notes || '',
    });
    setRoomDialogOpen(true);
  };

  const saveRoom = () => {
    if (!roomForm.name.trim()) {
      toast.error('Nome do cômodo é obrigatório');
      return;
    }

    if (editingRoom) {
      setRooms(rooms.map(r =>
        r.id === editingRoom.id
          ? { ...r, ...roomForm }
          : r
      ));
    } else {
      const newRoom: WorkOrderRoom = {
        id: `room-${Date.now()}`,
        ...roomForm,
        completed: false,
      };
      setRooms([...rooms, newRoom]);
    }
    setRoomDialogOpen(false);
  };

  const removeRoom = (roomId: string) => {
    setRooms(rooms.filter(r => r.id !== roomId));
  };

  const toggleScopeItem = (item: string) => {
    if (roomForm.scope.includes(item)) {
      setRoomForm({ ...roomForm, scope: roomForm.scope.filter(s => s !== item) });
    } else {
      setRoomForm({ ...roomForm, scope: [...roomForm.scope, item] });
    }
  };

  // Task handlers
  const addTask = () => {
    if (!newTaskDescription.trim()) return;

    const newTask: WorkOrderTask = {
      id: `task-${Date.now()}`,
      description: newTaskDescription.trim(),
      order: tasks.length + 1,
      completed: false,
    };
    setTasks([...tasks, newTask]);
    setNewTaskDescription('');
    setTaskDialogOpen(false);
  };

  const removeTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  // Material handlers
  const saveMaterial = () => {
    if (!materialForm.name.trim()) {
      toast.error('Nome do material é obrigatório');
      return;
    }

    const newMaterial: WorkOrderMaterial = {
      id: `material-${Date.now()}`,
      ...materialForm,
    };
    setMaterials([...materials, newMaterial]);
    setMaterialForm({
      name: '',
      quantity: 1,
      unit: 'galões',
      color: '',
      colorCode: '',
      provided: false,
    });
    setMaterialDialogOpen(false);
  };

  const removeMaterial = (materialId: string) => {
    setMaterials(materials.filter(m => m.id !== materialId));
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Duração Estimada (horas)</Label>
          <Input
            type="number"
            value={estimatedDuration}
            onChange={(e) => setEstimatedDuration(Number(e.target.value))}
            min={1}
          />
        </div>
        <div>
          <Label>Valor Subcontratado (R$)</Label>
          <Input
            type="number"
            value={subcontractorPrice}
            onChange={(e) => setSubcontractorPrice(Number(e.target.value))}
            min={0}
            step={100}
          />
        </div>
      </div>

      {/* Rooms */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Home className="h-5 w-5 text-blue-600" />
              Cômodos / Áreas
            </CardTitle>
            <Button variant="outline" size="sm" onClick={openAddRoom}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {rooms.length === 0 ? (
            <div className="text-center py-4 text-slate-400 text-sm">
              Nenhum cômodo adicionado
            </div>
          ) : (
            <div className="space-y-2">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                  onClick={() => openEditRoom(room)}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{room.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {ROOM_TYPE_LABELS[room.type]}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      {room.scope.join(' • ')}
                    </p>
                    {room.color && (
                      <p className="text-xs text-blue-600 mt-1">
                        🎨 {room.color} {room.colorCode && `(${room.colorCode})`}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRoom(room.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-blue-600" />
              Checklist
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setTaskDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-1">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded"
              >
                <GripVertical className="h-4 w-4 text-slate-300" />
                <span className="flex-1 text-sm">{task.description}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeTask(task.id)}
                >
                  <Trash2 className="h-3 w-3 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Materials */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Materiais
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setMaterialDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {materials.length === 0 ? (
            <div className="text-center py-4 text-slate-400 text-sm">
              Nenhum material adicionado
            </div>
          ) : (
            <div className="space-y-2">
              {materials.map((material) => (
                <div
                  key={material.id}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div className="text-sm">
                    <span className="font-medium">
                      {material.quantity} {material.unit}
                    </span>
                    {' - '}
                    <span>{material.name}</span>
                    {material.color && (
                      <span className="text-blue-600">
                        {' '}({material.color}{material.colorCode ? ` - ${material.colorCode}` : ''})
                      </span>
                    )}
                    {material.provided && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Cliente
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeMaterial(material.id)}
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar OS
            </>
          )}
        </Button>
      </div>

      {/* Room Dialog */}
      <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRoom ? 'Editar Cômodo' : 'Adicionar Cômodo'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nome do Cômodo</Label>
              <Select
                value={COMMON_ROOMS.includes(roomForm.name) ? roomForm.name : 'custom'}
                onValueChange={(val) => {
                  if (val !== 'custom') {
                    setRoomForm({ ...roomForm, name: val });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione ou digite" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_ROOMS.map((room) => (
                    <SelectItem key={room} value={room}>
                      {room}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Outro...</SelectItem>
                </SelectContent>
              </Select>
              {!COMMON_ROOMS.includes(roomForm.name) && (
                <Input
                  className="mt-2"
                  placeholder="Nome personalizado"
                  value={roomForm.name}
                  onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                />
              )}
            </div>

            <div>
              <Label>Tipo</Label>
              <Select
                value={roomForm.type}
                onValueChange={(val) => setRoomForm({ ...roomForm, type: val as 'room' | 'area' | 'exterior' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="room">Cômodo</SelectItem>
                  <SelectItem value="area">Área</SelectItem>
                  <SelectItem value="exterior">Exterior</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Escopo (o que será pintado)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {COMMON_SCOPE_ITEMS.map((item) => (
                  <Badge
                    key={item}
                    variant={roomForm.scope.includes(item) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleScopeItem(item)}
                  >
                    {item}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Cor da Tinta</Label>
                <Input
                  placeholder="Ex: Extra White"
                  value={roomForm.color}
                  onChange={(e) => setRoomForm({ ...roomForm, color: e.target.value })}
                />
              </div>
              <div>
                <Label>Código</Label>
                <Input
                  placeholder="Ex: SW7006"
                  value={roomForm.colorCode}
                  onChange={(e) => setRoomForm({ ...roomForm, colorCode: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                placeholder="Instruções especiais para este cômodo..."
                value={roomForm.notes}
                onChange={(e) => setRoomForm({ ...roomForm, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRoomDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveRoom}>
              {editingRoom ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Tarefa</DialogTitle>
          </DialogHeader>

          <div>
            <Label>Descrição da Tarefa</Label>
            <Input
              placeholder="Ex: Aplicar segunda demão"
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={addTask} disabled={!newTaskDescription.trim()}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Material Dialog */}
      <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Material</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Material</Label>
              <Input
                placeholder="Ex: Tinta Sherwin Williams"
                value={materialForm.name}
                onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  value={materialForm.quantity}
                  onChange={(e) => setMaterialForm({ ...materialForm, quantity: Number(e.target.value) })}
                  min={1}
                />
              </div>
              <div>
                <Label>Unidade</Label>
                <Select
                  value={materialForm.unit}
                  onValueChange={(val) => setMaterialForm({ ...materialForm, unit: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="galões">Galões</SelectItem>
                    <SelectItem value="latas">Latas</SelectItem>
                    <SelectItem value="litros">Litros</SelectItem>
                    <SelectItem value="unidades">Unidades</SelectItem>
                    <SelectItem value="rolos">Rolos</SelectItem>
                    <SelectItem value="metros">Metros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Cor</Label>
                <Input
                  placeholder="Ex: Extra White"
                  value={materialForm.color}
                  onChange={(e) => setMaterialForm({ ...materialForm, color: e.target.value })}
                />
              </div>
              <div>
                <Label>Código</Label>
                <Input
                  placeholder="Ex: SW7006"
                  value={materialForm.colorCode}
                  onChange={(e) => setMaterialForm({ ...materialForm, colorCode: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={materialForm.provided}
                onCheckedChange={(checked) =>
                  setMaterialForm({ ...materialForm, provided: checked as boolean })
                }
              />
              <Label className="font-normal">Cliente fornece este material</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMaterialDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveMaterial} disabled={!materialForm.name.trim()}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
