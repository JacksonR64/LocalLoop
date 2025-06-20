// Quick test script to verify Resend API key
const fs = require('fs');

// Read .env.local file manually
const envContent = fs.readFileSync('.env.local', 'utf8');
const RESEND_API_KEY = envContent.match(/RESEND_API_KEY=(.+)/)?.[1];
const RESEND_FROM_EMAIL = envContent.match(/RESEND_FROM_EMAIL=(.+)/)?.[1];

console.log('Testing Resend API...');
console.log('API Key:', RESEND_API_KEY ? `${RESEND_API_KEY.substring(0, 10)}...` : 'NOT FOUND');
console.log('From Email:', RESEND_FROM_EMAIL || 'NOT FOUND');

async function testResend() {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: ['test1@localloopevents.xyz'], // Updated to use centralized test email
        subject: 'LocalLoop Test Email',
        html: '<h1>Test Email</h1><p>If you receive this, Resend is working!</p>',
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Email sent successfully!');
      console.log('Message ID:', data.id);
    } else {
      console.log('❌ Error sending email:');
      console.log('Status:', response.status);
      console.log('Error:', data);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

testResend(); 