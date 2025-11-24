/**
 * Vercel Serverless Function: Send Prompt (with streaming support)
 * Endpoint: /api/send-prompt
 * Method: POST
 */

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // อนุญาตเฉพาะ POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      status: 'error', 
      message: 'Method not allowed' 
    });
  }

  try {
    const { prompt, user_id, node_id, message_id, webhook_url, run_id, stream } = req.body;

    // Validate required fields
    if (!prompt || !user_id || !node_id || !run_id) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: prompt, user_id, node_id, run_id'
      });
    }

    // Get API token from environment variables
    const apiToken = process.env.THAIGPT_API_TOKEN;
    if (!apiToken) {
      console.error('THAIGPT_API_TOKEN is not set');
      return res.status(500).json({
        status: 'error',
        message: 'Server configuration error'
      });
    }

    // Get API base URL from environment or use default
    const apiBaseUrl = process.env.VITE_API_BASE_URL || 'https://cnx.thaigpt.com';

    // Call ThaiGPT API with streaming
    const response = await fetch(`${apiBaseUrl}/api/v2/send-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify({
        prompt,
        user_id,
        node_id,
        message_id: message_id || 0,
        webhook_url: webhook_url || '',
        run_id,
        stream: stream !== undefined ? stream : 1
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        status: 'error',
        message: errorData.message || `API request failed with status ${response.status}`
      });
    }

    // If streaming is enabled, forward the stream to client
    if (stream === 1 && response.body) {
      // Set headers for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Pipe the stream from ThaiGPT API to client
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            res.end();
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          res.write(chunk);
        }
      } catch (streamError) {
        console.error('Streaming error:', streamError);
        res.end();
      }
    } else {
      // Non-streaming response
      const data = await response.json();
      return res.status(200).json(data);
    }

  } catch (error) {
    console.error('Error in send-prompt:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}

