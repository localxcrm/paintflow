'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Plus, ChevronRight, Crown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  role: string;
  isDefault: boolean;
}

const planLabels: Record<string, string> = {
  free: 'Gratuito',
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

const planColors: Record<string, string> = {
  free: 'bg-slate-100 text-slate-700',
  starter: 'bg-blue-100 text-blue-700',
  pro: 'bg-purple-100 text-purple-700',
  enterprise: 'bg-amber-100 text-amber-700',
};

function SelectOrgContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/painel';

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const res = await fetch('/api/organizations');
      if (res.ok) {
        const data = await res.json();
        setOrganizations(data.organizations || []);

        // If user has only one org, auto-select it
        if (data.organizations?.length === 1) {
          await selectOrganization(data.organizations[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
      toast.error('Erro ao carregar organizações');
    } finally {
      setIsLoading(false);
    }
  };

  const selectOrganization = async (orgId: string) => {
    try {
      const res = await fetch('/api/organizations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId }),
      });

      if (res.ok) {
        router.push(redirectPath);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao selecionar organização');
      }
    } catch (error) {
      console.error('Error selecting organization:', error);
      toast.error('Erro ao selecionar organização');
    }
  };

  const createOrganization = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newOrgName.trim()) {
      toast.error('Digite o nome da empresa');
      return;
    }

    setIsCreating(true);

    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newOrgName }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('Empresa criada com sucesso!');
        await selectOrganization(data.organization.id);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao criar empresa');
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      toast.error('Erro ao criar empresa');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Selecionar Empresa</h1>
          <p className="text-slate-500 mt-2">
            Escolha uma empresa para continuar ou crie uma nova
          </p>
        </div>

        {organizations.length > 0 && (
          <div className="space-y-3 mb-6">
            {organizations.map((org) => (
              <Card
                key={org.id}
                className="cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
                onClick={() => selectOrganization(org.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-slate-900">{org.name}</h3>
                          {org.role === 'owner' && (
                            <Crown className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${planColors[org.plan] || planColors.free}`}>
                            {planLabels[org.plan] || org.plan}
                          </span>
                          <span className="text-xs text-slate-400">
                            /{org.slug}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {showCreateForm ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Nova Empresa</CardTitle>
              <CardDescription>
                Crie uma nova empresa para gerenciar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createOrganization} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Empresa</Label>
                  <Input
                    id="name"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="Ex: Pinturas Silva"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewOrgName('');
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreating || !newOrgName.trim()}
                    className="flex-1"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      'Criar Empresa'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Button
            variant="outline"
            className="w-full h-14"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus className="h-5 w-5 mr-2" />
            Criar Nova Empresa
          </Button>
        )}

        {organizations.length === 0 && !showCreateForm && (
          <p className="text-center text-slate-500 text-sm mt-4">
            Você ainda não tem nenhuma empresa cadastrada
          </p>
        )}
      </div>
    </div>
  );
}

export default function SelectOrgPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <SelectOrgContent />
    </Suspense>
  );
}
