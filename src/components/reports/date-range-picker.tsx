'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, subQuarters, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type DateRangePreset = 
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisQuarter'
  | 'lastQuarter'
  | 'thisYear'
  | 'custom';

interface DateRangePickerProps {
  /** Current date range */
  value: DateRange | undefined;
  /** Callback when date range changes */
  onChange: (range: DateRange | undefined) => void;
  /** Alignment of popover */
  align?: 'start' | 'center' | 'end';
  /** Custom class name */
  className?: string;
}

const PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'last7days', label: 'Últimos 7 dias' },
  { value: 'last30days', label: 'Últimos 30 dias' },
  { value: 'thisMonth', label: 'Este mês' },
  { value: 'lastMonth', label: 'Mês passado' },
  { value: 'thisQuarter', label: 'Este trimestre' },
  { value: 'lastQuarter', label: 'Trimestre passado' },
  { value: 'thisYear', label: 'Este ano' },
  { value: 'custom', label: 'Personalizado' },
];

function getPresetRange(preset: DateRangePreset): DateRange | undefined {
  const today = new Date();
  
  switch (preset) {
    case 'today':
      return { from: today, to: today };
    case 'yesterday':
      const yesterday = subDays(today, 1);
      return { from: yesterday, to: yesterday };
    case 'last7days':
      return { from: subDays(today, 6), to: today };
    case 'last30days':
      return { from: subDays(today, 29), to: today };
    case 'thisMonth':
      return { from: startOfMonth(today), to: endOfMonth(today) };
    case 'lastMonth':
      const lastMonth = subMonths(today, 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    case 'thisQuarter':
      return { from: startOfQuarter(today), to: endOfQuarter(today) };
    case 'lastQuarter':
      const lastQuarter = subQuarters(today, 1);
      return { from: startOfQuarter(lastQuarter), to: endOfQuarter(lastQuarter) };
    case 'thisYear':
      return { from: startOfYear(today), to: endOfYear(today) };
    case 'custom':
    default:
      return undefined;
  }
}

function detectPreset(range: DateRange | undefined): DateRangePreset {
  if (!range?.from || !range?.to) return 'custom';
  
  const today = new Date();
  const fromStr = format(range.from, 'yyyy-MM-dd');
  const toStr = format(range.to, 'yyyy-MM-dd');
  
  for (const preset of PRESETS) {
    if (preset.value === 'custom') continue;
    const presetRange = getPresetRange(preset.value);
    if (!presetRange?.from || !presetRange?.to) continue;
    
    if (
      format(presetRange.from, 'yyyy-MM-dd') === fromStr &&
      format(presetRange.to, 'yyyy-MM-dd') === toStr
    ) {
      return preset.value;
    }
  }
  
  return 'custom';
}

export function DateRangePicker({
  value,
  onChange,
  align = 'start',
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const currentPreset = detectPreset(value);

  const handlePresetChange = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      // Don't change the range, just open calendar
      return;
    }
    const range = getPresetRange(preset);
    onChange(range);
  };

  const formatDateRange = () => {
    if (!value?.from) {
      return 'Selecione um período';
    }
    
    if (value.to) {
      return `${format(value.from, 'dd MMM yyyy', { locale: ptBR })} - ${format(value.to, 'dd MMM yyyy', { locale: ptBR })}`;
    }
    
    return format(value.from, 'dd MMM yyyy', { locale: ptBR });
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Select value={currentPreset} onValueChange={(v) => handlePresetChange(v as DateRangePreset)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Selecione período" />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-[280px] justify-start text-left font-normal',
              !value && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <Calendar
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={onChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
