'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { AdminGuard } from '@/components/auth/admin-guard';
import {
    Activity,
    AlertTriangle,
    ArrowLeft,
    Building2,
    Calendar,
    CheckCircle,
    CreditCard,
    DollarSign,
    ExternalLink,
    Flag,
    LogOut,
    Mail,
    MapPin,
    MoreVertical,
    Phone,
    Plus,
    Shield,
    Trash,
    User,
    Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface OrgDetail {
    id: string;
    name: string;
    slug: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    plan: string;
    isActive: boolean;
    createdAt: string;
    stripeCustomerId: string;
    userCount: number;
    jobCount: number;
    estimateCount: number;
    settings?: Record<string, boolean>;
}

interface OrgUser {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    lastLoginAt: string;
}

export default function OrgDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [org, setOrg] = useState<OrgDetail | null>(null);
    const [users, setUsers] = useState<OrgUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchOrgData();
    }, [id]);

    const fetchOrgData = async () => {
        setIsLoading(true);
        try {
            // Add timestamp to prevent caching
            const t = Date.now();
            const [orgRes, usersRes] = await Promise.all([
                fetch(`/api/admin/organizations/${id}?t=${t}`, { cache: 'no-store' }),
                fetch(`/api/admin/organizations/${id}/users?t=${t}`, { cache: 'no-store' })
            ]);

            if (!orgRes.ok) throw new Error('Failed to fetch org');
            if (!usersRes.ok) throw new Error('Failed to fetch users');

            const orgData = await orgRes.json();
            const usersData = await usersRes.json();

            setOrg(orgData);
            setUsers(usersData);
        } catch (error) {
            console.error('Error fetching org data:', error);
            alert('Failed to load organization data.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = async (field: string, value: any) => {
        // Optimistic update
        setOrg(prev => prev ? ({ ...prev, [field]: value }) : null);

        // TODO: Debounce actual API call for text fields
        // For now, implementing direct call for toggles mainly
    };

    const saveChanges = async () => {
        if (!org) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/admin/organizations/${org.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(org)
            });

            if (!res.ok) throw new Error('Failed to save');
            alert('Changes saved successfully!');
            fetchOrgData(); // Refresh data from server
        } catch (error) {
            console.error('Save error:', error);
            alert('Failed to save changes.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleStatusToggle = async () => {
        if (!org) return;
        const newStatus = !org.isActive;

        try {
            const res = await fetch(`/api/admin/organizations/${org.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: newStatus })
            });

            if (!res.ok) throw new Error('Failed to toggle status');
            setOrg(prev => prev ? ({ ...prev, isActive: newStatus }) : null);
            fetchOrgData(); // Refresh full data including badge state
        } catch (error) {
            console.error('Status toggle error:', error);
            alert('Failed to update status.');
        }
    };

    if (isLoading) {
        return (
            <div className="p-6 max-w-7xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }

    if (!org) return <div>Organization not found</div>;

    return (
        <AdminGuard>
            <div className="min-h-screen bg-slate-50 pb-20">
                {/* Header */}
                <header className="bg-white border-b sticky top-0 z-10">
                    <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={() => router.push('/admin')}>
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold flex items-center gap-3">
                                    {org.name}
                                    <Badge variant={org.isActive === true || String(org.isActive) === 'true' ? 'default' : 'destructive'}>
                                        {org.isActive === true || String(org.isActive) === 'true' ? 'Active' : 'Suspended'}
                                    </Badge>
                                </h1>
                                <p className="text-sm text-slate-500 flex items-center gap-2">
                                    ID: {org.id}
                                    <span className="text-slate-300">|</span>
                                    Created: {new Date(org.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline">
                                <User className="w-4 h-4 mr-2" />
                                Impersonate
                            </Button>
                            <Button onClick={saveChanges} disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </header>

                <main className="p-6 max-w-7xl mx-auto space-y-8">

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-slate-500">Total Users</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{org.userCount}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-slate-500">Estimates</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{org.estimateCount}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-slate-500">Jobs</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{org.jobCount}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-slate-500">Plan</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold uppercase">{org.plan}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="users">Members</TabsTrigger>
                            <TabsTrigger value="subscription">Subscription</TabsTrigger>
                            <TabsTrigger value="settings">Settings</TabsTrigger>
                            <TabsTrigger value="danger">Danger Zone</TabsTrigger>
                        </TabsList>

                        {/* OVERVIEW TAB */}
                        <TabsContent value="overview" className="mt-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Organization Details</CardTitle>
                                        <CardDescription>Basic information about this tenant.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">Name</Label>
                                            <Input
                                                id="name"
                                                value={org.name}
                                                onChange={(e) => handleUpdate('name', e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="slug">Slug (URL Identifier)</Label>
                                            <Input
                                                id="slug"
                                                value={org.slug}
                                                onChange={(e) => handleUpdate('slug', e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="email">Contact Email</Label>
                                            <Input
                                                id="email"
                                                value={org.email || ''}
                                                onChange={(e) => handleUpdate('email', e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="phone">Phone</Label>
                                            <Input
                                                id="phone"
                                                value={org.phone || ''}
                                                onChange={(e) => handleUpdate('phone', e.target.value)}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Address</CardTitle>
                                        <CardDescription>Location details.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="address">Street Address</Label>
                                            <Input
                                                id="address"
                                                value={org.address || ''}
                                                onChange={(e) => handleUpdate('address', e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="city">City</Label>
                                                <Input
                                                    id="city"
                                                    value={org.city || ''}
                                                    onChange={(e) => handleUpdate('city', e.target.value)}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="state">State</Label>
                                                <Input
                                                    id="state"
                                                    value={org.state || ''}
                                                    onChange={(e) => handleUpdate('state', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="zipCode">Zip Code</Label>
                                            <Input
                                                id="zipCode"
                                                value={org.zipCode || ''}
                                                onChange={(e) => handleUpdate('zipCode', e.target.value)}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* MEMBERS TAB */}
                        <TabsContent value="users" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Team Members</CardTitle>
                                    <CardDescription>Manage users that belong to this organization.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>User</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Last Login</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {users.map((user) => (
                                                <TableRow key={user.id}>
                                                    <TableCell>
                                                        <div className="font-medium">{user.name}</div>
                                                        <div className="text-sm text-slate-500">{user.email}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="capitalize">{user.role}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {user.isActive ? (
                                                            <div className="flex items-center text-green-600 text-sm">
                                                                <CheckCircle className="w-4 h-4 mr-1" /> Active
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center text-red-500 text-sm">
                                                                <LogOut className="w-4 h-4 mr-1" /> Inactive
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreVertical className="w-4 h-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                <DropdownMenuItem>Promote to Owner</DropdownMenuItem>
                                                                <DropdownMenuItem>Reset Password</DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem className="text-red-600">Remove from Org</DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* SUBSCRIPTION TAB */}
                        <TabsContent value="subscription" className="mt-6 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Current Subscription</CardTitle>
                                    <CardDescription>Manage plan and billing details.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                <CreditCard className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-lg capitalize">{org.plan} Plan</div>
                                                <div className="text-sm text-slate-500">Billing monthly</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-lg">$49.00/mo</div>
                                            <div className="text-xs text-green-600 flex items-center justify-end">
                                                <CheckCircle className="w-3 h-3 mr-1" /> Active
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                        <div className="grid gap-2">
                                            <Label>Manual Plan Override</Label>
                                            <select
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                value={org.plan}
                                                onChange={(e) => handleUpdate('plan', e.target.value)}
                                            >
                                                <option value="free">Free</option>
                                                <option value="starter">Starter</option>
                                                <option value="pro">Pro</option>
                                                <option value="enterprise">Enterprise</option>
                                            </select>
                                            <p className="text-xs text-slate-500">Caution: This manually overrides the plan without billing changes.</p>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Stripe Customer ID</Label>
                                            <div className="flex gap-2">
                                                <Input value={org.stripeCustomerId || 'Not Linked'} readOnly />
                                                <Button variant="outline" size="icon" disabled={!org.stripeCustomerId}>
                                                    <ExternalLink className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* SETTINGS TAB */}
                        <TabsContent value="settings" className="mt-6 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Feature Flags</CardTitle>
                                    <CardDescription>Toggle specific modules for this tenant.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Advanced Estimating</Label>
                                            <p className="text-sm text-slate-500">Enable complex formula-based estimating system.</p>
                                        </div>
                                        <Switch
                                            checked={org.settings?.advancedEstimating ?? true}
                                            onCheckedChange={(checked) => handleUpdate('settings', { ...org.settings, advancedEstimating: checked })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">AI Assistant</Label>
                                            <p className="text-sm text-slate-500">Enable configured AI chat features.</p>
                                        </div>
                                        <Switch
                                            checked={org.settings?.aiAssistant ?? true}
                                            onCheckedChange={(checked) => handleUpdate('settings', { ...org.settings, aiAssistant: checked })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Custom Domain</Label>
                                            <p className="text-sm text-slate-500">Allow using own domain (CNAME).</p>
                                        </div>
                                        <Switch
                                            checked={org.settings?.customDomain ?? false}
                                            onCheckedChange={(checked) => handleUpdate('settings', { ...org.settings, customDomain: checked })}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* DANGER TAB */}
                        <TabsContent value="danger" className="mt-6 space-y-6">
                            <Card className="border-red-200 bg-red-50">
                                <CardHeader>
                                    <CardTitle className="text-red-700">Danger Zone</CardTitle>
                                    <CardDescription className="text-red-600">Irreversible and destructive actions.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-white border border-red-200 rounded-lg">
                                        <div className="space-y-1">
                                            <div className="font-semibold text-red-900">Suspend Organization</div>
                                            <div className="text-sm text-red-700">Temporarily disable access for all users.</div>
                                        </div>
                                        <Button
                                            variant={org.isActive === true || String(org.isActive) === 'true' ? "destructive" : "outline"}
                                            onClick={handleStatusToggle}
                                        >
                                            {org.isActive === true || String(org.isActive) === 'true' ? 'Suspend Access' : 'Activate Access'}
                                        </Button>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-white border border-red-200 rounded-lg">
                                        <div className="space-y-1">
                                            <div className="font-semibold text-red-900">Delete Organization</div>
                                            <div className="text-sm text-red-700">Permanently delete organization and all data.</div>
                                        </div>
                                        <Button variant="destructive" onClick={() => alert('Delete coming soon')}>
                                            Delete Organization
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                    </Tabs>

                </main>
            </div>
        </AdminGuard>
    );
}
