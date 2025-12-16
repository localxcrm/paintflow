'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Search, User, MapPin, Phone, Mail, Loader2, UserPlus, X } from 'lucide-react';
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
}

interface ClientInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  leadId?: string;
}

interface ClientSearchProps {
  onSelectClient: (client: ClientInfo) => void;
  onNewClient: () => void;
  selectedClient?: ClientInfo | null;
  onClearClient?: () => void;
}

export function ClientSearch({ onSelectClient, onNewClient, selectedClient, onClearClient }: ClientSearchProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Search leads when search text changes
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!search || search.length < 2) {
      setLeads([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/leads?search=${encodeURIComponent(search)}&limit=10`);
        if (response.ok) {
          const data = await response.json();
          setLeads(data.leads || []);
        }
      } catch (error) {
        console.error('Error searching leads:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [search]);

  const handleSelectLead = (lead: Lead) => {
    const clientInfo: ClientInfo = {
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email || '',
      phone: lead.phone || '',
      address: lead.address || '',
      city: lead.city || '',
      state: lead.state || 'CT',
      zipCode: lead.zipCode || '',
      leadId: lead.id,
    };
    onSelectClient(clientInfo);
    setOpen(false);
    setSearch('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700';
      case 'contacted': return 'bg-yellow-100 text-yellow-700';
      case 'qualified': return 'bg-green-100 text-green-700';
      case 'proposal_sent': return 'bg-purple-100 text-purple-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  // If client is selected, show selected state
  if (selectedClient && selectedClient.firstName) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
        <User className="h-5 w-5 text-green-600" />
        <div className="flex-1">
          <p className="font-medium text-green-900">
            {selectedClient.firstName} {selectedClient.lastName}
          </p>
          <p className="text-sm text-green-700">
            {selectedClient.address && `${selectedClient.address}, `}
            {selectedClient.city}, {selectedClient.state}
          </p>
        </div>
        {selectedClient.leadId && (
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            Cliente existente
          </Badge>
        )}
        {onClearClient && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-green-600 hover:text-green-800 hover:bg-green-100"
            onClick={onClearClient}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-start gap-2 h-12 text-left font-normal"
          >
            <Search className="h-4 w-4 text-slate-400" />
            <span className="text-slate-500">Buscar cliente existente ou criar novo...</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[500px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Digite nome, email, telefone ou endereço..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {isLoading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  <span className="ml-2 text-sm text-slate-500">Buscando...</span>
                </div>
              )}

              {!isLoading && search.length >= 2 && leads.length === 0 && (
                <CommandEmpty>
                  <div className="py-4 text-center">
                    <p className="text-sm text-slate-500">Nenhum cliente encontrado.</p>
                    <Button
                      variant="link"
                      className="mt-2 gap-2"
                      onClick={() => {
                        onNewClient();
                        setOpen(false);
                      }}
                    >
                      <UserPlus className="h-4 w-4" />
                      Criar novo cliente
                    </Button>
                  </div>
                </CommandEmpty>
              )}

              {!isLoading && leads.length > 0 && (
                <CommandGroup heading="Clientes encontrados">
                  {leads.map((lead) => (
                    <CommandItem
                      key={lead.id}
                      value={lead.id}
                      onSelect={() => handleSelectLead(lead)}
                      className="cursor-pointer py-3"
                    >
                      <div className="flex items-start gap-3 w-full">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-slate-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {lead.firstName} {lead.lastName}
                            </span>
                            <Badge
                              variant="secondary"
                              className={cn('text-xs', getStatusColor(lead.status))}
                            >
                              {lead.status === 'new' ? 'Novo' :
                               lead.status === 'contacted' ? 'Contatado' :
                               lead.status === 'qualified' ? 'Qualificado' :
                               lead.status === 'proposal_sent' ? 'Proposta' : lead.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
                            {lead.address && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {lead.address}, {lead.city}
                              </span>
                            )}
                            {lead.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {lead.phone}
                              </span>
                            )}
                            {lead.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {lead.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {!isLoading && search.length < 2 && (
                <div className="py-4 px-3">
                  <p className="text-sm text-slate-500 text-center mb-3">
                    Digite pelo menos 2 caracteres para buscar
                  </p>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => {
                      onNewClient();
                      setOpen(false);
                    }}
                  >
                    <UserPlus className="h-4 w-4" />
                    Criar novo cliente
                  </Button>
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
