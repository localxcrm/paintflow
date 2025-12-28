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
        <div className="min-h-screen h-screen flex flex-col bg-slate-50 overflow-hidden">
          {/* Header with Logo and Navigation */}
          <Header />

          {/* Page content - scrollable */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>

          {/* Global AI Assistant */}
          <AIAssistantWidget />
        </div>
      </OrganizationProvider>
    </AuthProvider>
  );
}
