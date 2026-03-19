import { useState, useCallback } from 'react';

interface UseImageUploadResult {
  imageUrl: string | null;
  showImagePrompt: boolean;
  handleImageUpload: (file: File) => void;
  handlePaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  resetImage: () => void;
}

/**
 * 图片上传管理 Hook
 * 包括：文件验证、base64 转换、粘贴事件处理
 */
export const useImageUpload = (): UseImageUploadResult => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showImagePrompt, setShowImagePrompt] = useState(false);

  /**
   * 处理图片文件上传
   * - 验证文件类型（仅接受图片）
   * - 验证文件大小（≤ 5MB）
   * - 转换为 base64 Data URL
   */
  const handleImageUpload = useCallback((file: File) => {
    // 检查文件是否为图片
    if (!file.type.startsWith('image/')) {
      return;
    }

    // 检查文件大小（限制为5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB');
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImageUrl(dataUrl);
      setShowImagePrompt(true);
    };

    reader.onerror = () => {
      console.error('图片转换失败');
      alert('图片转换失败，请重试');
    };

    reader.readAsDataURL(file);
  }, []);

  /**
   * 处理粘贴事件
   * 自动检测粘贴内容中的图片并上传
   */
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            handleImageUpload(file);
          }
          break;
        }
      }
    },
    [handleImageUpload]
  );

  /**
   * 重置图片状态
   * 用于消息发送后清空图片
   */
  const resetImage = useCallback(() => {
    setImageUrl(null);
    setShowImagePrompt(false);
  }, []);

  return {
    imageUrl,
    showImagePrompt,
    handleImageUpload,
    handlePaste,
    resetImage,
  };
};
