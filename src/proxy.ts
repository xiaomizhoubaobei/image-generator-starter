import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  
  // 只在生产环境启用 HSTS
  // 避免在开发环境影响本地开发（通常使用 HTTP）
  if (process.env.NODE_ENV === 'production') {
    // HSTS 配置
    // max-age=31536000: 1年有效期
    // preload: 允许被添加到 HSTS Preload List
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; preload'
    );
  }
  
  // 其他安全头（所有环境都启用）
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  return response;
}

// 配置 proxy 匹配所有路径
export const config = {
  matcher: '/:path*',
};