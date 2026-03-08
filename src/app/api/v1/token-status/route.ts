/**
 * API Token 状态检查端点
 * 提供各平台 API Token 和 KV 存储的存在性检查功能，用于前端判断是否可以使用相应的图像生成服务
 * 
 * 检查的内容：
 * - KV Storage (image_generate_cnt) - 用于速率限制的 KV 存储
 * 
 * 使用场景：
 * - 前端在加载时检查可用的服务
 * - 调试环境配置是否正确
 */

import { NextRequest, NextResponse } from 'next/server';

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Handle GET request
export async function GET(request: NextRequest) {
  // 在开发环境中，我们不需要检查 KV Storage
  // 直接返回 false，因为开发环境不需要速率限制
  return NextResponse.json({
    kvStorage: false
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  });
}