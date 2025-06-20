// Manual ticket confirmation email test for recent purchase
const fs = require('fs');

// Read environment variables manually
const envContent = fs.readFileSync('.env.local', 'utf8');
const RESEND_API_KEY = envContent.match(/RESEND_API_KEY=(.+)/)?.[1];
const RESEND_FROM_EMAIL = envContent.match(/RESEND_FROM_EMAIL=(.+)/)?.[1];

console.log('🎫 Testing Ticket Confirmation Email...');

// Override for dev mode (same as in email-service.ts)
const isDevelopment = true;
const devOverrideEmail = 'test1@localloopevents.xyz'; // Updated to use centralized test email

function getRecipientEmail(originalEmail) {
    if (isDevelopment && originalEmail !== devOverrideEmail) {
        console.log(`🔧 DEV MODE: Redirecting email from ${originalEmail} to ${devOverrideEmail}`);
        return devOverrideEmail;
    }
    return originalEmail;
}

async function sendTestTicketConfirmation() {
    try {
        const customerEmail = 'TestLocalLoop@gmail.com'; // Updated to use centralized Google test email
        const actualRecipient = getRecipientEmail(customerEmail);
        
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: RESEND_FROM_EMAIL,
                to: [actualRecipient],
                subject: '🎫 Your LocalLoop Tickets - Local Business Networking',
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h1 style="color: #4f46e5;">🎉 Your Tickets Are Confirmed!</h1>
                        
                        <p>Hi there!</p>
                        
                        <p>Great news! Your ticket purchase for <strong>Local Business Networking</strong> has been confirmed. Here are your ticket details:</p>
                        
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                            <h3 style="margin-top: 0; color: #334155;">📅 Event Details</h3>
                            <p><strong>Event:</strong> Local Business Networking</p>
                            <p><strong>Date:</strong> June 11, 2025</p>
                            <p><strong>Time:</strong> 11:00 AM - 2:00 PM</p>
                            <p><strong>Location:</strong> Downtown Business Hub</p>
                        </div>
                        
                        <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 20px 0;">
                            <h3 style="margin-top: 0; color: #0c4a6e;">🎫 Your Tickets</h3>
                            <p><strong>Ticket Type:</strong> General Admission</p>
                            <p><strong>Quantity:</strong> 2 tickets</p>
                            <p><strong>Total Paid:</strong> $31.17</p>
                            <p><strong>Payment ID:</strong> pi_3RW6Xw04jm62qIIQ1SDv22fI</p>
                        </div>
                        
                        <div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0; color: #166534;"><strong>💡 What to bring:</strong> Just bring yourself and a positive attitude! We'll have name tags and networking materials ready.</p>
                        </div>
                        
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                        
                        <p>Looking forward to seeing you at the event!</p>
                        
                        <p style="color: #64748b; font-size: 14px;">
                            Best regards,<br>
                            The LocalLoop Team<br>
                            <em>This is a test email sent from development mode</em>
                        </p>
                    </div>
                `
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Resend API error: ${response.status} ${errorText}`);
        }
        
        const result = await response.json();
        console.log('✅ Ticket confirmation email sent successfully!');
        console.log(`📧 Email ID: ${result.id}`);
        console.log(`📬 Sent to: ${actualRecipient}`);
        console.log('🔍 Check your inbox at test1@localloopevents.xyz');
        
    } catch (error) {
        console.error('❌ Failed to send ticket confirmation email:', error.message);
    }
}

sendTestTicketConfirmation(); 