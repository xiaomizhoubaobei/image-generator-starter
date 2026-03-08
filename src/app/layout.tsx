/**
 * 根布局组件
 * 定义应用的全局布局、元数据和样式
 * 
 * 功能：
 * - 设置页面标题和描述（SEO）
 * - 引入全局样式表
 * - 引入 TDesign React 组件库样式
 * - 设置 HTML 基础结构（lang、head、body）
 * - 配置网站图标（favicon）
 * 
 * 元数据：
 * - title: "图像生成器"
 * - description: "使用多个平台的 AI 驱动图像生成"
 * 
 * 全局样式：
 * - globals.css - 应用自定义全局样式
 * - tdesign.css - TDesign React 组件库样式
 */

import type { Metadata } from "next";
import "@/styles/globals.css";
import 'tdesign-react/dist/tdesign.css';

export const metadata: Metadata = {
  title: "图像生成器",
  description: "使用多个平台的 AI 驱动图像生成",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/1.jpg" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}