'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';

export interface PhotoMetadata {
  id: string;
  storagePath: string;
  signedUrl: string;
  filename: string;
}

export interface PhotoUploadButtonProps {
  pageId: string;
  onUploadSuccess?: (metadata: PhotoMetadata) => void;
}

const MAX_FILE_SIZE = 10485760; // 10 MB in bytes (FR-019)

/**
 * PhotoUploadButton Component
 *
 * Renders a file input for image uploads with the following functionality:
 * - Validates file size ≤ 10 MB (shows toast error if exceeded)
 * - Uploads to Supabase Storage bucket 'notebook-photos'
 * - Inserts row in 'photos' table
 * - Returns signed URL via createSignedUrl for Tiptap image insertion
 *
 * Storage path format: {userId}/{pageId}/{timestamp}_{filename}
 */
export function PhotoUploadButton({
  pageId,
  onUploadSuccess,
}: PhotoUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const supabase = createClient();

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be selected again
    event.target.value = '';

    // Validate file size (FR-019)
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Photo must be under 10 MB');
      return;
    }

    setIsUploading(true);

    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('Failed to get user:', userError);
        toast.error('Failed to upload photo');
        setIsUploading(false);
        return;
      }

      // Generate storage path: {userId}/{pageId}/{timestamp}_{filename}
      const timestamp = Date.now();
      const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${user.id}/${pageId}/${timestamp}_${sanitizedFilename}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('notebook-photos')
        .upload(storagePath, file);

      if (uploadError) {
        console.error('Failed to upload photo to storage:', uploadError);
        toast.error('Upload failed');
        setIsUploading(false);
        return;
      }

      // Insert record in photos table
      const { data: photoData, error: insertError } = await supabase
        .from('photos')
        .insert({
          page_id: pageId,
          user_id: user.id,
          storage_path: storagePath,
          filename: file.name,
          mime_type: file.type,
          size_bytes: file.size,
        })
        .select('id')
        .single();

      if (insertError || !photoData) {
        console.error('Failed to insert photo record:', insertError);
        // Try to clean up the uploaded file
        await supabase.storage.from('notebook-photos').remove([storagePath]);
        toast.error('Upload failed');
        setIsUploading(false);
        return;
      }

      // Generate signed URL (1 hour expiry)
      const { data: signedUrlData, error: signedUrlError } = await supabase
        .storage
        .from('notebook-photos')
        .createSignedUrl(storagePath, 3600);

      if (signedUrlError || !signedUrlData) {
        console.error('Failed to create signed URL:', signedUrlError);
        toast.error('Upload failed');
        setIsUploading(false);
        return;
      }

      // Notify parent component of successful upload
      if (onUploadSuccess) {
        onUploadSuccess({
          id: photoData.id,
          storagePath,
          signedUrl: signedUrlData.signedUrl,
          filename: file.name,
        });
      }

      toast.success('Photo uploaded');
    } catch (err) {
      console.error('Failed to upload photo:', err);
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        data-testid="photo-upload-input"
      />
      <Button
        variant="ghost"
        onClick={handleButtonClick}
        disabled={isUploading}
        type="button"
        aria-label={isUploading ? 'Uploading photo...' : 'Upload photo'}
        title="Upload photo"
      >
        {isUploading ? '...' : '📷'}
      </Button>
    </>
  );
}
