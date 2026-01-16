export function formatPrice(price: number): string {
  // Use the price directly as it comes from the DB in Euros (decimal format)
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export async function uploadImageToSupabase(
  file: File,
  productSlug: string,
  supabase: any
): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `products/${productSlug}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Upload error:', uploadError);
    return null;
  }

  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

// =============================================
// CLOUDINARY HELPERS
// =============================================

/**
 * Upload image to Cloudinary using unsigned upload preset
 * @param file - The file to upload
 * @returns The secure URL of the uploaded image
 */
export async function uploadImageToCloudinary(file: File): Promise<string | null> {
  const cloudName = import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.PUBLIC_CLOUDINARY_PRESET || 'croma_uploads';

  if (!cloudName) {
    console.error('Missing Cloudinary cloud name');
    return null;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'croma/products');

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Error en la subida a Cloudinary');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Error subiendo imagen:', error);
    return null;
  }
}

/**
 * Optimize a Cloudinary URL with automatic transformations
 * - f_auto: Automatic format (WebP, AVIF for supported browsers)
 * - q_auto: Automatic quality optimization
 * - w_XXX: Width resize (optional)
 * 
 * @param url - The original Cloudinary URL
 * @param width - Optional width to resize to
 * @returns The optimized URL
 */
export function optimizeCloudinaryUrl(url: string, width?: number): string {
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }

  // Find the /upload/ part and insert transformations after it
  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) {
    return url;
  }

  const beforeUpload = url.substring(0, uploadIndex + 8); // includes '/upload/'
  const afterUpload = url.substring(uploadIndex + 8);

  // Build transformation string
  const transformations = ['f_auto', 'q_auto'];
  if (width) {
    transformations.push(`w_${width}`);
  }

  return `${beforeUpload}${transformations.join(',')}/${afterUpload}`;
}

/**
 * Get optimized image URL for product catalog (500px width)
 */
export function getProductThumbnail(url: string): string {
  return optimizeCloudinaryUrl(url, 500);
}

/**
 * Get optimized image URL for product detail page (1000px width)
 */
export function getProductDetailImage(url: string): string {
  return optimizeCloudinaryUrl(url, 1000);
}

