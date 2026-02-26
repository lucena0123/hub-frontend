'use client';

import { usePathname } from 'next/navigation';
import { AppSidebar } from '@/components/navigation/app-sidebar';

const NO_NAV_PATHS = ['/login', '/register'];
const NO_NAV_PREFIXES = ['/forms/'];

export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav =
    !NO_NAV_PATHS.includes(pathname) &&
    !NO_NAV_PREFIXES.some((p) => pathname.startsWith(p));

  if (!showNav) {
    return <>{children}</>;
  }

  return (
    <div className="app-layout">
      <AppSidebar />
      <main className="app-main" id="main-content">
        {children}
      </main>
    </div>
  );
}
