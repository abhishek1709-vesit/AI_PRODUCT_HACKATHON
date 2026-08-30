import React, { useState } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, X, Menu, ChevronRight } from 'lucide-react';

const navItems = [
  { to: '/evaluations', label: 'Evaluations', icon: ClipboardList },
];

function NavItem({ to, label, icon: Icon, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 ${
          isActive
            ? 'bg-white/10 text-white'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`
      }
    >
      <Icon size={16} aria-hidden="true" />
      {label}
    </NavLink>
  );
}

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-500 rounded flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">ProcurementIQ</p>
              <p className="text-slate-500 text-[10px] leading-tight">Procurement Intelligence</p>
            </div>
          </div>
        </Link>
        {/* Mobile close */}
        <button
          onClick={onMobileClose}
          className="lg:hidden text-slate-400 hover:text-white transition-colors p-1 rounded"
          aria-label="Close navigation"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Main navigation">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-3 mb-2">
          Workspace
        </p>
        {navItems.map(item => (
          <NavItem key={item.to} {...item} onClick={onMobileClose} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-indigo-300 text-xs font-bold">PM</span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-medium truncate">Procurement Manager</p>
            <p className="text-slate-500 text-[10px] truncate">Enterprise Account</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-slate-900 min-h-screen flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <aside className="relative z-50 flex flex-col w-64 bg-slate-900 min-h-screen shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
