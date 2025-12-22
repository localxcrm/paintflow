'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, DollarSign, Building2, Users, Car, Trash2, Edit2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const CATEGORIES = [
  { value: 'owner_salary', label: 'Owner Salary', icon: Users },
  { value: 'production_salary', label: 'Production Salary', icon: Users },
  { value: 'sales_salary', label: 'Sales Salary', icon: Users },
  { value: 'admin_salary', label: 'Admin Salary', icon: Users },
  { value: 'rent', label: 'Rent/Lease', icon: Building2 },
  { value: 'utilities', label: 'Utilities', icon: Building2 },
  { value: 'insurance', label: 'Insurance', icon: Building2 },
  { value: 'software', label: 'Software/Tools', icon: Building2 },
  { value: 'vehicles', label: 'Vehicles', icon: Car },
  { value: 'equipment', label: 'Equipment', icon: Car },
  { value: 'other', label: 'Other', icon: Building2 },
];

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
}

interface OverheadExpense {
  id: string;
  category: string;
  name: string;
  amount: number;
  month: number;
  year: number;
  isRecurring: boolean;
  notes?: string;
}

export default function OverheadPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [expenses, setExpenses] = useState<OverheadExpense[]>([]);
  const [totalByCategory, setTotalByCategory] = useState<Record<string, number>>({});
  const [totalByMonth, setTotalByMonth] = useState<Record<number, number>>({});
  const [grandTotal, setGrandTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<OverheadExpense | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    name: '',
    amount: '',
    month: new Date().getMonth() + 1,
    isRecurring: true,
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, [year]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/overhead?year=${year}`);
      const data = await res.json();
      setExpenses(data.expenses || []);
      setTotalByCategory(data.totalByCategory || {});
      setTotalByMonth(data.totalByMonth || {});
      setGrandTotal(data.grandTotal || 0);
    } catch (error) {
      console.error('Error fetching overhead:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingExpense ? 'PUT' : 'POST';
      const body = {
        ...formData,
        amount: parseFloat(formData.amount),
        year,
        ...(editingExpense && { id: editingExpense.id }),
      };

      await fetch('/api/overhead', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      setDialogOpen(false);
      setEditingExpense(null);
      setFormData({ category: '', name: '', amount: '', month: new Date().getMonth() + 1, isRecurring: true, notes: '' });
      fetchData();
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const handleEdit = (expense: OverheadExpense) => {
    setEditingExpense(expense);
    setFormData({
      category: expense.category,
      name: expense.name,
      amount: expense.amount.toString(),
      month: expense.month,
      isRecurring: expense.isRecurring,
      notes: expense.notes || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await fetch(`/api/overhead?id=${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const chartData = MONTHS.map((month, i) => ({
    month,
    amount: totalByMonth[i + 1] || 0,
  }));

  const salaryTotal = (totalByCategory['owner_salary'] || 0) +
    (totalByCategory['production_salary'] || 0) +
    (totalByCategory['sales_salary'] || 0) +
    (totalByCategory['admin_salary'] || 0);
  const otherTotal = grandTotal - salaryTotal;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Overhead Expenses</h1>
          <p className="text-slate-500">Track fixed costs and operating expenses</p>
        </div>
        <div className="flex gap-2">
          <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2023, 2024, 2025, 2026].map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingExpense(null);
              setFormData({ category: '', name: '', amount: '', month: new Date().getMonth() + 1, isRecurring: true, notes: '' });
            }
          }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Expense</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingExpense ? 'Edit' : 'Add'} Expense</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Office rent, QuickBooks..."
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Month</Label>
                    <Select value={formData.month.toString()} onValueChange={(v) => setFormData({...formData, month: parseInt(v)})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((month, i) => (
                          <SelectItem key={month} value={(i + 1).toString()}>{month}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isRecurring}
                    onCheckedChange={(checked) => setFormData({...formData, isRecurring: checked})}
                  />
                  <Label>Recurring monthly expense</Label>
                </div>
                <div>
                  <Label>Notes (optional)</Label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Additional details..."
                  />
                </div>
                <Button type="submit" className="w-full">Save</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500">Total Overhead YTD</p>
                <p className="text-2xl font-bold">{formatCurrency(grandTotal)}</p>
                <p className="text-xs text-slate-400">{formatCurrency(grandTotal / 12)}/month avg</p>
              </div>
              <div className="p-2 bg-slate-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500">Salaries Total</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(salaryTotal)}</p>
                <p className="text-xs text-slate-400">
                  {grandTotal > 0 ? ((salaryTotal / grandTotal) * 100).toFixed(0) : 0}% of overhead
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500">Other Expenses</p>
                <p className="text-2xl font-bold text-amber-600">{formatCurrency(otherTotal)}</p>
                <p className="text-xs text-slate-400">
                  {grandTotal > 0 ? ((otherTotal / grandTotal) * 100).toFixed(0) : 0}% of overhead
                </p>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg">
                <Building2 className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500">Categories Used</p>
                <p className="text-2xl font-bold">{Object.keys(totalByCategory).length}</p>
                <p className="text-xs text-slate-400">of {CATEGORIES.length} available</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building2 className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Overhead</CardTitle>
          <CardDescription>Expense distribution by month</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>By Category</CardTitle>
          <CardDescription>Annual totals by expense type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map(cat => {
              const amount = totalByCategory[cat.value] || 0;
              const Icon = cat.icon;
              if (amount === 0) return null;
              return (
                <div key={cat.value} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-slate-500" />
                    <span className="font-medium">{cat.label}</span>
                  </div>
                  <span className="font-bold">{formatCurrency(amount)}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Expense List */}
      <Card>
        <CardHeader>
          <CardTitle>All Expenses</CardTitle>
          <CardDescription>Detailed list for {year}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Recurring</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length > 0 ? expenses.map(expense => (
                <TableRow key={expense.id}>
                  <TableCell>{MONTHS[expense.month - 1]}</TableCell>
                  <TableCell>{CATEGORIES.find(c => c.value === expense.category)?.label}</TableCell>
                  <TableCell className="font-medium">{expense.name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(expense.amount)}</TableCell>
                  <TableCell>{expense.isRecurring ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(expense)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(expense.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                    No expenses recorded yet. Click "Add Expense" to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
