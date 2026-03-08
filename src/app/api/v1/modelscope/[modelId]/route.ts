/**
 * 图像生成 API 端点（动态路由）
 * 调用 Gradio API 生成图像
 * 
 * 路由：/api/v1/modelscope/:modelId
 * 
 * API 流程：
 * 1. POST 请求提交生成任务，获取 EVENT_ID
 * 2. 轮询 GET 请求获取生成结果
 * 
 * 参数：
 * - modelId: 模型 ID（从 URL 路径中获取）
 * - prompt: 提示词
 * - resolution: 图像比例（如 "1:1", "16:9" 等）
 */

import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://gswyhq-z-image.ms.show';
const API_ENDPOINT = `${API_BASE_URL}/gradio_api/call/generate_image`;

/**
 * 调用 Gradio API 生成图像
 * @param {string} prompt - 提示词
 * @param {string} resolution - 图像比例
 * @returns {Promise<string>} 生成的图像数据（base64 或 URL）
 */
async function generateImage(prompt: string, resolution: string = '1:1'): Promise<string> {
  // Step 1: POST 请求提交生成任务
  const postResponse = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: [prompt, resolution]
    }),
  });

  if (!postResponse.ok) {
    const errorText = await postResponse.text();
    throw new Error(`Gradio API POST 请求失败: ${postResponse.status} ${postResponse.statusText} - ${errorText}`);
  }

  const postResult = await postResponse.json();
  const eventId = postResult.event_id;

  if (!eventId) {
    throw new Error('Gradio API 未返回 event_id');
  }

  // Step 2: 轮询 GET 请求获取生成结果
  const getEndpoint = `${API_ENDPOINT}/${eventId}`;
  let attempts = 0;
  const maxAttempts = 120; // 2 分钟，每秒一次

  while (attempts < maxAttempts) {
    try {
      const getResponse = await fetch(getEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!getResponse.ok) {
        const errorText = await getResponse.text();
        throw new Error(`Gradio API GET 请求失败: ${getResponse.status} ${getResponse.statusText} - ${errorText}`);
      }

      const getResult = await getResponse.json();

      // 检查任务状态
      if (getResult.status === 'completed') {
        // 提取图像数据
        if (getResult.data && getResult.data.length > 0) {
          const imageData = getResult.data[0];
          return imageData;
        }
        throw new Error('Gradio API 未返回图像数据');
      } else if (getResult.status === 'failed') {
        throw new Error(`Gradio 生成失败: ${getResult.error || '未知错误'}`);
      } else if (getResult.status === 'processing' || getResult.status === 'pending') {
        // 继续等待
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      } else {
        // 未知状态，继续等待
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
    } catch (error) {
      console.error(`Gradio 轮询错误（第 ${attempts + 1} 次尝试）:`, error);
      attempts++;
      if (attempts >= maxAttempts) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  throw new Error('Gradio 图像生成超时（超过 2 分钟）');
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Handle POST request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  // 从 URL 路径中获取模型 ID
  const { modelId } = await params;

  if (!modelId) {
    return NextResponse.json(
      { error: '缺少模型 ID' },
      { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  try {
    // 解析请求体
    const body = await request.json();
    const prompt = body.prompt || '';
    const resolution = body.resolution || '1:1';

    if (!prompt) {
      return NextResponse.json(
        { error: '提示词不能为空' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // 调用 Gradio API 生成图像
    const imageData = await generateImage(prompt, resolution);

    return NextResponse.json({
      success: true,
      modelId: modelId,
      imageData: imageData,
      message: '图像生成成功'
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('图像生成错误:', err);
    
    const errorMessage = err instanceof Error ? err.message : '生成失败';
    
    return NextResponse.json(
      {
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}