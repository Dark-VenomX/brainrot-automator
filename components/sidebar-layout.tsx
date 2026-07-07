'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWorkspace = pathname?.startsWith('/workspace') || pathname === '/how-to-use';

  if (!isWorkspace) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
