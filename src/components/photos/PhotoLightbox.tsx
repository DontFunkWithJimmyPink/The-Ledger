'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface PhotoLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  alt: string;
}

export function PhotoLightbox({
  isOpen,
  onClose,
  src,
  alt,
}: PhotoLightboxProps) {
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
