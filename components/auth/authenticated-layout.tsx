'use client';

import { usePathname } from 'next/navigation';

import { Navigation } from '@/components/navigation';

const NO_NAV_PATHS = ['/login', '/register'];
const NO_NAV_PREFIXES = ['/forms/'];

export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav =
    !NO_NAV_PATHS.includes(pathname) &&
    !NO_NAV_PREFIXES.some((p) => pathname.startsWith(p));

  return (
    <>
      {showNav && <Navigation />}
      {children}
    </>
  );
}
