import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateRDS(detections: { class: string }[]): number {
  const weights: Record<string, number> = {
    'pothole': 10,
    'linear crack': 5,
    'alligator crack': 7
  };

  const penalty = detections.reduce((acc, det) => {
    return acc + (weights[det.class] || 0);
  }, 0);

  return Math.max(0, 100 - penalty);
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'pending': return 'bg-brand-yellow-50 text-brand-yellow-700 border-brand-yellow-100';
    case 'reviewed': return 'bg-brand-blue-50 text-brand-blue border-brand-blue-100';
    case 'diteruskan': return 'bg-green-50 text-green-700 border-green-200';
    default: return 'bg-slate-50 text-slate-500 border-slate-200';
  }
}

export function getScoreColor(score: number) {
  if (score >= 80) return 'text-green-600';
  if (score >= 50) return 'text-brand-yellow-700';
  return 'text-red-500';
}

export function compressImage(file: File, maxWidth = 800, maxHeight = 800, quality = 0.6): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context not available'));
        
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}
