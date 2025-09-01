const { MailtrapClient } = require("mailtrap");

exports.handler = async (event) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { email } = JSON.parse(event.body);
    
    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Email is required" })
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid email format" })
      };
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Initialize MailTrap
    const mailtrap = new MailtrapClient({ 
      token: process.env.MAILTRAP_TOKEN 
    });

    // Send email
    const response = await mailtrap.send({
      from: { name: "EasyEyes Support", email: process.env.EMAIL_FROM },
      to: [{ email }],
      subject: "🔐 Your EasyEyes Verification Code",
      text: `Your verification code is: ${code}\n\nThis code is valid for 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; font-size:16px; color:#333;">
          <h2 style="color:#0b5cff;">Your Verification Code</h2>
          <p>Hello,</p>
          <p>Your verification code is:</p>
          <div style="font-size:24px; font-weight:bold; margin:16px 0; color:#000;">
            ${code}
          </div>
          <p>This code is valid for 10 minutes.</p>
          <p>If you didn't request this code, you can safely ignore this email.</p>
          <br/>
          <p>Thanks,<br/>EasyEyes Team</p>
        </div>
      `,
      category: "verification_code",
    });

    console.log("[Mailtrap] send response:", response);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "Verification code sent" })
    };

  } catch (error) {
    console.error('Error sending email:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to send email" })
    };
  }
};
