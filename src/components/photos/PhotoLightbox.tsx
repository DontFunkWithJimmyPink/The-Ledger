'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export interface PhotoLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  alt: string;
  photoId?: string;
  storagePath?: string;
  onDelete?: () => void;
}

export function PhotoLightbox({
  isOpen,
  onClose,
  src,
  alt,
  photoId,
  storagePath,
  onDelete,
}: PhotoLightboxProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClient();

  const handleDelete = async () => {
    if (!photoId || !storagePath || !onDelete) return;

    setIsDeleting(true);

    try {
      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from('notebook-photos')
        .remove([storagePath]);

      if (storageError) {
        console.error('Failed to delete photo from storage:', storageError);
        toast.error('Failed to delete photo');
        setIsDeleting(false);
        return;
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId);

      if (dbError) {
        console.error('Failed to delete photo record:', dbError);
        toast.error('Failed to delete photo');
        setIsDeleting(false);
        return;
      }

      toast.success('Photo deleted');
      onClose();
      onDelete();
    } catch (err) {
      console.error('Error deleting photo:', err);
      toast.error('Failed to delete photo');
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const lightboxContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink-900/90" aria-hidden="true" />

      {/* Image container */}
      <div
        className="relative z-10 max-w-7xl max-h-full"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Photo lightbox"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-cream-50 hover:text-cream-100 transition-colors bg-ink-900/50 rounded-full p-2"
          aria-label="Close lightbox"
          disabled={isDeleting}
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

        {/* Delete button - only show if photoId and storagePath are provided */}
        {photoId && storagePath && onDelete && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="absolute top-4 right-16 z-20 text-cream-50 hover:text-red-400 transition-colors bg-ink-900/50 rounded-full p-2 disabled:opacity-50"
            aria-label="Delete photo"
          >
            {isDeleting ? (
              <svg
                className="w-6 h-6 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            )}
          </button>
        )}

        {/* Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-screen object-contain"
        />
      </div>
    </div>
  );

  return createPortal(lightboxContent, document.body);
}
