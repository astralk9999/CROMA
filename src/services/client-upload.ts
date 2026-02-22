/**
 * Service for handling client-side image uploads to Cloudinary.
 * Uses unsigned presets to avoid exposing API secrets.
 */
export async function uploadToCloudinaryClient(
    files: File[],
    onProgress?: (progress: number) => void
): Promise<string[]> {
    const cloudName = (import.meta as any).env.PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = (import.meta as any).env.PUBLIC_CLOUDINARY_PRESET || 'croma_uploads';
    const urls: string[] = [];

    for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);
        formData.append('upload_preset', preset);
        formData.append('folder', 'croma/returns');

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData
        });

        if (!res.ok) throw new Error('Error al subir imágenes');
        const data = await res.json();
        urls.push(data.secure_url);

        if (onProgress) {
            onProgress(Math.round(((i + 1) / files.length) * 100));
        }
    }
    return urls;
}
