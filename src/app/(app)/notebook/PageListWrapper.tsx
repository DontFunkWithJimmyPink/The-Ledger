'use client';

import { PageList } from '@/components/layout';
import type { Page } from '@/types';

export interface PageListWrapperProps {
  pages: Page[];
}

/**
 * Client component wrapper for PageList
 * Allows server component to pass pages to client-side drag-and-drop component
 */
export function PageListWrapper({ pages }: PageListWrapperProps) {
  return <PageList pages={pages} />;
}
