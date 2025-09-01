exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { email, code } = JSON.parse(event.body);
    
    if (!email || !code) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Email and code are required" })
      };
    }

    // For demo purposes, accept any 6-digit code
    // In production, you'd store codes in a database and check expiration
    if (code && code.length === 6 && /^\d{6}$/.test(code)) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ verified: true })
      };
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ verified: false, message: "Invalid or expired code" })
      };
    }

  } catch (error) {
    console.error('Error verifying code:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Server error" })
    };
  }
};
