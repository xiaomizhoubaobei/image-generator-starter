/**
 * 速率限制工具
 * 提供基于 KV 存储的速率限制功能
 * 
 * 功能特点：
 * - 使用 KV 存储持久化速率限制数据
 * - 支持多层级速率限制（设备指纹、session ID、IP 地址）
 * - 自动清理过期数据（7天）
 * - 防止滥用和过度请求
 * 
 * 存储结构：
 * - 使用单一 KV 键存储所有用户的速率限制数据
 * - 每个用户的数据包含：请求计数和时间戳
 * - 自动清理超过 7 天的旧数据
 */

// KV 存储键名
const RATE_LIMIT_KEY = 'image_rate_limit_data';
// 数据清理间隔：7天（毫秒）
const CLEANUP_INTERVAL = 24 * 7 * 60 * 60 * 1000;

/**
 * 初始化 KV 存储中的速率限制数据
 * 
 * 如果 KV 中不存在速率限制数据，则创建一个空对象
 * 
 * @param {Object} kv - KV 存储绑定对象
 * @returns {Promise<void>}
 */
async function initializeRateLimitData(kv) {
  try {
    // 检查是否已存在速率限制数据
    const existing = await kv.get(RATE_LIMIT_KEY);
    
    if (!existing) {
      console.log('正在初始化 KV 存储中的速率限制数据');
      // 创建空的速率限制数据对象，设置 24 小时过期时间
      await kv.put(RATE_LIMIT_KEY, JSON.stringify({}), { expirationTtl: 86400 });
      console.log('速率限制数据初始化成功');
    } else {
      console.log('KV 存储中已存在速率限制数据');
    }
  } catch (error) {
    console.warn('初始化速率限制数据失败:', error);
  }
}

/**
 * 清理过期的速率限制数据
 * 
 * 删除超过 7 天的旧数据，保持 KV 存储的高效性
 * 
 * @param {Object} rateLimitData - 当前的速率限制数据对象
 * @returns {Object} 清理后的速率限制数据
 * 
 * @example
 * const data = { user1: { count: 5, timestamp: Date.now() - 10天 } };
 * const cleaned = cleanupRateLimitData(data);
 * // user1 会被删除
 */
function cleanupRateLimitData(rateLimitData) {
  const now = Date.now();
  const cleaned = {};
  
  // 遍历所有用户数据
  for (const [userKey, userData] of Object.entries(rateLimitData)) {
    // 保留时间戳小于 7 天的数据
    if (now - userData.timestamp < CLEANUP_INTERVAL) {
      cleaned[userKey] = userData;
    }
  }
  
  return cleaned;
}

/**
 * 检查并更新用户的速率限制
 * 
 * 检查用户的请求次数是否超过限制，如果未超过则递增计数
 * 
 * @param {string} userKey - 用户的唯一标识符（通常是 IP 地址或设备指纹）
 * @param {Object} env - 环境变量对象，包含 KV 绑定
 * @param {number} maxRequests - 允许的最大请求数（默认 10 次）
 * @returns {Promise<Object>} 检查结果对象，包含以下属性：
 *   - allowed: boolean - 是否允许继续请求
 *   - error?: string - 如果不允许，包含错误信息
 * 
 * @throws {Error} 当 KV 存储未配置时抛出错误
 * 
 * @example
 * // 检查 IP 地址的速率限制（最多 10 次）
 * const result = await checkRateLimit('192.168.1.1', env, 10);
 * if (!result.allowed) {
 *   // 达到速率限制，返回错误
 *   return createRateLimitResponse(result.error);
 * }
 * 
 * // 检查 session 的速率限制
 * const result = await checkRateLimit('session_abc123', env, 10);
 */
export async function checkRateLimit(userKey, env, maxRequests = 10) {
  try {
    console.log('正在检查用户速率限制:', userKey);
    console.log('可用的环境变量键:', Object.keys(env || {}));
    
    // 从环境变量中获取 KV 绑定
    const kv = env.image_generate_cnt;
    console.log('KV 绑定是否可用:', !!kv);
    
    // 如果 KV 未配置，抛出错误（KV 是必需配置）
    if (!kv) {
      throw new Error('image_generate_cnt KV 绑定未配置。这是必需的配置。');
    }
    
    // 初始化速率限制数据（如果需要）
    await initializeRateLimitData(kv);
    
    // 从 KV 存储中获取速率限制数据
    console.log('正在从 KV 存储获取速率限制数据...');
    const stored = await kv.get(RATE_LIMIT_KEY);
    console.log('存储数据:', stored ? '存在' : '不存在');
    
    let rateLimitData = {};
    
    // 解析存储的数据
    if (stored) {
      try {
        rateLimitData = JSON.parse(stored);
        console.log('已解析速率限制数据:', Object.keys(rateLimitData));
      } catch (parseErr) {
        console.warn('解析速率限制数据失败，重新开始:', parseErr);
        rateLimitData = {};
      }
    } else {
      console.log('未找到现有速率限制数据，重新开始');
    }
    
    // 清理过期数据
    const beforeCleanup = Object.keys(rateLimitData).length;
    rateLimitData = cleanupRateLimitData(rateLimitData);
    const afterCleanup = Object.keys(rateLimitData).length;
    console.log(`数据清理: ${beforeCleanup} -> ${afterCleanup} 个用户`);
    
    // 获取当前用户的请求计数
    const userData = rateLimitData[userKey] || { count: 0, timestamp: Date.now() };
    const currentCount = userData.count;
    console.log(`用户 ${userKey} 当前请求次数: ${currentCount}/${maxRequests}`);
    
    // 检查是否超过速率限制
    if (currentCount >= maxRequests) {
      console.log(`用户 ${userKey} 超过速率限制`);
      return {
        allowed: false,
        error: `演示体验限制为 ${maxRequests} 次生成。如需更多AI图像生成功能，请在 EdgeOne Pages 上部署。`
      };
    }
    
    // 更新用户的请求计数和时间戳
    rateLimitData[userKey] = {
      count: currentCount + 1,
      timestamp: Date.now()
    };
    
    // 将更新后的数据存储到 KV，设置 24 小时过期时间
    console.log('正在存储更新后的速率限制数据...');
    await kv.put(RATE_LIMIT_KEY, JSON.stringify(rateLimitData), { expirationTtl: 86400 });
    console.log('速率限制数据存储成功');
    
    return { allowed: true };
    
  } catch (rateErr) {
    console.warn('速率限制检查失败:', rateErr);
    // 如果速率限制检查失败，为了用户体验，允许请求继续
    return { allowed: true };
  }
}

/**
 * 创建速率限制错误响应
 * 
 * 生成标准的 HTTP 429（Too Many Requests）响应
 * 
 * @param {string} errorMessage - 要返回的错误信息
 * @returns {Response} HTTP 响应对象，包含速率限制错误
 * 
 * @example
 * const response = createRateLimitResponse('已超过每日生成限制');
 * // 返回 429 状态码和 JSON 错误消息
 */
export function createRateLimitResponse(errorMessage) {
  return new Response(JSON.stringify({ error: errorMessage }), {
    status: 429, // HTTP 429: Too Many Requests
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; preload',
    },
  });
}