'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Label } from '@/types';
import { Badge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';

export interface PageLabelAssignerProps {
  pageId: string;
  allLabels: Label[];
  assignedLabels: Label[];
}

/**
 * PageLabelAssigner Component
 *
 * Displays assigned labels as removable Badge components and provides
 * an "Add Label" dropdown to assign additional labels to the page.
 * Calls Supabase to insert/delete from page_labels table.
 */
export function PageLabelAssigner({
  pageId,
  allLabels,
  assignedLabels: initialAssignedLabels,
}: PageLabelAssignerProps) {
  const [assignedLabels, setAssignedLabels] = useState<Label[]>(
    initialAssignedLabels
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  // Get unassigned labels for the dropdown
  const assignedLabelIds = new Set(assignedLabels.map((label) => label.id));
  const unassignedLabels = allLabels.filter(
    (label) => !assignedLabelIds.has(label.id)
  );

  // Map color values to Badge color props
  const mapColorToBadgeColor = (
    color: string
  ): 'leather' | 'cream' | 'ink' | 'red' | 'green' | 'blue' | 'amber' => {
    if (color.startsWith('red')) return 'red';
    if (color.startsWith('green')) return 'green';
    if (color.startsWith('blue')) return 'blue';
    if (color.startsWith('amber')) return 'amber';
    if (color.startsWith('cream')) return 'cream';
    if (color.startsWith('ink')) return 'ink';
    return 'leather';
  };

  const handleAssignLabel = async (label: Label) => {
    setIsLoading(true);
    setIsDropdownOpen(false);

    try {
      const { error } = await supabase
        .from('page_labels')
        .insert({ page_id: pageId, label_id: label.id });

      if (error) {
        console.error('Failed to assign label:', error);
        toast.error('Failed to assign label');
        setIsLoading(false);
        return;
      }

      // Update local state optimistically
      setAssignedLabels([...assignedLabels, label]);
      toast.success(`Label "${label.name}" assigned`);
      router.refresh(); // Invalidate cache
    } catch (err) {
      console.error('Error assigning label:', err);
      toast.error('Failed to assign label');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveLabel = async (label: Label) => {
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('page_labels')
        .delete()
        .eq('page_id', pageId)
        .eq('label_id', label.id);

      if (error) {
        console.error('Failed to remove label:', error);
        toast.error('Failed to remove label');
        setIsLoading(false);
        return;
      }

      // Update local state optimistically
      setAssignedLabels(assignedLabels.filter((l) => l.id !== label.id));
      toast.success(`Label "${label.name}" removed`);
      router.refresh(); // Invalidate cache
    } catch (err) {
      console.error('Error removing label:', err);
      toast.error('Failed to remove label');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Display assigned labels as removable badges */}
      {assignedLabels.map((label) => (
        <div key={label.id} className="relative group">
          <Badge
            color={mapColorToBadgeColor(label.color)}
            className="pr-6 cursor-default"
          >
            {label.name}
          </Badge>
          <button
            onClick={() => handleRemoveLabel(label)}
            disabled={isLoading}
            className="absolute right-1 top-1/2 -translate-y-1/2 text-ink-700 hover:text-ink-900 opacity-60 group-hover:opacity-100 transition-opacity disabled:opacity-30"
            aria-label={`Remove label ${label.name}`}
            type="button"
          >
            ×
          </button>
        </div>
      ))}

      {/* Add Label dropdown */}
      {unassignedLabels.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={isLoading}
            className="px-2 py-1 text-xs font-sans font-medium rounded-full border border-leather-300 text-ink-700 hover:bg-cream-100 transition-colors disabled:opacity-50"
            aria-label="Add label"
            type="button"
          >
            + Add Label
          </button>

          {isDropdownOpen && (
            <>
              {/* Backdrop to close dropdown on outside click */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsDropdownOpen(false)}
              />

              {/* Dropdown menu */}
              <div className="absolute left-0 mt-1 bg-cream-50 border border-leather-300 rounded-md shadow-lg z-20 min-w-[150px] max-h-[200px] overflow-y-auto">
                {unassignedLabels.map((label) => (
                  <button
                    key={label.id}
                    onClick={() => handleAssignLabel(label)}
                    disabled={isLoading}
                    className="w-full px-3 py-2 text-left text-sm text-ink-900 hover:bg-cream-100 transition-colors disabled:opacity-50 flex items-center gap-2"
                    type="button"
                  >
                    <span
                      className={`w-3 h-3 rounded-full bg-${label.color}`}
                      aria-hidden="true"
                    />
                    <span>{label.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {allLabels.length === 0 && (
        <span className="text-xs text-ink-500 italic">
          No labels available. Create labels in the sidebar.
        </span>
      )}
    </div>
  );
}
