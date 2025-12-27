'use client';

import { Header } from '@/components/layout/header';
import { AIAssistantWidget } from '@/components/ai/ai-assistant-widget';
import { OrganizationProvider } from '@/contexts/organization-context';
import { AuthProvider } from '@/components/auth/auth-provider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <div className="min-h-screen bg-slate-50">
          {/* Header with Logo and Navigation */}
          <Header />

          {/* Page content */}
          <main className="p-4 lg:p-6">{children}</main>

          {/* Global AI Assistant */}
          <AIAssistantWidget />
        </div>
      </OrganizationProvider>
    </AuthProvider>
  );
}
