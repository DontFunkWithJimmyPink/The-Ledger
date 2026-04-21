'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Label } from '@/types';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ColorPicker } from '@/components/ui/ColorPicker';

export interface LabelManagerProps {
  className?: string;
}

export function LabelManager({ className = '' }: LabelManagerProps) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('leather-300');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingLabelId, setDeletingLabelId] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get active label from URL params
  const activeLabelId = searchParams.get('labelId');

  // Fetch labels on mount
  useEffect(() => {
    fetchLabels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLabels = async () => {
    setIsLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('Failed to get user:', userError);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('labels')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) {
        console.error('Failed to fetch labels:', error);
        toast.error('Failed to load labels');
      } else {
        setLabels(data || []);
      }
    } catch (err) {
      console.error('Error fetching labels:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLabel = async () => {
    const trimmedName = newLabelName.trim();

    if (!trimmedName) {
      toast.error('Label name is required');
      return;
    }

    setIsSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('Failed to get user:', userError);
        toast.error('Failed to create label');
        setIsSaving(false);
        return;
      }

      const { data, error } = await supabase
        .from('labels')
        .insert({ user_id: user.id, name: trimmedName, color: newLabelColor })
        .select('*')
        .single();

      if (error) {
        console.error('Failed to insert label:', error);
        if (error.code === '23505') {
          // Unique constraint violation
          toast.error(`You already have a label called "${trimmedName}"`);
        } else {
          toast.error('Failed to create label');
        }
        setIsSaving(false);
        return;
      }

      toast.success('Label created');
      setLabels([...labels, data]);
      setIsModalOpen(false);
      setNewLabelName('');
      setNewLabelColor('leather-300');
      router.refresh();
    } catch (err) {
      console.error('Error creating label:', err);
      toast.error('Failed to create label');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLabel = async (labelId: string, labelName: string) => {
    setDeletingLabelId(labelId);

    try {
      const { error } = await supabase
        .from('labels')
        .delete()
        .eq('id', labelId);

      if (error) {
        console.error('Failed to delete label:', error);
        toast.error('Failed to delete label');
        setDeletingLabelId(null);
        return;
      }

      toast.success(`Label "${labelName}" deleted`);
      setLabels(labels.filter((l) => l.id !== labelId));
      router.refresh();
    } catch (err) {
      console.error('Error deleting label:', err);
      toast.error('Failed to delete label');
    } finally {
      setDeletingLabelId(null);
    }
  };

  const handleOpenModal = () => {
    setNewLabelName('');
    setNewLabelColor('leather-300');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewLabelName('');
    setNewLabelColor('leather-300');
  };

  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      'leather-300': 'bg-leather-300',
      'leather-500': 'bg-leather-500',
      'leather-700': 'bg-leather-700',
      'cream-200': 'bg-cream-200',
      'red-100': 'bg-red-100',
      'green-100': 'bg-green-100',
      'blue-100': 'bg-blue-100',
      'amber-100': 'bg-amber-100',
    };
    return colorMap[color] || 'bg-leather-300';
  };

  const handleLabelClick = (labelId: string) => {
    const params = new URLSearchParams(searchParams.toString());

    // If clicking the active label, clear the filter
    if (activeLabelId === labelId) {
      params.delete('labelId');
    } else {
      // Set the new label filter
      params.set('labelId', labelId);
    }

    // Navigate to notebook with the updated params
    router.push(`/notebook${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-xs font-semibold text-cream-300 uppercase tracking-wider font-sans">
          Labels
        </h2>
        <button
          onClick={handleOpenModal}
          className="text-cream-300 hover:text-cream-50 transition-colors"
          aria-label="New label"
          title="New label"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>

      {isLoading ? (
        <div className="px-4 py-3 text-sm text-cream-300 font-sans">
          <p className="italic">Loading labels...</p>
        </div>
      ) : labels.length === 0 ? (
        <div className="px-4 py-3 text-sm text-cream-300 font-sans">
          <p className="italic">No labels yet</p>
        </div>
      ) : (
        <div className="px-4 space-y-2">
          {labels.map((label) => {
            const isActive = activeLabelId === label.id;
            return (
              <div key={label.id} className="flex items-center gap-2 group">
                <button
                  onClick={() => handleLabelClick(label.id)}
                  className={`flex items-center gap-2 flex-1 px-2 py-1 rounded text-sm font-sans transition-colors ${
                    isActive
                      ? 'bg-leather-700 text-cream-50'
                      : 'text-cream-50 hover:bg-leather-700'
                  }`}
                  aria-label={`Filter by ${label.name}`}
                  title={`Filter by ${label.name}`}
                >
                  <div
                    className={`w-3 h-3 rounded ${getColorClass(label.color)}`}
                  />
                  <span className="truncate">{label.name}</span>
                </button>
                <button
                  onClick={() => handleDeleteLabel(label.id, label.name)}
                  disabled={deletingLabelId === label.id}
                  className="opacity-0 group-hover:opacity-100 text-cream-300 hover:text-red-400 transition-all disabled:opacity-50"
                  aria-label={`Delete ${label.name}`}
                  title={`Delete ${label.name}`}
                >
                  {deletingLabelId === label.id ? (
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  ) : (
                    <span className="text-lg leading-none">×</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="New Label">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateLabel();
          }}
          className="space-y-4"
        >
          <Input
            label="Name"
            value={newLabelName}
            onChange={(e) => setNewLabelName(e.target.value)}
            placeholder="e.g., Work, Personal, Ideas"
            autoFocus
            required
          />

          <ColorPicker
            label="Color"
            value={newLabelColor}
            onChange={setNewLabelColor}
          />

          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSaving || !newLabelName.trim()}
            >
              {isSaving ? 'Creating...' : 'Create Label'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
