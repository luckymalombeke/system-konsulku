import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function Layout({ children, variant = 'mahasiswa' }) {
  return (
    <div className="flex">
      <Sidebar variant={variant} />
      <Topbar variant={variant} />
      <main className="ml-[260px] mt-[64px] p-6 bg-[#F8F7FF] min-h-screen flex-1">
        {children}
      </main>
    </div>
  );
}
