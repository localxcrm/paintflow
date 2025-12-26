'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!formData.email || !formData.password) {
      setError('Please enter your email and password');
      setIsLoading(false);
      return;
    }

    // Try to login via API
    const result = await authApi.login({
      email: formData.email,
      password: formData.password,
    });

    if (result.error) {
      // If API fails (e.g., no database), fall back to demo mode
      if (result.error.includes('Network') || result.error.includes('Failed')) {
        // Demo mode - store user in localStorage
        localStorage.setItem('paintpro_user', JSON.stringify({
          email: formData.email,
          name: formData.email.split('@')[0],
          loggedInAt: new Date().toISOString(),
        }));
        router.push('/painel');
      } else {
        setError(result.error);
        setIsLoading(false);
      }
    } else if (result.data) {
      // Store user info
      localStorage.setItem('paintpro_user', JSON.stringify({
        ...result.data.user,
        loggedInAt: new Date().toISOString(),
      }));
      router.push('/painel');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh p-4 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-teal/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-orange/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <Image
            src="/logo.png"
            alt="PaintFlow"
            width={360}
            height={96}
            className="h-20 w-auto object-contain mx-auto drop-shadow-sm"
            priority
          />
        </div>

        {/* Login Card */}
        <Card variant="glass" className="border-white/20 animate-in fade-in zoom-in-95 duration-500">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-3xl text-center font-bold tracking-tight text-gradient">Welcome back</CardTitle>
            <CardDescription className="text-center text-slate-500 font-medium">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50/50 backdrop-blur-sm rounded-lg border border-red-100/50 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-semibold ml-1">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-slate-700 font-semibold">Password</Label>
                  <button
                    type="button"
                    className="text-sm text-[#0D5C75] hover:text-[#094A5E] font-bold transition-colors"
                    onClick={() => alert('Password reset coming soon!')}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="premium"
                size="lg"
                className="w-full mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                  <span className="px-3 bg-white/0 text-slate-400 backdrop-blur-sm">Demo Access</span>
                </div>
              </div>

              <div className="mt-6 p-5 bg-white/30 backdrop-blur-md rounded-xl border border-white/40 shadow-inner">
                <p className="text-xs text-slate-500 text-center leading-relaxed">
                  Use any email and password to access the demo environment
                </p>
                <div className="mt-4 flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="bg-white/50 hover:bg-white/80 border-slate-200/50 font-bold"
                    onClick={() => {
                      setFormData({
                        email: 'demo@paintpro.com',
                        password: 'demo123',
                      });
                    }}
                  >
                    Fill Demo Credentials
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-slate-600 mt-8 font-medium">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            className="text-[#F26522] hover:text-[#D4571D] font-bold transition-colors"
            onClick={() => router.push('/register')}
          >
            Sign up
          </button>
        </p>

        <p className="text-center text-xs text-slate-400 mt-6 font-medium">
          &copy; {new Date().getFullYear()} PaintFlow. Premium Painting OS.
        </p>
      </div>
    </div>
  );
}
