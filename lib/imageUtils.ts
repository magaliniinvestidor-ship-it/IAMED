export async function resizeImageToJpeg(
  dataUrl: string,
  maxDim = 512,
  quality = 0.8,
): Promise<string> {
  try {
    if (!dataUrl.startsWith('data:image/') || dataUrl.includes('svg')) return dataUrl;
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Failed to load image'));
      el.src = dataUrl;
    });
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', quality);
  } catch {
    return dataUrl;
  }
}

const COMPRESSIBLE_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const COMPRESSION_MAX_DIM = 1920;
const COMPRESSION_QUALITY = 0.82;

export interface CompressResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  wasCompressed: boolean;
}

export async function compressImageFile(file: File): Promise<CompressResult> {
  const originalSize = file.size;
  if (!COMPRESSIBLE_IMAGE_TYPES.has(file.type)) {
    return { file, originalSize, compressedSize: originalSize, wasCompressed: false };
  }
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Failed to decode image'));
      el.src = dataUrl;
    });
    const scale = Math.min(1, COMPRESSION_MAX_DIM / Math.max(img.width, img.height));
    const newW = Math.max(1, Math.round(img.width * scale));
    const newH = Math.max(1, Math.round(img.height * scale));
    if (scale === 1 && file.type === 'image/jpeg' && file.size < 500 * 1024) {
      return { file, originalSize, compressedSize: originalSize, wasCompressed: false };
    }
    const canvas = document.createElement('canvas');
    canvas.width = newW;
    canvas.height = newH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { file, originalSize, compressedSize: originalSize, wasCompressed: false };
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, newW, newH);
    ctx.drawImage(img, 0, 0, newW, newH);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', COMPRESSION_QUALITY);
    });
    if (!blob || blob.size >= originalSize) {
      return { file, originalSize, compressedSize: originalSize, wasCompressed: false };
    }
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const compressedFile = new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
    return { file: compressedFile, originalSize, compressedSize: blob.size, wasCompressed: true };
  } catch (err) {
    console.warn('Image compression failed, using original:', err);
    return { file, originalSize, compressedSize: originalSize, wasCompressed: false };
  }
}