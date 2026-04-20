import Image from '@tiptap/extension-image';

/**
 * Custom Image Extension
 *
 * Extends the default Tiptap Image extension to support custom data attributes
 * for photo metadata (data-photo-id and data-storage-path).
 * These attributes are used for photo deletion functionality.
 */
export const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      'data-photo-id': {
        default: null,
        parseHTML: (element) => element.getAttribute('data-photo-id'),
        renderHTML: (attributes) => {
          if (!attributes['data-photo-id']) {
            return {};
          }
          return {
            'data-photo-id': attributes['data-photo-id'],
          };
        },
      },
      'data-storage-path': {
        default: null,
        parseHTML: (element) => element.getAttribute('data-storage-path'),
        renderHTML: (attributes) => {
          if (!attributes['data-storage-path']) {
            return {};
          }
          return {
            'data-storage-path': attributes['data-storage-path'],
          };
        },
      },
    };
  },
});
