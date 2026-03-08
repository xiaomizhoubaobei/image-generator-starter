/**
 * API 请求工具函数
 * 提供统一的 API 请求处理函数，用于处理图像生成 API 的响应
 * 
 * 功能包括：
 * - 轮询 FAL API 获取异步任务结果
 * - 处理多种 API 响应格式（Gradio、FAL、base64 等）
 * - 从 API 响应中提取图像数据
 */

/**
 * 轮询 FAL API 获取生成结果
 * 
 * FAL API 采用异步模式，需要先提交任务获取 request_id，然后轮询获取结果
 * 
 * @param {string} requestId - 初始请求返回的任务ID
 * @param {string} url - FAL API 端点URL
 * @returns {Promise<Object>} 包含图像数据的最终结果
 * @throws {Error} 当轮询失败、任务失败或超时时抛出错误
 * 
 * @example
 * const result = await pollFalResult('req_abc123', 'https://queue.fal.run/fal-ai/fast-sdxl');
 */
async function pollFalResult(requestId, url) {
  // 最大尝试次数：120次
  // 间隔时间：1秒
  // 总超时时间：约2分钟
  const maxAttempts = 120;
  const interval = 1000; // 1秒
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // 发送轮询请求，获取任务状态
      const response = await fetch(`${url}/${requestId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // 检查 HTTP 响应状态
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`FAL 轮询失败: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      // 解析响应 JSON
      const result = await response.json();
      console.log(`FAL 轮询尝试 ${attempt + 1}/${maxAttempts}, 状态: ${result.status}`);
      
      // 根据任务状态处理
      if (result.status === 'completed') {
        // 任务完成，返回最终结果
        console.log('FAL API: 图像生成完成');
        return result;
      } else if (result.status === 'failed') {
        // 任务失败，抛出错误
        throw new Error(`FAL 图像生成失败: ${result.error || '未知错误'}`);
      } else if (result.status === 'canceled') {
        // 任务被取消
        throw new Error('FAL 图像生成任务已取消');
      }
      
      // 任务仍在进行中，等待后继续轮询
      await new Promise(resolve => setTimeout(resolve, interval));
      
    } catch (error) {
      console.error(`FAL 轮询错误（第 ${attempt + 1} 次尝试）:`, error);
      
      // 如果是最后一次尝试，抛出错误
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      
      // 否则等待后重试
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  
  // 超过最大尝试次数，抛出超时错误
  throw new Error('FAL 图像生成超时（超过2分钟）');
}

/**
 * 从 API 响应中提取图像数据
 * 
 * 支持多种 API 响应格式：
 * 1. FAL Queue API 异步响应（需要轮询）
 * 2. Gradio API 格式（data 数组）
 * 3. FAL API base64 格式（data.b64_json）
 * 4. 直接 base64 格式（b64_json）
 * 
 * @param {Object} result - API 响应结果对象
 * @returns {Promise<string>} 图像数据（URL 或 base64 编码）
 * @throws {Error} 当响应格式不支持或无效时抛出错误
 * 
 * @example
 * // Gradio API 响应
 * const gradioResult = { data: ['data:image/png;base64,...'] };
 * const imageData = await processApiResponse(gradioResult);
 * 
 * // FAL 异步响应
 * const falResult = { request_id: 'req_123', status: 'pending', _falUrl: '...' };
 * const imageData = await processApiResponse(falResult);
 */
async function processApiResponse(result) {
  console.log('正在处理 API 响应...');
  
  // 检查响应是否为空或无效
  if (!result) {
    throw new Error('无效的 API 响应：响应为 null 或 undefined');
  }

  // 处理 FAL Queue API 异步响应
  // 这种响应需要先提交任务，然后轮询获取结果
  if (result.request_id && result.status) {
    console.log('检测到 FAL Queue API 响应，状态:', result.status);
    
    // 如果任务仍在进行中，需要轮询直到完成
    if (result.status === 'pending' || result.status === 'processing') {
      console.log('FAL API: 正在轮询获取结果...');
      
      // 使用从 fal_queue_query 存储的 URL
      // 如果没有，使用默认的回退 URL
      const falUrl = result._falUrl || 'https://tongyi-mai-z-image-turbo.hf.space/gradio_api/call/generate';
      
      // 轮询获取最终结果
      const finalResult = await pollFalResult(result.request_id, falUrl);
      result = finalResult;
      console.log('FAL 轮询成功完成');
    } else if (result.status === 'completed') {
      // 任务已完成，直接使用当前结果
      console.log('FAL API: 任务已完成');
    } else if (result.status === 'failed') {
      // 任务失败，抛出错误
      throw new Error(`FAL 图像生成失败: ${result.error || '未知错误'}`);
    }
  }

  // 处理 Gradio API 格式
  // Gradio 返回一个 data 数组，第一个元素是图像数据
  if (result.data && Array.isArray(result.data)) {
    console.log('发现 Gradio API data 数组格式');
    const imageData = result.data[0];
    if (imageData) {
      console.log('在 Gradio 格式中找到图像数据');
      return imageData;
    }
  }

  // 处理 FAL API base64 格式
  // 图像数据在 data.b64_json 字段中
  if (result.data && result.data.b64_json) {
    console.log('发现 FAL API base64 输出格式');
    return result.data.b64_json;
  }

  // 处理直接 base64 格式
  // 图像数据直接在 b64_json 字段中
  if (result.b64_json) {
    console.log('发现直接 base64 输出格式');
    return result.b64_json;
  }

  // 未识别的响应格式
  console.log('未找到可识别的响应格式，抛出错误');
  throw new Error('不支持的 API 响应格式');
}

// 导出所有函数供其他模块使用
export {
  pollFalResult,      // 轮询 FAL API 获取结果
  processApiResponse   // 处理 API 响应并提取图像数据
};