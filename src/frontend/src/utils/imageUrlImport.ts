import { ExternalBlob } from '../backend';
import { toast } from 'sonner';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Validates and fetches an image from a URL
 * @param url - The image URL (must be http/https)
 * @returns ExternalBlob instance or null if failed
 */
export async function importImageFromUrl(url: string): Promise<ExternalBlob | null> {
  // Validate URL format
  if (!url.trim()) {
    toast.error('Please enter a URL');
    return null;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    toast.error('Invalid URL format. Please enter a valid http:// or https:// URL.');
    return null;
  }

  // Only allow http/https protocols
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    toast.error('Only http:// and https:// URLs are supported.');
    return null;
  }

  try {
    // Fetch the image
    const response = await fetch(url);
    
    if (!response.ok) {
      toast.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      return null;
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      toast.error('The URL does not point to a valid image file.');
      return null;
    }

    // Get the blob
    const blob = await response.blob();

    // Check size
    if (blob.size > MAX_IMAGE_SIZE) {
      toast.error(`Image size (${(blob.size / 1024 / 1024).toFixed(2)}MB) exceeds the maximum allowed size of 5MB.`);
      return null;
    }

    // Convert to Uint8Array
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Create ExternalBlob
    const externalBlob = ExternalBlob.fromBytes(uint8Array);
    
    toast.success('Image imported successfully from URL');
    return externalBlob;
  } catch (error: any) {
    console.error('Image import error:', error);
    toast.error(`Failed to import image: ${error.message || 'Network error'}`);
    return null;
  }
}
