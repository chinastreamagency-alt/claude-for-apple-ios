// Vercel Serverless Function - API 代理
export default async function handler(req, res) {
  // 设置 CORS 头（必须在所有响应之前）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, max_tokens } = req.body;

    // 从环境变量获取 API 配置
    const API_URL = process.env.CLAUDE_API_URL || 'https://cc.585dg.com/v1/messages';
    const API_KEY = process.env.CLAUDE_API_KEY || 'sk-a97d8f6c04734278b2ea0359f734b461';

    // 尝试多个可能的 Claude 4.5 模型名称
    const POSSIBLE_MODELS = [
      'claude-sonnet-4.5-20250929',
      'claude-4.5-sonnet',
      'claude-4-5-sonnet-20250929',
      'claude-sonnet-4-5-20250929'
    ];

    const MODEL = POSSIBLE_MODELS[0]; // 先尝试第一个

    console.log('代理请求到:', API_URL);
    console.log('使用模型:', MODEL);
    console.log('完整请求体:', JSON.stringify({
      model: MODEL,
      max_tokens: max_tokens || 4096,
      messages: messages
    }, null, 2));

    // 转发请求到第三方 API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: max_tokens || 4096,
        messages: messages
      })
    });

    const data = await response.json();

    console.log('完整 API 响应:', JSON.stringify(data, null, 2));
    console.log('API 返回的模型:', data.model);

    if (!response.ok) {
      console.error('API 错误:', data);
      return res.status(response.status).json(data);
    }

    console.log('API 成功响应');
    return res.status(200).json(data);

  } catch (error) {
    console.error('代理错误:', error);
    return res.status(500).json({
      error: {
        message: error.message || 'Internal server error',
        type: 'proxy_error'
      }
    });
  }
}
