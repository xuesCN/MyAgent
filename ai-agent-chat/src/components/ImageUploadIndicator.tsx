import React from 'react';
import { ImageIcon } from 'lucide-react';

interface ImageUploadIndicatorProps {
  visible: boolean;
}

export const ImageUploadIndicator: React.FC<ImageUploadIndicatorProps> = ({
  visible,
}) => {
  if (!visible) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-tech-green/10 border border-tech-green/30 rounded-full text-xs text-tech-green animate-fadeIn">
      <ImageIcon className="w-3 h-3" />
      <span>图片已传入</span>
    </div>
  );
};
