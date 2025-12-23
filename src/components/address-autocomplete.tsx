'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { MapPin, Loader2 } from 'lucide-react';

export interface AddressResult {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  display: string;
  lat?: number;
  lng?: number;
}

interface AddressAutocompleteProps {
  value: string;
  onAddressSelect: (address: AddressResult) => void;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function AddressAutocomplete({
  value,
  onAddressSelect,
  onChange,
  placeholder,
  className,
}: AddressAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<AddressResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync query with external value
  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    // Debounce to respect Nominatim rate limit (1 req/s)
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const searchQuery = query + ', USA';
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&addressdetails=1&limit=5`;

        const res = await fetch(url, {
          headers: {
            'User-Agent': 'PaintPro/1.0 (contact@paintpro.com)',
            Accept: 'application/json',
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch addresses');
        }

        const data = await res.json();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const addresses: AddressResult[] = data.map((item: any) => {
          const addr = item.address || {};
          return {
            street: addr.road || addr.pedestrian || addr.street || '',
            city:
              addr.city ||
              addr.town ||
              addr.municipality ||
              addr.village ||
              '',
            state: addr.state || '',
            zipCode: addr.postcode || '',
            display: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          };
        });

        setResults(addresses);
      } catch (error) {
        console.error('Address search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms debounce

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange?.(newValue);
    if (newValue.length >= 3) {
      setOpen(true);
    }
  };

  const handleSelect = (addr: AddressResult) => {
    onAddressSelect(addr);
    setQuery(addr.street || addr.display.split(',')[0]);
    setOpen(false);
  };

  return (
    <Popover open={open && results.length > 0} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={`relative ${className || ''}`}>
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={handleInputChange}
            onFocus={() => {
              if (results.length > 0) setOpen(true);
            }}
            placeholder={placeholder || 'Enter address...'}
            className="pl-9"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandList>
            <CommandEmpty>No address found</CommandEmpty>
            <CommandGroup>
              {results.map((addr, i) => (
                <CommandItem
                  key={i}
                  value={addr.display}
                  onSelect={() => handleSelect(addr)}
                  className="cursor-pointer"
                >
                  <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="text-sm truncate">{addr.display}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
