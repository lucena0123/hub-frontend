'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { useAuth } from '@/contexts/auth-context';

const PUBLIC_PATHS = ['/login', '/register'];
const PUBLIC_PREFIXES = ['/forms/'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublic =
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (!loading && !isAuthenticated && !isPublic) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, isPublic, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated && !isPublic) return null;

  return <>{children}</>;
}
