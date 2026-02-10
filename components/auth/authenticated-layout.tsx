'use client';

import { usePathname } from 'next/navigation';

import { Navigation } from '@/components/navigation';

const NO_NAV_PATHS = ['/login', '/register'];

export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = !NO_NAV_PATHS.includes(pathname);

  return (
    <>
      {showNav && <Navigation />}
      {children}
    </>
  );
}
