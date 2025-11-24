/**
 * Vercel Serverless Function: Get Chat History
 * Endpoint: /api/get-history
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
    const { user_id, node_id, run_id } = req.body;

    // Validate required fields
    if (!user_id || !node_id || !run_id) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: user_id, node_id, run_id'
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

    // Call ThaiGPT API
    const response = await fetch(`${apiBaseUrl}/api/v2/get-history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify({
        user_id,
        node_id,
        run_id
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        status: 'error',
        message: errorData.message || `API request failed with status ${response.status}`
      });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Error in get-history:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}

