/**
 * 图像显示组件
 * 用于展示 AI 生成的图像结果
 * 
 * 功能：
 * - 显示生成的图像（支持加载状态和错误状态）
 * - 显示加载进度和耗时
 * - 支持下载生成的图像
 * - 显示图像元数据（平台、模型、生成时间）
 * - 图像加载错误处理和重试功能
 * - 鼠标悬停时显示下载按钮
 * 
 * Props：
 * - generatedImages: 生成的图像列表
 * - isClient: 是否在客户端渲染
 * - elapsedSeconds: 生成耗时
 * - imageLoading: 图像下载加载状态
 * - imageLoadError: 图像加载错误状态
 * - displayPlatformName: 显示的平台名称
 * - onDownload: 下载图像回调函数
 * - onRetry: 重试加载图像回调函数
 * - onImageLoad: 图像加载成功回调
 * - onImageError: 图像加载失败回调
 * - getImageFormat: 获取图像格式的函数
 * - generateFilename: 生成文件名的函数
 * 
 * 显示状态：
 * - 空状态：显示"等待图像生成"提示
 * - 加载中：显示加载动画和耗时
 * - 成功：显示图像和下载按钮
 * - 错误：显示错误信息和重试按钮
 */

import React from 'react';
import Image from 'next/image';

interface GeneratedImage {
  id: string;
  platform: string;
  model: string;
  prompt: string;
  imageUrl: string;
  timestamp: Date;
  isLoading?: boolean;
  error?: string;
}

interface ImageDisplayProps {
  generatedImages: GeneratedImage[];
  isClient: boolean;
  elapsedSeconds: number;
  imageLoading: boolean;
  imageLoadError: boolean;
  displayPlatformName: string;
  onDownload: (imageUrl: string, filename: string) => void;
  onRetry: (imageUrl: string) => void;
  onImageLoad: () => void;
  onImageError: () => void;
  getImageFormat: (imageUrl: string) => string;
  generateFilename: (prompt: string, format: string) => string;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({
  generatedImages,
  isClient,
  elapsedSeconds,
  imageLoading,
  imageLoadError,
  displayPlatformName,
  onDownload,
  onRetry,
  onImageLoad,
  onImageError,
  getImageFormat,
  generateFilename,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col h-[700px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4 rounded-t-xl">
        <h2 className="text-lg font-bold text-white">
          生成结果
        </h2>
        {generatedImages.length > 0 && (
          <p className="text-purple-100 text-sm mt-1">
            提示词："{generatedImages[0]?.prompt}"
          </p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-0">
        {isClient && generatedImages.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              等待图像生成
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              在左侧输入图像描述并选择 Hugging Face 模型，然后点击生成按钮开始创建
            </p>
          </div>
        ) : (
          <div className="w-full flex flex-col h-full">
            {generatedImages.length > 0 && (
              <div className="overflow-hidden flex flex-col h-full">
                {/* Image with hover download */}
                <div className="relative bg-gray-100 dark:bg-gray-600 flex-1 group">
                  {generatedImages[0]?.isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">生成中 {elapsedSeconds.toFixed(1)}秒</p>
                      </div>
                    </div>
                  ) : generatedImages[0]?.imageUrl ? (
                    <>
                      <Image
                        src={generatedImages[0].imageUrl}
                        alt={`${displayPlatformName} generated image`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        unoptimized
                        onLoad={onImageLoad}
                        onError={onImageError}
                      />
                      {/* Download button */}
                      <button
                        onClick={() => {
                          const format = getImageFormat(generatedImages[0].imageUrl);
                          const filename = generateFilename(generatedImages[0].prompt, format);
                          onDownload(generatedImages[0].imageUrl, filename);
                        }}
                        disabled={imageLoading}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                        aria-label="下载图片"
                      >
                        {imageLoading ? (
                          <div className="w-10 h-10 bg-black bg-opacity-60 rounded-full flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        ) : (
                          <svg
                            className="w-10 h-10 text-white bg-black bg-opacity-60 rounded-full p-2 shadow-lg hover:bg-opacity-80 transition-colors"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 16l4-5h-3V4h-2v7H8l4 5zm-7 2v2h14v-2H5z" />
                          </svg>
                        )}
                      </button>
                      {/* Retry button for load errors */}
                      {imageLoadError && (
                        <button
                          onClick={() => onRetry(generatedImages[0].imageUrl)}
                          className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                        >
                          重试
                        </button>
                      )}
                    </>
                  ) : generatedImages[0]?.error ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-red-500 px-4">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <p className="text-sm">{generatedImages[0]?.error}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-gray-400">
                        <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm">等待生成</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Footer / Info Section */}
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    {generatedImages[0]?.platform || 'Hugging Face'}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                   使用的模型：  {generatedImages[0]?.model || '--'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                   生成时间： {isClient && generatedImages[0] ? generatedImages[0].timestamp.toLocaleTimeString() : '--'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageDisplay; 