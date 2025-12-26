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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/logo.png"
            alt="PaintFlow"
            width={360}
            height={96}
            className="h-20 w-auto object-contain mx-auto"
            priority
          />
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    className="text-sm text-[#0D5C75] hover:text-[#094A5E] font-medium"
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
                    className="h-11 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-[#0D5C75] hover:bg-[#094A5E] text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">Demo credentials</span>
                </div>
              </div>

              <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-sm text-slate-600 text-center">
                  Use any email and password to access the demo
                </p>
                <div className="mt-2 flex gap-2 justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
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
        <p className="text-center text-sm text-slate-500 mt-6">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            className="text-[#F26522] hover:text-[#D4571D] font-medium"
            onClick={() => router.push('/register')}
          >
            Sign up
          </button>
        </p>

        <p className="text-center text-xs text-slate-400 mt-4">
          &copy; {new Date().getFullYear()} PaintPro. All rights reserved.
        </p>
      </div>
    </div>
  );
}
