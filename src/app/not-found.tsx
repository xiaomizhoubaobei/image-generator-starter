/**
 * 404 错误页面组件
 * 当用户访问不存在的页面时显示
 * 
 * 功能：
 * - 显示 "404" 和 "信号丢失" 的错误信息
 * - 提供返回首页和返回上一页的导航按钮
 * - 包含动态鼠标跟随效果和动画背景
 * - 科幻风格的视觉设计（渐变背景、网格、几何形状）
 * - 装饰性技术元素（状态指示器、扫描线效果）
 * 
 * 视觉特效：
 * - 鼠标移动时背景网格和几何形状跟随移动
 * - 脉冲动画（404 文字、圆形、方形）
 * - 渐变背景（从深蓝到紫色）
 * - 发光效果（按钮、文字）
 * - 扫描线动画
 * 
 * 交互功能：
 * - 点击 "返回基地" 按钮跳转到首页
 * - 点击 "返回上一页" 按钮返回浏览器历史记录
 */

'use client';

import { useEffect, useState } from 'react';

export default function NotFound() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 30,
        y: (e.clientY / window.innerHeight - 0.5) * 30
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(147, 51, 234, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(147, 51, 234, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
          transition: 'transform 0.3s ease-out'
        }} />
      </div>

      {/* Floating geometric shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-1/4 left-1/4 w-64 h-64 border-2 border-purple-500/30 rounded-full animate-pulse"
          style={{
            transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`,
            transition: 'transform 0.3s ease-out'
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-48 h-48 border-2 border-pink-500/30 rotate-45 animate-bounce"
          style={{
            animationDuration: '3s',
            transform: `translate(${mousePosition.x * 0.3}px, ${mousePosition.y * 0.3}px)`,
            transition: 'transform 0.3s ease-out'
          }}
        />
        <div
          className="absolute top-1/3 right-1/3 w-32 h-32 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl blur-xl animate-pulse"
          style={{
            animationDelay: '1s',
            transform: `translate(${mousePosition.x * 0.7}px, ${mousePosition.y * 0.7}px)`,
            transition: 'transform 0.3s ease-out'
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center px-4">
        <div className="mb-8 relative">
          {/* Glowing 404 */}
          <h1 className="text-[12rem] md:text-[16rem] font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent animate-pulse leading-none tracking-tighter">
            404
          </h1>
          {/* Glitch effect shadow */}
          <div className="absolute inset-0 text-[12rem] md:text-[16rem] font-bold text-purple-500/20 blur-2xl leading-none tracking-tighter">
            404
          </div>
        </div>

        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-wide" style={{
          fontFamily: 'Courier New, monospace',
          textShadow: '0 0 40px rgba(147, 51, 234, 0.5)'
        }}>
          信号丢失
        </h2>

        <p className="text-purple-200/80 text-lg md:text-xl mb-12 max-w-lg mx-auto leading-relaxed font-mono">
          <span className="text-pink-400">{'>'}</span> 探测到未知的维度坐标
          <br />
          <span className="text-pink-400">{'>'}</span> 目标页面可能已被传送至平行宇宙
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href="/"
            className="group relative px-8 py-4 bg-transparent border-2 border-purple-500 text-purple-400 font-bold text-lg rounded-lg overflow-hidden transition-all duration-300 hover:border-pink-500 hover:text-pink-400 hover:shadow-[0_0_40px_rgba(147,51,234,0.5)]"
          >
            <span className="relative z-10 flex items-center gap-2">
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              返回基地
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>

          <button
            onClick={() => window.history.back()}
            className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-lg transition-all duration-300 hover:from-purple-500 hover:to-pink-500 hover:shadow-[0_0_40px_rgba(236,72,153,0.5)] hover:scale-105"
          >
            返回上一页
          </button>
        </div>

        {/* Decorative tech elements */}
        <div className="mt-16 flex justify-center gap-8 text-purple-400/50 font-mono text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>系统正常</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
            <span>等待指令</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
            <span>维度扫描中</span>
          </div>
        </div>
      </div>

      {/* Scan line effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent animate-[scan_3s_linear_infinite]" />
      </div>
    </div>
  );
}