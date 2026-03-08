/**
 * 图像生成器主页组件
 * 提供用户界面用于输入提示词并生成 AI 图像
 * 
 * 功能：
 * - 文本输入框：用户输入图像描述提示词
 * - 模型选择器：选择不同的 AI 图像生成模型
 * - 图像生成：调用后端 API 生成图像
 * - 图像展示：显示生成的图像结果
 * - 图像下载：支持下载生成的图像
 * - 示例提示词：提供预设的示例提示词供快速使用
 * - 加载状态：显示生成进度和耗时
 * - 错误处理：显示生成失败的错误信息
 * 
 * 支持的平台：
 * - ModelScope：通过 /api/v1/modelscope/:modelId API 端点调用
 * 
 * 支持的模型：
 * - Z-Image：基于 Gradio API 的图像生成模型
 * 
 * 状态管理：
 * - inputValue：输入的提示词文本
 * - selectedModel：当前选择的模型
 * - generatedImages：生成的图像列表
 * - isGenerating：是否正在生成图像
 * - elapsedSeconds：生成耗时
 * - imageLoadError：图像加载错误状态
 * 
 * API 调用：
 * - 开发环境：POST /api/v1/modelscope/:modelId，GET /api/v1/token-status
 * - 生产环境（Node Functions）：POST /v1/modelscope/:id，GET /v1/token-status
 */

'use client';

import Image from "next/image";
import { useState, useRef, useEffect, useMemo } from "react";
import ModelDropdown from "../components/ModelDropdown";
import ImageDisplay from "../components/ImageDisplay";

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

const platform = {
  id: 'modelscope',
  name: 'ModelScope',
};

// Base model definitions
const baseModels: Array<{ id: string; name: string; value: string; platform: string; disabled: boolean }> = [
  { id: 'z-image', name: 'Z-Image', value: 'z-image', platform: 'ModelScope', disabled: false },
];

/**
 * 获取 API 基础路径
 * 开发环境使用 /api/v1/，生产环境（Edge Functions）使用 /v1/
 */
function getApiBasePath() {
  // 在开发环境中，使用 Next.js API Routes
  if (typeof window !== 'undefined' && window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
    return '/api/v1';
  }
  // 生产环境使用 Edge Functions
  return '/v1';
}

export default function Home() {
  const [inputValue, setInputValue] = useState('');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('z-image');
  const [isGenerating, setIsGenerating] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [displayPlatformName, setDisplayPlatformName] = useState<string>('ModelScope');

  // Token availability states (default false, updated after API call)
  const [hasHfToken, setHasHfToken] = useState<boolean>(false);
  const [hasNebiusToken, setHasNebiusToken] = useState<boolean>(false);
  const [hasReplicateToken, setHasReplicateToken] = useState<boolean>(false);
  const [hasOpenaiToken, setHasOpenaiToken] = useState<boolean>(false);
  const [hasFalToken, setHasFalToken] = useState<boolean>(false);
  const [imageLoadError, setImageLoadError] = useState<boolean>(false);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  // const disabledList = ['sdxl', 'blackdev', 'pixelxl', 'hidreamfull1', 'btsd', 'sdxl-turbo'];

  // Fetch token presence once on mount
  useEffect(() => {
    fetch(`${getApiBasePath()}/token-status`)
      .then(async (res) => {
        try {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          const contentType = res.headers.get('content-type') || '';
          if (!contentType.includes('application/json')) {
            throw new Error('Unexpected content type');
          }
          return await res.json();
        } catch (err) {
          console.warn('token-status response is not valid JSON:', err);
          return { hfToken: false, nebiusToken: false, replicateToken: false, openaiToken: false, falToken: false };
        }
      })
      .then((data: { hfToken?: boolean; nebiusToken?: boolean; replicateToken?: boolean; openaiToken?: boolean; falToken?: boolean }) => {
        console.log(data)
        setHasHfToken(Boolean(data?.hfToken));
        setHasNebiusToken(Boolean(data?.nebiusToken));
        setHasReplicateToken(Boolean(data?.replicateToken));
        setHasOpenaiToken(Boolean(data?.openaiToken));
        setHasFalToken(Boolean(data?.falToken));
      })
      .catch((err) => {
        console.error('Failed to fetch token status:', err);
      });
  }, []);

  const models = useMemo(() => {
    return baseModels.map((m) => {
      let disabled = m.disabled;
   
      if (m.platform === 'Hugging Face') {
        disabled = !hasHfToken;
      }
      return { ...m, disabled };
    });
  }, [hasHfToken]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update display platform when selected model changes
  useEffect(() => {
    setDisplayPlatformName('ModelScope');
  }, [selectedModel]);

  // Generation timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isGenerating) {
      setElapsedSeconds(0);
      interval = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = Math.round((prev + 0.1) * 10) / 10;
          return next;
        });
      }, 100);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating]);

  // Ensure selectedModel stays in sync with enabled models
  useEffect(() => {
    const enabledModels = models.filter((m) => !m.disabled);
    if (enabledModels.length === 0) {
      setSelectedModel('');
    } else {
      // If current selection is disabled or empty, pick first enabled
      const isCurrentValid = enabledModels.some((m) => m.id === selectedModel);
      if (!isCurrentValid) {
        setSelectedModel(enabledModels[0].id);
      }
    }
  }, [models]);

  const generateImages = async (prompt: string) => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    
    // Get currently selected model info
    const modelInfo = models.find(m => m.id === selectedModel && !m.disabled);
    
    if (!modelInfo) {
      // No valid model available
      setGeneratedImages([{ id:`${Date.now()}`, platform:'', model:'', prompt:prompt, imageUrl:'', timestamp:new Date(), error:'No model available', isLoading:false }]);
      setIsGenerating(false);
      return;
    }

    // Create a loading placeholder record
    const loadingImage = {
      id: `${Date.now()}-${platform.id}`,
      platform: displayPlatformName,
      model: modelInfo.name,
      prompt: prompt,
      imageUrl: '',
      timestamp: new Date(),
      isLoading: true
    };

    setGeneratedImages([loadingImage]);

    try {
      // Call backend API to generate image
      const res = await fetch(`${getApiBasePath()}/modelscope/${modelInfo.value}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          resolution: '1:1'
        })
      });

      let data;
      try {
        data = await res.json();
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError);
        const responseText = await res.text();
        console.error('Response text:', responseText);
        
        setGeneratedImages([
          {
            ...loadingImage,
            imageUrl: '',
            isLoading: false,
            error: `API returned invalid response format. Status: ${res.status}`,
          },
        ]);
        return;
      }
      
      if (!res.ok || data.error) {
        const errorMessage = data.error || `HTTP error: ${res.status}`;
        
        setGeneratedImages([
          {
            ...loadingImage,
            imageUrl: '',
            isLoading: false,
            error: errorMessage,
          },
        ]);
      } else if (data.imageData) {
        let imageUrl;
        if (typeof data.imageData === 'string' && data.imageData.startsWith('http')) {
          imageUrl = data.imageData;
        } else {
          imageUrl = `data:image/png;base64,${data.imageData}`;
        }
        
        setGeneratedImages([
          {
            ...loadingImage,
            imageUrl: imageUrl,
            isLoading: false,
            error: undefined,
          },
        ]);
      } else {
        setGeneratedImages([
          {
            ...loadingImage,
            imageUrl: '',
            isLoading: false,
            error: 'No image was returned by the API',
          },
        ]);
      }
    } catch (error) {
      console.error(`${displayPlatformName} generation failed:`, error);
      
      setGeneratedImages([{
        ...loadingImage,
        imageUrl: '',
        error: (error as Error).message || 'Generation failed',
        isLoading: false,
      }]);
    }

    setIsGenerating(false);
  };

  // 图片下载函数
  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      setImageLoading(true);
      
      // 如果是 data URL，直接下载
      if (imageUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      
      // 如果是在线图片，先获取图片数据
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Download failed:', error);
      alert('下载失败，请重试');
    } finally {
      setImageLoading(false);
    }
  };

  // 获取图片格式
  const getImageFormat = (imageUrl: string): string => {
    if (imageUrl.startsWith('data:')) {
      const match = imageUrl.match(/data:([^;]+)/);
      if (match) {
        const mimeType = match[1];
        if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
        if (mimeType.includes('png')) return 'png';
        if (mimeType.includes('webp')) return 'webp';
      }
      return 'png'; // 默认格式
    }
    
    // 从 URL 中检测格式
    const url = imageUrl.toLowerCase();
    if (url.includes('.jpg') || url.includes('.jpeg')) return 'jpg';
    if (url.includes('.png')) return 'png';
    if (url.includes('.webp')) return 'webp';
    
    return 'png'; // 默认格式
  };

  // 生成文件名
  const generateFilename = (prompt: string, format: string): string => {
    const cleanPrompt = prompt.slice(0, 20).trim().replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
    return `${cleanPrompt}.${format}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    await generateImages(inputValue);
  };

  const examplePrompts = [
    "一只可爱的橙色小猫在花园里玩耍",
    "未来城市夜景，霓虹灯闪烁", 
    "超现实主义场景：星空下漂浮的书籍，下方沉睡的孩子",
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header / Navbar */}
      <header className="bg-gray-100 dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 128 128"><path fill="oklch(62.7% .265 303.9)" d="M105.33 1.6H22.67A22.64 22.64 0 0 0 0 24.27v79.46a22.64 22.64 0 0 0 22.67 22.67h82.66A22.64 22.64 0 0 0 128 103.73V24.27A22.64 22.64 0 0 0 105.33 1.6m-27.09 88H67.09a.82.82 0 0 1-.85-.59l-4.37-12.74H42L38 88.8a.93.93 0 0 1-1 .75H27c-.58 0-.74-.32-.58-1l17.1-49.4c.16-.54.32-1.12.53-1.76a18 18 0 0 0 .32-3.47a.54._a 0 0 1 .43-.59h13.81c.43 0 .64.16.7.43l19.46 54.93c.16.59 0 .86-.53.86Zm18.4-.6c0 .59-.21.85-.69.85H85.49a.75.75 0 0 1-.8-.85V47.89c0-.53.22-.74.7-.74H96c.48 0 .69.26.69.74Zm-1.12-48.2a6.3 6.3 0 0 1-4.85 1.87a6.6 6.6 0 0 1-4.75-1.87a6.87 6.87 0 0 1-1.81-4.91A6.23 6.23 0 0 1 86 31.15a6.8 6.8 0 0 1 4.74-1.87a6.4 6.4 0 0 1 4.86 1.87a6.75 6.75 0 0 1 1.76 4.74a6.76 6.6 0 0 1-1.84 4.91M58.67 65.44H45.12c.8-2.24 1.6-4.75 2.35-7.47s1.65-5.33 2.45-7.89a65 65 0 0 0 1.81-6.88h.11c.37 1.28.75 2.67 1.17 4.16s.91 3.09 1.44 4.75s1 3.25 1.55 4.9s1 3.15 1.44 4.59s.91 2.72 1.23 3.84"/></svg>
            <span className="text-gray-800 dark:text-white text-xl font-semibold">图像生成器</span>
          </div>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center space-x-6 text-gray-600 dark:text-gray-300 text-sm">
            <a
              href="https://github.com/xiaomizhoubaobei/image-generator-starter"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900 dark:hover:text-white transition-colors"
              aria-label="GitHub Repository"
            >
              <svg
                className="w-6 h-6 fill-current"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12 0C5.372 0 0 5.373 0 12c0 5.303 3.438 9.8 8.207 11.387.6.111.793-.262.793-.583 0-.288-.01-1.049-.016-2.058-3.338.726-4.042-1.61-4.042-1.61-.546-1.389-1.333-1.759-1.333-1.759-1.089-.744.083-.729.083-.729 1.205.084 1.84 1.238 1.84 1.238 1.07 1.834 2.809 1.304 3.495.997.108-.775.419-1.305.762-1.605-2.665-.304-5.467-1.332-5.467-5.932 0-1.31.468-2.381 1.235-3.221-.124-.303-.536-1.522.117-3.176 0 0 1.008-.322 3.301 1.23a11.51 11.51 0 013.003-.404c1.02.005 2.046.138 3.003.404 2.291-1.552 3.297-1.23 3.297-1.23.655 1.654.243 2.873.12 3.176.77.84 1.233 1.911 1.233 3.221 0 4.61-2.807 5.625-5.48 5.921.43.372.814 1.102.814 2.222 0 1.604-.015 2.898-.015 3.293 0 .323.19.699.8.58C20.565 21.796 24 17.298 24 12c0-6.627-5.373-12-12-12z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          </nav>
        </div>
      </header>

       {/* Main Content Area - Left Right Layout */}
       <main className="max-w-7xl mx-auto px-4 py-8">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[calc(100vh-200px)]">
           
           {/* Left Side - Input and Model Selection */}
           <div className="space-y-6">
             
             {/* Text Input Card */}
             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
               <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                 图像描述
               </h2>
               
               <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                   <textarea
                     value={inputValue}
                     onChange={(e) => setInputValue(e.target.value)}
                     placeholder="描述您想要的图像，例如：一只可爱的小猫在花园里玩耍..."
                     className="w-full px-4 py-3 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                     rows={4}
                     onKeyDown={(e) => {
                       if (e.key === 'Enter' && !e.shiftKey) {
                         e.preventDefault();
                         handleSubmit(e);
                       }
                     }}
                   />
                 </div>
                 
                 <div className="flex items-start justify-between">
                   <div className="text-sm text-gray-500 dark:text-gray-400 self-start">
                     按 Enter 生成，Shift + Enter 换行
                   </div>
                   <button
                     type="submit"
                     disabled={!inputValue.trim() || isGenerating || !selectedModel}
                     className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 hover:cursor-pointer disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl self-start"
                   >
                     {isGenerating ? (
                       <>
                         <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                         <span>生成中...</span>
                       </>
                     ) : (
                       <>
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                         </svg>
                         <span>生成</span>
                       </>
                     )}
                   </button>
                 </div>
               </form>

               {/* Example Prompts */}
               <div className="mt-6">
                 <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  示例提示词：
                 </h3>
                 <div className="grid grid-cols-1 gap-2">
                   {examplePrompts.map((prompt, index) => (
                     <button
                       key={index}
                       onClick={() => setInputValue(prompt)}
                       className="cursor-pointer p-3 text-left text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-gray-600 transition-all duration-200 text-gray-700 dark:text-gray-300"
                     >
                       {prompt}
                     </button>
                   ))}
                 </div>
               </div>
             </div>

             {/* Model Selection Card */}
             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
               <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Model Selection
               </h2>
               
               <div className="space-y-4">
                 <div className="space-y-2">
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                     {displayPlatformName}
                   </label>
                   <ModelDropdown
                     models={models}
                     selected={selectedModel}
                     onSelect={setSelectedModel}
                     disabled={isGenerating}
                   />
                 </div>
               </div>
             </div>
           </div>

           {/* Right Side - Generated Images Display */}
           <ImageDisplay
             generatedImages={generatedImages}
             isClient={isClient}
             elapsedSeconds={elapsedSeconds}
             imageLoading={imageLoading}
             imageLoadError={imageLoadError}
             displayPlatformName={displayPlatformName}
             onDownload={downloadImage}
             onRetry={(imageUrl) => {
               setImageLoadError(false);
               setImageLoading(true);
               // 触发图片重新加载
               const img = new window.Image();
               img.onload = () => {
                 setImageLoadError(false);
                 setImageLoading(false);
               };
               img.onerror = () => {
                 setImageLoadError(true);
                 setImageLoading(false);
               };
               img.src = imageUrl;
             }}
             onImageLoad={() => {
               setImageLoadError(false);
               setImageLoading(false);
             }}
             onImageError={() => {
               setImageLoadError(true);
               setImageLoading(false);
             }}
             getImageFormat={getImageFormat}
             generateFilename={generateFilename}
           />
         </div>
       </main>
    </div>
  );
}