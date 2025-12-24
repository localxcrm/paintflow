'use client';

import { useState } from 'react';
import { mockRoomPrices, mockBusinessSettings } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { ChatPanel } from '@/components/estimates/ai-assistant';
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Save,
  Send,
  Bot,
  Eye,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Scope, EstimateLineItem } from '@/types';

interface LineItem {
  id: string;
  roomType: string;
  size: string;
  location: string;
  description: string;
  scope: Scope;
  basePrice: number;
  adjustedPrice: number;
}

interface RiskModifier {
  id: string;
  name: string;
  adjustmentPct: number;
  selected: boolean;
}

const defaultRiskModifiers: RiskModifier[] = [
  { id: '1', name: 'High Ceilings (>10ft)', adjustmentPct: 15, selected: false },
  { id: '2', name: 'Dark to Light Color Change', adjustmentPct: 10, selected: false },
  { id: '3', name: 'Occupied / Heavy Furniture', adjustmentPct: 10, selected: false },
  { id: '4', name: 'Repairs Beyond Minor', adjustmentPct: 15, selected: false },
  { id: '5', name: 'Difficult Access', adjustmentPct: 10, selected: false },
  { id: '6', name: 'Wallpaper Removal', adjustmentPct: 20, selected: false },
];

const scopeLabels: Record<Scope, string> = {
  walls_only: 'Walls Only',
  walls_trim: 'Walls + Trim',
  walls_trim_ceiling: 'Walls + Trim + Ceiling',
  full_refresh: 'Full Refresh',
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function NewEstimatePage() {
  const [clientInfo, setClientInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: 'CT',
    zipCode: '',
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [riskModifiers, setRiskModifiers] = useState(defaultRiskModifiers);
  const [discount, setDiscount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [notes, setNotes] = useState('');

  // Room selection state
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedScope, setSelectedScope] = useState<Scope>('walls_trim');
  const [locationName, setLocationName] = useState('');
  const [itemDescription, setItemDescription] = useState('');

  // Get unique room types
  const roomTypes = [...new Set(mockRoomPrices.map((r) => r.roomType))];

  // Get sizes for selected room
  const availableSizes = mockRoomPrices
    .filter((r) => r.roomType === selectedRoom)
    .map((r) => r.size);

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.adjustedPrice, 0);
  const riskAdjustmentPct = riskModifiers
    .filter((m) => m.selected)
    .reduce((sum, m) => sum + m.adjustmentPct, 0);
  const riskAdjustmentAmount = subtotal * (riskAdjustmentPct / 100);
  const totalBeforeDiscount = subtotal + riskAdjustmentAmount;
  const discountAmount = totalBeforeDiscount * (discount / 100);
  const totalPrice = totalBeforeDiscount - discountAmount;

  // Calculate costs and profits
  const settings = mockBusinessSettings;
  const subTotal = totalPrice * (settings.subPayoutPct / 100);
  const grossProfit = totalPrice - subTotal;
  const grossMarginPct = totalPrice > 0 ? (grossProfit / totalPrice) * 100 : 0;

  // Guardrails
  const meetsMinGp = grossProfit >= settings.minGrossProfitPerJob;
  const meetsTargetGm = grossMarginPct >= settings.targetGrossMarginPct;

  const addLineItem = () => {
    if (!selectedRoom || !selectedSize || !selectedScope) return;

    const roomPrice = mockRoomPrices.find(
      (r) => r.roomType === selectedRoom && r.size === selectedSize
    );
    if (!roomPrice) return;

    const scopePrices: Record<Scope, number> = {
      walls_only: roomPrice.wallsOnly,
      walls_trim: roomPrice.wallsTrim,
      walls_trim_ceiling: roomPrice.wallsTrimCeiling,
      full_refresh: roomPrice.fullRefresh,
    };

    const basePrice = scopePrices[selectedScope];
    const defaultDescription = `${selectedSize} ${selectedRoom} - ${scopeLabels[selectedScope]}`;

    const newItem: LineItem = {
      id: Date.now().toString(),
      roomType: selectedRoom,
      size: selectedSize,
      location: locationName || `${selectedRoom} ${lineItems.filter(i => i.roomType === selectedRoom).length + 1}`,
      description: itemDescription || defaultDescription,
      scope: selectedScope,
      basePrice,
      adjustedPrice: basePrice,
    };

    setLineItems([...lineItems, newItem]);
    setLocationName('');
    setItemDescription('');
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const updateItemDescription = (id: string, description: string) => {
    setLineItems(lineItems.map(item =>
      item.id === id ? { ...item, description } : item
    ));
  };

  const toggleRiskModifier = (id: string) => {
    setRiskModifiers(
      riskModifiers.map((m) =>
        m.id === id ? { ...m, selected: !m.selected } : m
      )
    );
  };

  // Handle AI suggestions
  const handleApplyLineItems = (items: EstimateLineItem[]) => {
    const newItems: LineItem[] = items.map((item, idx) => ({
      id: `ai-${Date.now()}-${idx}`,
      roomType: item.description.split(' - ')[0].replace('Medium ', '').replace('Small ', '').replace('Large ', ''),
      size: item.description.includes('Medium') ? 'Medium' : item.description.includes('Small') ? 'Small' : 'Large',
      location: item.location,
      description: item.description,
      scope: item.scope || 'walls_trim',
      basePrice: item.unitPrice,
      adjustedPrice: item.unitPrice,
    }));
    setLineItems([...lineItems, ...newItems]);
  };

  const handleApplyRiskModifiers = (modifierNames: string[]) => {
    setRiskModifiers(
      riskModifiers.map((m) => ({
        ...m,
        selected: modifierNames.includes(m.name) ? true : m.selected,
      }))
    );
  };

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const validUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Link href="/estimates">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              New Estimate
              <Badge variant="secondary" className="gap-1">
                <Bot className="h-3 w-3" />
                AI Assisted
              </Badge>
            </h1>
            <p className="text-slate-500">Describe the job or manually add rooms</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button variant="outline" className="gap-2">
            <Save className="h-4 w-4" />
            Save Draft
          </Button>
          <Button className="gap-2">
            <Send className="h-4 w-4" />
            Send to Client
          </Button>
        </div>
      </div>

      {/* Split Screen Layout */}
      <div className="grid grid-cols-5 gap-4 h-[calc(100%-60px)]">
        {/* Left: AI Assistant (40%) */}
        <div className="col-span-2 h-full">
          <ChatPanel
            onApplyLineItems={handleApplyLineItems}
            onApplyRiskModifiers={handleApplyRiskModifiers}
          />
        </div>

        {/* Right: Estimate Form (60%) */}
        <div className="col-span-3 space-y-4 overflow-y-auto pr-2">
          {/* Client Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="First Name"
                  value={clientInfo.firstName}
                  onChange={(e) => setClientInfo({ ...clientInfo, firstName: e.target.value })}
                />
                <Input
                  placeholder="Last Name"
                  value={clientInfo.lastName}
                  onChange={(e) => setClientInfo({ ...clientInfo, lastName: e.target.value })}
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={clientInfo.email}
                  onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
                />
                <Input
                  placeholder="Phone"
                  value={clientInfo.phone}
                  onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })}
                />
              </div>
              <Input
                placeholder="Street Address"
                value={clientInfo.address}
                onChange={(e) => setClientInfo({ ...clientInfo, address: e.target.value })}
              />
              <div className="grid grid-cols-3 gap-3">
                <Input
                  placeholder="City"
                  value={clientInfo.city}
                  onChange={(e) => setClientInfo({ ...clientInfo, city: e.target.value })}
                />
                <Input placeholder="State" value={clientInfo.state} disabled />
                <Input
                  placeholder="ZIP"
                  value={clientInfo.zipCode}
                  onChange={(e) => setClientInfo({ ...clientInfo, zipCode: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Add Room Manually */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Add Rooms Manually</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-4 gap-2">
                <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                  <SelectTrigger>
                    <SelectValue placeholder="Room Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.map((room) => (
                      <SelectItem key={room} value={room}>{room}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedSize} onValueChange={setSelectedSize} disabled={!selectedRoom}>
                  <SelectTrigger>
                    <SelectValue placeholder="Size" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSizes.map((size) => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedScope} onValueChange={(v) => setSelectedScope(v as Scope)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walls_only">Walls Only</SelectItem>
                    <SelectItem value="walls_trim">Walls + Trim</SelectItem>
                    <SelectItem value="walls_trim_ceiling">+ Ceiling</SelectItem>
                    <SelectItem value="full_refresh">Full Refresh</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Location (e.g. Master)"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Description (optional - auto-generated if empty)"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={addLineItem} className="gap-1">
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Line Items ({lineItems.length})</CardTitle>
                <span className="font-bold text-blue-600">{formatCurrency(subtotal)}</span>
              </div>
            </CardHeader>
            <CardContent>
              {lineItems.length === 0 ? (
                <p className="text-center text-slate-400 py-6">
                  No items yet. Use AI assistant or add manually above.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Location</TableHead>
                      <TableHead className="w-[300px]">Description</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.location}</TableCell>
                        <TableCell>
                          <Input
                            value={item.description}
                            onChange={(e) => updateItemDescription(item.id, e.target.value)}
                            className="h-8 text-sm"
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.basePrice)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => removeLineItem(item.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Risk Modifiers & Discount */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Adjustments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {riskModifiers.map((modifier) => (
                  <div
                    key={modifier.id}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors',
                      modifier.selected ? 'bg-amber-50 border-amber-200' : 'hover:bg-slate-50'
                    )}
                    onClick={() => toggleRiskModifier(modifier.id)}
                  >
                    <Checkbox checked={modifier.selected} />
                    <span className="text-sm">{modifier.name}</span>
                    <Badge variant="outline" className="ml-auto text-xs">+{modifier.adjustmentPct}%</Badge>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4">
                <Label>Discount %</Label>
                <Input
                  type="number"
                  min={0}
                  max={20}
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-20"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Internal Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add any internal notes about this estimate..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-slate-50">
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {riskAdjustmentPct > 0 && (
                    <div className="flex justify-between text-sm text-amber-600">
                      <span>Risk (+{riskAdjustmentPct}%)</span>
                      <span>{formatCurrency(riskAdjustmentAmount)}</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount (-{discount}%)</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-blue-600">{formatCurrency(totalPrice)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Gross Profit</span>
                    <span className="text-green-600 font-medium">{formatCurrency(grossProfit)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Gross Margin</span>
                    <span className={cn('font-medium', grossMarginPct >= 40 ? 'text-green-600' : 'text-amber-600')}>
                      {grossMarginPct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <div className={cn('flex items-center gap-1 px-2 py-1 rounded text-xs', meetsMinGp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                      {meetsMinGp ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                      Min GP
                    </div>
                    <div className={cn('flex items-center gap-1 px-2 py-1 rounded text-xs', meetsTargetGm ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                      {meetsTargetGm ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                      Target GM
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Estimate Preview</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Building2 className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-xl text-slate-900">CMD Painting</h2>
                  <p className="text-sm text-slate-500">Premium Residential Painting</p>
                </div>
              </div>
              <div className="text-right text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="h-4 w-4" />
                  (203) 555-0100
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="h-4 w-4" />
                  info@cmdpainting.com
                </div>
              </div>
            </div>

            {/* Estimate Info */}
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">Estimate #EST-2024-XXX</h3>
                  <p className="text-slate-600">
                    Prepared for: <span className="font-medium">
                      {clientInfo.firstName || 'Client'} {clientInfo.lastName || 'Name'}
                    </span>
                  </p>
                </div>
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                  Draft
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>{clientInfo.address || '123 Main St'}, {clientInfo.city || 'City'}, {clientInfo.state} {clientInfo.zipCode || '00000'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>{today}</span>
                  </div>
                  <div className="flex items-center gap-2 text-orange-600">
                    <FileText className="h-4 w-4" />
                    <span>Valid until {validUntil}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scope of Work */}
            <div>
              <h4 className="font-semibold mb-3">Scope of Work</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-slate-400 py-8">
                        No items added yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    lineItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.description}</TableCell>
                        <TableCell className="text-slate-600">{item.location}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.basePrice)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-72 space-y-2 bg-slate-50 rounded-lg p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {riskAdjustmentPct > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Job Complexity Adjustment</span>
                    <span>{formatCurrency(riskAdjustmentAmount)}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount ({discount}%)</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-blue-600">{formatCurrency(totalPrice)}</span>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="border-t pt-4 text-center text-sm text-slate-500">
              <p>This estimate is valid for 14 days from the date of issue.</p>
              <p className="mt-1">Payment terms: 30% deposit to schedule, 40% on start, 30% on completion.</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
            <Button className="gap-2">
              <Send className="h-4 w-4" />
              Send to Client
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
