'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LabelManager } from '@/components/labels/LabelManager';
import { SidebarPageList } from './SidebarPageList';

export interface SidebarProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({
  className = '',
  isOpen = true,
  onClose,
}: SidebarProps) {
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
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-ink-900/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`flex flex-col w-64 bg-leather-900 text-cream-50 border-r border-leather-500
          ${onClose ? 'fixed inset-y-0 left-0 z-50 lg:relative lg:z-0' : ''}
          ${onClose && !isOpen ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
          transition-transform duration-300 ease-in-out ${className}`}
      >
        {/* Logo/Title */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-leather-700">
          <h1 className="text-xl font-bold font-serif">The Ledger</h1>

          {/* Close button for mobile */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-2 text-cream-50 hover:bg-leather-700 rounded-md transition-colors"
              aria-label="Close sidebar"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 sm:p-4 overflow-y-auto">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 sm:px-4 py-2 rounded-md font-sans text-sm transition-colors ${
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
    </>
  );
}
