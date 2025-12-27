'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const org = searchParams.get('org');
    const redirect = searchParams.get('redirect') || '/painel';

    if (!token || !org) {
      setError('Invalid callback parameters');
      return;
    }

    // Store token and org in localStorage for iframe compatibility
    // Since third-party cookies are blocked, we use localStorage
    localStorage.setItem('paintpro_session_token', token);
    localStorage.setItem('paintpro_org_id', org);

    // Also try to set cookies (might work in some cases)
    document.cookie = `paintpro_session=${token}; path=/; SameSite=None; Secure`;
    document.cookie = `paintpro_org_id=${org}; path=/; SameSite=None; Secure`;

    // Redirect to dashboard
    router.replace(redirect);
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="mt-4 text-blue-600 underline"
          >
            Ir para login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0D5C75] mx-auto" />
        <p className="mt-4 text-slate-600">Autenticando...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-[#0D5C75]" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
