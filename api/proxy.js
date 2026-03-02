export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { prompt, model, temperature } = req.body;
    
    // Validate required fields
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    console.log('🔵 Proxying request to OpenRouter...');
    
    // Make request to OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers.origin || 'https://fitfuel-pro.vercel.app',
        'X-Title': 'FitFuel Pro'
      },
      body: JSON.stringify({
        model: model || 'stepfun/step-3.5-flash:free',
        messages: [{ role: 'user', content: prompt }],
        temperature: temperature || 0.3
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenRouter error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `OpenRouter API error: ${response.status}`,
        details: errorText 
      });
    }
    
    const data = await response.json();
    console.log('✅ OpenRouter request successful');
    
    // Return the response
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch from OpenRouter',
      details: error.message 
    });
  }
}