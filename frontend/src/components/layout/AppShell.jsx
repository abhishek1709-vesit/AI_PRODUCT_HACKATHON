import React, { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';
import { useLocation } from 'react-router-dom';

function getPageMeta(pathname) {
  if (pathname === '/evaluations') {
    return { title: 'Procurement Evaluations', breadcrumb: 'Workspace' };
  }
  if (pathname.startsWith('/evaluations/')) {
    return { title: 'Evaluation Detail', breadcrumb: 'Evaluations' };
  }
  return { title: 'ProcureIQ', breadcrumb: '' };
}

export default function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { title, breadcrumb } = getPageMeta(location.pathname);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar
          onMenuClick={() => setMobileOpen(true)}
          title={title}
          breadcrumb={breadcrumb}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
