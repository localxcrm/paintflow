'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminGuard } from '@/components/auth/admin-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    Building2,
    DollarSign,
    Activity,
    Search,
    MoreHorizontal,
    LogOut
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


interface AdminStats {
    totalUsers: number;
    totalOrgs: number;
    activeSubscriptions: number;
    mrr: number; // Monthly Recurring Revenue (Placeholder)
}

interface Organization {
    id: string;
    name: string;
    plan: string;
    isActive: boolean;
    createdAt: string;
    userCount: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats>({
        totalUsers: 0,
        totalOrgs: 0,
        activeSubscriptions: 0,
        mrr: 0
    });
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch Stats and Orgs from secure API
            const t = Date.now();
            const [statsRes, orgsRes] = await Promise.all([
                fetch(`/api/admin/stats?t=${t}`, { cache: 'no-store' }),
                fetch(`/api/admin/organizations?t=${t}`, { cache: 'no-store' })
            ]);

            if (!statsRes.ok || !orgsRes.ok) throw new Error('Failed to fetch data');

            const statsData = await statsRes.json();
            const orgsData = await orgsRes.json();

            setStats(statsData);
            setOrgs(orgsData);
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (orgId: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/admin/organizations/${orgId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !currentStatus }),
            });

            if (!res.ok) throw new Error('Failed to update status');

            // Refresh data
            fetchData();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update organization status');
        }
    };

    const router = useRouter();

    const filteredOrgs = orgs.filter(org =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AdminGuard>
            <div className="min-h-screen bg-slate-50">
                {/* Top Bar */}
                <header className="bg-white border-b px-6 h-16 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-2 font-bold text-xl text-slate-900">
                        <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-sm tracking-widest">ADMIN</span>
                        <span>Dashboard</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-500">Super Admin Mode</span>
                        <Button variant="outline" size="sm" onClick={() => router.push('/painel')}>
                            <LogOut className="w-4 h-4 mr-2" />
                            Exit to App
                        </Button>
                    </div>
                </header>

                <main className="p-6 max-w-7xl mx-auto space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                <Users className="h-4 w-4 text-slate-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                                <p className="text-xs text-slate-500">Registered users</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Organizations</CardTitle>
                                <Building2 className="h-4 w-4 text-slate-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.totalOrgs}</div>
                                <p className="text-xs text-slate-500">Active tenants</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Subs</CardTitle>
                                <Activity className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
                                <p className="text-xs text-slate-500">Paid plans</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Est. MRR</CardTitle>
                                <DollarSign className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${stats.mrr}</div>
                                <p className="text-xs text-slate-500">Monthly revenue</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Org List */}
                    <Card className="border shadow-sm">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Organizations</CardTitle>
                                <div className="relative w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                                    <Input
                                        placeholder="Search organizations..."
                                        className="pl-9"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 border-b">
                                        <tr>
                                            <th className="h-10 px-4 font-medium text-slate-500">Name</th>
                                            <th className="h-10 px-4 font-medium text-slate-500">Plan</th>
                                            <th className="h-10 px-4 font-medium text-slate-500">Status</th>
                                            <th className="h-10 px-4 font-medium text-slate-500">Created At</th>
                                            <th className="h-10 px-4 font-medium text-slate-500 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan={5} className="h-24 text-center text-slate-500">
                                                    Loading...
                                                </td>
                                            </tr>
                                        ) : filteredOrgs.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="h-24 text-center text-slate-500">
                                                    No organizations found.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredOrgs.map((org) => (
                                                <tr key={org.id} className="border-b last:border-0 hover:bg-slate-50/50">
                                                    <td className="p-4 font-medium">{org.name}</td>
                                                    <td className="p-4">
                                                        <Badge variant={org.plan === 'free' ? 'secondary' : 'default'} className="uppercase text-[10px]">
                                                            {org.plan}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4">
                                                        <Badge variant={org.isActive === true || String(org.isActive) === 'true' ? 'default' : 'destructive'} className="text-[10px]">
                                                            {org.isActive === true || String(org.isActive) === 'true' ? 'Active' : 'Suspended'}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 text-slate-500">
                                                        {new Date(org.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                <DropdownMenuItem onClick={() => router.push(`/admin/organizations/${org.id}`)}>View Details</DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleStatusChange(org.id, org.isActive)} className={org.isActive === true || String(org.isActive) === 'true' ? "text-red-600" : "text-green-600"}>
                                                                    {org.isActive === true || String(org.isActive) === 'true' ? 'Suspend' : 'Activate'}
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </AdminGuard>
    );
}
