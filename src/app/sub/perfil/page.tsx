'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  User,
  Mail,
  Phone,
  LogOut,
  Loader2,
  DollarSign,
  Users,
  ChevronRight,
  Camera,
  Pencil,
  Lock,
  Building2,
  MapPin,
  Save,
  X,
  FileCheck,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Upload,
  Calendar,
  GraduationCap,
} from 'lucide-react';
import { parseISO, isBefore } from 'date-fns';
import { toast } from 'sonner';
import { formatPhoneUS } from '@/lib/utils/phone';
import { getSupabaseClient } from '@/lib/supabase';

// Compliance status types and helpers
type ComplianceStatus = 'valid' | 'expiring' | 'expired' | 'unknown';

function getComplianceStatus(expirationDate: string | null): ComplianceStatus {
  if (!expirationDate) return 'unknown';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = parseISO(expirationDate);

  if (isBefore(expDate, today)) return 'expired';

  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  if (isBefore(expDate, thirtyDaysFromNow)) return 'expiring';

  return 'valid';
}

function getDaysRemaining(expirationDate: string | null): string {
  if (!expirationDate) return '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = parseISO(expirationDate);

  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `Expirou ha ${Math.abs(diffDays)} dia${Math.abs(diffDays) !== 1 ? 's' : ''}`;
  } else if (diffDays === 0) {
    return 'Expira hoje';
  } else {
    return `Expira em ${diffDays} dia${diffDays !== 1 ? 's' : ''}`;
  }
}

function getStatusColor(status: ComplianceStatus): { bg: string; text: string; icon: string } {
  switch (status) {
    case 'valid':
      return { bg: 'bg-green-100', text: 'text-green-600', icon: 'text-green-500' };
    case 'expiring':
      return { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: 'text-yellow-500' };
    case 'expired':
      return { bg: 'bg-red-100', text: 'text-red-600', icon: 'text-red-500' };
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-600', icon: 'text-slate-500' };
  }
}

function getStatusIcon(status: ComplianceStatus) {
  switch (status) {
    case 'valid':
      return CheckCircle2;
    case 'expiring':
      return AlertTriangle;
    case 'expired':
      return AlertTriangle;
    default:
      return FileCheck;
  }
}

interface ProfileData {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  subcontractor: {
    id: string;
    companyName: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    profileImageUrl: string | null;
    phone: string | null;
    // Compliance fields
    licenseNumber: string | null;
    licenseExpirationDate: string | null;
    licenseImageUrl: string | null;
    insuranceNumber: string | null;
    insuranceExpirationDate: string | null;
    insuranceImageUrl: string | null;
  };
}

export default function SubContaPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);
  const insuranceInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);
  const [isUploadingInsurance, setIsUploadingInsurance] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    companyName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    // Compliance fields
    licenseNumber: '',
    licenseExpirationDate: '',
    licenseImageUrl: '',
    insuranceNumber: '',
    insuranceExpirationDate: '',
    insuranceImageUrl: '',
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/sub/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setEditForm({
          name: data.user.name || '',
          phone: data.user.phone || data.subcontractor.phone || '',
          companyName: data.subcontractor.companyName || '',
          address: data.subcontractor.address || '',
          city: data.subcontractor.city || '',
          state: data.subcontractor.state || '',
          zipCode: data.subcontractor.zipCode || '',
          // Compliance fields
          licenseNumber: data.subcontractor.licenseNumber || '',
          licenseExpirationDate: data.subcontractor.licenseExpirationDate || '',
          licenseImageUrl: data.subcontractor.licenseImageUrl || '',
          insuranceNumber: data.subcontractor.insuranceNumber || '',
          insuranceExpirationDate: data.subcontractor.insuranceExpirationDate || '',
          insuranceImageUrl: data.subcontractor.insuranceImageUrl || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Erro ao carregar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/sub/me', { method: 'DELETE' });
      router.push('/sub/login');
    } catch {
      toast.error('Erro ao sair');
      setIsLoggingOut(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem deve ter no maximo 5MB');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      const supabase = getSupabaseClient();

      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.subcontractor.id}-${Date.now()}.${fileExt}`;
      const filePath = `subcontractor-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      // Update profile with new photo URL
      const res = await fetch('/api/sub/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImageUrl: publicUrl }),
      });

      if (res.ok) {
        setProfile(prev => prev ? {
          ...prev,
          subcontractor: { ...prev.subcontractor, profileImageUrl: publicUrl }
        } : null);
        toast.success('Foto atualizada!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar foto');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleLicenseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Por favor, selecione uma imagem ou PDF');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo deve ter no maximo 10MB');
      return;
    }

    try {
      setIsUploadingLicense(true);
      const supabase = getSupabaseClient();

      const fileExt = file.name.split('.').pop();
      const fileName = `license-${profile.subcontractor.id}-${Date.now()}.${fileExt}`;
      const filePath = `compliance-docs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      setEditForm(prev => ({ ...prev, licenseImageUrl: publicUrl }));
      toast.success('Documento da licenca enviado!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar documento');
    } finally {
      setIsUploadingLicense(false);
    }
  };

  const handleInsuranceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Por favor, selecione uma imagem ou PDF');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo deve ter no maximo 10MB');
      return;
    }

    try {
      setIsUploadingInsurance(true);
      const supabase = getSupabaseClient();

      const fileExt = file.name.split('.').pop();
      const fileName = `insurance-${profile.subcontractor.id}-${Date.now()}.${fileExt}`;
      const filePath = `compliance-docs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      setEditForm(prev => ({ ...prev, insuranceImageUrl: publicUrl }));
      toast.success('Documento do seguro enviado!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar documento');
    } finally {
      setIsUploadingInsurance(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      const res = await fetch('/api/sub/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        await loadProfile();
        setIsEditing(false);
        toast.success('Perfil atualizado!');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao salvar');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Erro ao salvar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Senhas nao conferem');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      setIsChangingPassword(true);
      const res = await fetch('/api/sub/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (res.ok) {
        setShowPasswordDialog(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        toast.success('Senha alterada com sucesso!');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao alterar senha');
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('Erro ao alterar senha');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
          <p className="mt-3 text-slate-500">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white px-4 pt-8 pb-16 safe-area-top">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">Minha Conta</h1>
          {!isEditing ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Profile Photo */}
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto ring-4 ring-white/30 overflow-hidden">
              {profile?.subcontractor.profileImageUrl ? (
                <img
                  src={profile.subcontractor.profileImageUrl}
                  alt="Foto de perfil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-12 w-12 text-white" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-slate-100 transition-colors"
            >
              {isUploadingPhoto ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              ) : (
                <Camera className="h-4 w-4 text-blue-600" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          <h2 className="text-xl font-bold mt-3">{profile?.user.name}</h2>
          {profile?.subcontractor.companyName && (
            <p className="text-blue-200 text-sm">{profile.subcontractor.companyName}</p>
          )}
        </div>
      </header>

      <div className="px-4 -mt-8 space-y-4">
        {/* Profile Info Card */}
        <Card className="bg-white shadow-lg border-0">
          <CardContent className="p-4 space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Seu nome"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="(000) 000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nome da Empresa</Label>
                  <Input
                    value={editForm.companyName}
                    onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                    placeholder="Nome da sua empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Endereco</Label>
                  <Input
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    placeholder="Endereco"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      placeholder="Cidade"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Input
                      value={editForm.state}
                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                      placeholder="FL"
                      maxLength={2}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input
                    value={editForm.zipCode}
                    onChange={(e) => setEditForm({ ...editForm, zipCode: e.target.value })}
                    placeholder="00000"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <span className="text-sm">{profile?.user.email}</span>
                </div>
                {(profile?.user.phone || profile?.subcontractor.phone) && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                      <Phone className="h-5 w-5 text-slate-400" />
                    </div>
                    <span className="text-sm">
                      {formatPhoneUS(profile?.user.phone || profile?.subcontractor.phone || '')}
                    </span>
                  </div>
                )}
                {profile?.subcontractor.companyName && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-slate-400" />
                    </div>
                    <span className="text-sm">{profile.subcontractor.companyName}</span>
                  </div>
                )}
                {(profile?.subcontractor.address || profile?.subcontractor.city) && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-slate-400" />
                    </div>
                    <span className="text-sm">
                      {[
                        profile.subcontractor.address,
                        profile.subcontractor.city,
                        profile.subcontractor.state,
                        profile.subcontractor.zipCode,
                      ].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Compliance Info Card */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Documentos</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {isEditing ? (
              <>
                {/* License Edit */}
                <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-slate-900">Licenca</span>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Numero da Licenca</Label>
                    <Input
                      value={editForm.licenseNumber}
                      onChange={(e) => setEditForm({ ...editForm, licenseNumber: e.target.value })}
                      placeholder="Ex: LIC-2024-001234"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Validade</Label>
                    <Input
                      type="date"
                      value={editForm.licenseExpirationDate}
                      onChange={(e) => setEditForm({ ...editForm, licenseExpirationDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Documento</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => licenseInputRef.current?.click()}
                        disabled={isUploadingLicense}
                        className="flex-1"
                      >
                        {isUploadingLicense ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        {editForm.licenseImageUrl ? 'Trocar Arquivo' : 'Enviar Arquivo'}
                      </Button>
                      {editForm.licenseImageUrl && (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <input
                      ref={licenseInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={handleLicenseUpload}
                    />
                  </div>
                </div>

                {/* Insurance Edit */}
                <div className="space-y-3 p-3 bg-emerald-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-emerald-600" />
                    <span className="font-medium text-slate-900">Seguro</span>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Numero da Apolice</Label>
                    <Input
                      value={editForm.insuranceNumber}
                      onChange={(e) => setEditForm({ ...editForm, insuranceNumber: e.target.value })}
                      placeholder="Ex: INS-2024-567890"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Validade</Label>
                    <Input
                      type="date"
                      value={editForm.insuranceExpirationDate}
                      onChange={(e) => setEditForm({ ...editForm, insuranceExpirationDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Documento</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => insuranceInputRef.current?.click()}
                        disabled={isUploadingInsurance}
                        className="flex-1"
                      >
                        {isUploadingInsurance ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        {editForm.insuranceImageUrl ? 'Trocar Arquivo' : 'Enviar Arquivo'}
                      </Button>
                      {editForm.insuranceImageUrl && (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <input
                      ref={insuranceInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={handleInsuranceUpload}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* License Display */}
                {profile?.subcontractor.licenseNumber ? (
                  (() => {
                    const licenseStatus = getComplianceStatus(profile.subcontractor.licenseExpirationDate);
                    const licenseColors = getStatusColor(licenseStatus);
                    const LicenseStatusIcon = getStatusIcon(licenseStatus);

                    return (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${licenseColors.bg} rounded-full flex items-center justify-center`}>
                            <FileCheck className={`h-5 w-5 ${licenseColors.text}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">Licenca</p>
                            <p className="text-xs text-slate-500">{profile.subcontractor.licenseNumber}</p>
                          </div>
                        </div>
                        {profile.subcontractor.licenseExpirationDate && (
                          <div className="text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <LicenseStatusIcon className={`h-3 w-3 ${licenseColors.icon}`} />
                              <span className={`text-sm font-medium ${licenseColors.text}`}>
                                {getDaysRemaining(profile.subcontractor.licenseExpirationDate)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <div className="flex items-center gap-3 text-slate-400">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                      <FileCheck className="h-5 w-5" />
                    </div>
                    <p className="text-sm">Licenca nao cadastrada</p>
                  </div>
                )}

                {/* Insurance Display */}
                {profile?.subcontractor.insuranceNumber ? (
                  (() => {
                    const insuranceStatus = getComplianceStatus(profile.subcontractor.insuranceExpirationDate);
                    const insuranceColors = getStatusColor(insuranceStatus);
                    const InsuranceStatusIcon = getStatusIcon(insuranceStatus);

                    return (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${insuranceColors.bg} rounded-full flex items-center justify-center`}>
                            <Shield className={`h-5 w-5 ${insuranceColors.text}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">Seguro</p>
                            <p className="text-xs text-slate-500">{profile.subcontractor.insuranceNumber}</p>
                          </div>
                        </div>
                        {profile.subcontractor.insuranceExpirationDate && (
                          <div className="text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <InsuranceStatusIcon className={`h-3 w-3 ${insuranceColors.icon}`} />
                              <span className={`text-sm font-medium ${insuranceColors.text}`}>
                                {getDaysRemaining(profile.subcontractor.insuranceExpirationDate)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <div className="flex items-center gap-3 text-slate-400">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                      <Shield className="h-5 w-5" />
                    </div>
                    <p className="text-sm">Seguro nao cadastrado</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card
          className="hover:bg-slate-50 transition-colors cursor-pointer"
          onClick={() => setShowPasswordDialog(true)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <Lock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Alterar Senha</p>
                  <p className="text-sm text-slate-500">Atualize sua senha</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        {/* Financeiro Link */}
        <Link href="/sub/financeiro">
          <Card className="hover:bg-slate-50 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Financeiro</p>
                    <p className="text-sm text-slate-500">Pagamentos e ganhos</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Team Management Link */}
        <Link href="/sub/equipe">
          <Card className="hover:bg-slate-50 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Minha Equipe</p>
                    <p className="text-sm text-slate-500">Gerenciar funcionarios</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Training Link */}
        <Link href="/sub/treinamento">
          <Card className="hover:bg-slate-50 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Treinamento</p>
                    <p className="text-sm text-slate-500">Cursos e certificados</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Logout Button */}
        <Button
          variant="outline"
          className="w-full h-14 text-red-600 border-red-200 hover:bg-red-50"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <LogOut className="h-5 w-5 mr-2" />
          )}
          Sair da Conta
        </Button>

        {/* Footer */}
        <div className="text-center py-4 text-xs text-slate-400">
          <p>PaintPro v1.0</p>
        </div>
      </div>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Senha Atual</Label>
              <Input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="Digite sua senha atual"
              />
            </div>
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Digite a nova senha"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirmar Nova Senha</Label>
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Confirme a nova senha"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPasswordDialog(false)}
              disabled={isChangingPassword}
            >
              Cancelar
            </Button>
            <Button onClick={handleChangePassword} disabled={isChangingPassword}>
              {isChangingPassword ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Alterar Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
