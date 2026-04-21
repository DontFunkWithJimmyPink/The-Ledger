'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LabelManager } from '@/components/labels/LabelManager';
import { SidebarPageList } from './SidebarPageList';

export interface SidebarProps {
  className?: string;
}

export function Sidebar({ className = '' }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/notebook') {
      return pathname === '/notebook' || pathname.startsWith('/notebook/');
    }
    return pathname === path;
  };

  const navItems = [
    { href: '/notebook', label: 'Notebook', icon: '📓' },
    { href: '/reminders', label: 'Reminders', icon: '🔔' },
  ];

  return (
    <aside
      className={`flex flex-col w-64 bg-leather-900 text-cream-50 border-r border-leather-500 ${className}`}
    >
      {/* Logo/Title */}
      <div className="p-6 border-b border-leather-700">
        <h1 className="text-xl font-bold font-serif">The Ledger</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2 rounded-md font-sans text-sm transition-colors ${
                  isActive(item.href)
                    ? 'bg-leather-700 text-cream-50'
                    : 'text-cream-100 hover:bg-leather-700 hover:text-cream-50'
                }`}
              >
                <span className="text-lg" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Pages Section */}
        <div className="mt-6 pt-6 border-t border-leather-700">
          <h2 className="px-2 mb-3 text-xs font-semibold text-cream-400 uppercase tracking-wider">
            Pages
          </h2>
          <SidebarPageList />
        </div>

        {/* Label Filter Section */}
        <div className="mt-6 pt-6 border-t border-leather-700">
          <LabelManager />
        </div>
      </nav>
    </aside>
  );
}
