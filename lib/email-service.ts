import { Resend } from 'resend';
import { render } from '@react-email/render';
import RSVPConfirmationEmail from './emails/rsvp-confirmation';
import RSVPCancellationEmail from './emails/rsvp-cancellation';
import WelcomeEmail from './emails/welcome-email';
import EventReminderEmail from './emails/event-reminder';
import EventCancellationEmail from './emails/event-cancellation';
import RefundConfirmationEmail from './emails/templates/RefundConfirmationEmail';
import { EMAIL_ADDRESSES } from './config/email-addresses';

// Lazy-initialize Resend to prevent build-time failures
let resendInstance: Resend | null = null;

function getResendInstance(): Resend {
    if (!resendInstance) {
        if (!process.env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY environment variable is required');
        }
        resendInstance = new Resend(process.env.RESEND_API_KEY);
    }
    return resendInstance;
}

// ✨ EMAIL OVERRIDE CONFIGURATION
// Use dedicated environment variable for email override control
const shouldOverrideEmails = process.env.OVERRIDE_EMAILS_TO_DEV === 'true';
const isLocalDevelopment = process.env.NODE_ENV === 'development' && process.env.VERCEL_ENV !== 'production';
const devOverrideEmail = 'jackson_rhoden@outlook.com'; // Your verified email

// Helper function to get the actual recipient email
function getRecipientEmail(originalEmail: string): string {
    // Only override if explicitly enabled AND we're in local development
    const shouldRedirect = shouldOverrideEmails && isLocalDevelopment;
    
    if (shouldRedirect && originalEmail !== devOverrideEmail) {
        console.log(`🔧 DEV MODE: Redirecting email from ${originalEmail} to ${devOverrideEmail}`);
        return devOverrideEmail;
    }
    
    // Always use original email in production or when override is disabled
    return originalEmail;
}

export interface SendRSVPConfirmationProps {
    to: string;
    userName: string;
    userEmail: string;
    eventTitle: string;
    eventDescription: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    eventAddress: string;
    organizerName: string;
    organizerEmail: string;
    rsvpId: string;
    guestCount: number;
    isAuthenticated: boolean;
    eventSlug?: string;
    cancellationDeadline?: string;
}

export interface SendRSVPCancellationProps {
    to: string;
    userName: string;
    userEmail: string;
    eventTitle: string;
    eventDescription: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    eventAddress: string;
    organizerName: string;
    organizerEmail: string;
    rsvpId: string;
    cancellationReason?: string;
    eventSlug?: string;
}

export interface EmailServiceResponse {
    success: boolean;
    messageId?: string;
    error?: string;
}

export interface SendWelcomeEmailProps {
    to: string;
    userName: string;
}

export interface SendEventReminderProps {
    to: string;
    userName: string;
    userEmail: string;
    eventTitle: string;
    eventDescription: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    eventAddress: string;
    organizerName: string;
    organizerEmail: string;
    rsvpId?: string;
    isTicketHolder?: boolean;
    ticketCount?: number;
    reminderType: '24h' | '1h' | 'custom';
    eventSlug?: string;
    timeUntilEvent?: string;
}

export interface SendEventCancellationProps {
    to: string;
    userName: string;
    userEmail: string;
    eventTitle: string;
    eventDescription: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    eventAddress: string;
    organizerName: string;
    organizerEmail: string;
    cancellationReason?: string;
    rsvpId?: string;
    isTicketHolder?: boolean;
    refundAmount?: number;
    refundTimeframe?: string;
    eventSlug?: string;
}

interface RefundItem {
    ticketType: string;
    quantity: number;
    originalPrice: number;
    refundAmount: number;
}

export interface SendRefundConfirmationProps {
    to: string;
    customerName: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    refundedTickets: RefundItem[];
    totalRefundAmount: number;
    originalOrderAmount: number;
    refundType: 'full_cancellation' | 'customer_request';
    stripeRefundId: string;
    orderId: string;
    processingTimeframe?: string;
    refundReason?: string;
    remainingAmount?: number;
    eventSlug?: string;
}

/**
 * Send RSVP confirmation email to user
 */
export async function sendRSVPConfirmationEmail(
    props: SendRSVPConfirmationProps
): Promise<EmailServiceResponse> {
    try {
        // Check if Resend is configured
        if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY not configured - email sending disabled');
            return {
                success: false,
                error: 'Email service not configured'
            };
        }

        // Render the email template
        const emailHtml = await render(RSVPConfirmationEmail(props));

        // Send the email
        const response = await getResendInstance().emails.send({
            from: process.env.RESEND_FROM_EMAIL || `LocalLoop <${EMAIL_ADDRESSES.SYSTEM_FROM}>`,
            to: getRecipientEmail(props.to),
            subject: `RSVP Confirmed: ${props.eventTitle}`,
            html: emailHtml,
            // Add text version for better deliverability
            text: generateTextVersion(props),
            // Add tags for tracking
            tags: [
                { name: 'type', value: 'rsvp-confirmation' },
                { name: 'event', value: props.eventSlug || 'unknown' },
                { name: 'user-type', value: props.isAuthenticated ? 'authenticated' : 'guest' }
            ],
            // Add reply-to organizer email
            replyTo: props.organizerEmail,
        });

        console.log('RSVP confirmation email sent successfully:', {
            messageId: response.data?.id,
            to: props.to,
            eventTitle: props.eventTitle,
            rsvpId: props.rsvpId
        });

        return {
            success: true,
            messageId: response.data?.id
        };

    } catch (error) {
        console.error('Failed to send RSVP confirmation email:', error);

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Generate text version of the email for better deliverability
 */
function generateTextVersion(props: SendRSVPConfirmationProps): string {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const eventUrl = `${baseUrl}/events/${props.eventSlug}`;

    return `
RSVP CONFIRMED!

Hi ${props.userName},

Great news! Your RSVP for "${props.eventTitle}" has been confirmed.${props.guestCount > 1 ? ` You've reserved ${props.guestCount} spots for this event.` : ''}

EVENT DETAILS:
📅 Date: ${props.eventDate}
🕐 Time: ${props.eventTime}
📍 Location: ${props.eventLocation}
🏢 Address: ${props.eventAddress}
👤 Organizer: ${props.organizerName}
${props.guestCount > 1 ? `👥 Guests: ${props.guestCount} people\n` : ''}

${props.eventDescription}

QUICK ACTIONS:
• View Event Details: ${eventUrl}
• Add to Google Calendar: https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(props.eventTitle)}

${props.cancellationDeadline ? `CANCELLATION POLICY:
You can cancel your RSVP until ${props.cancellationDeadline}. After this time, cancellations may not be allowed.

` : ''}NEED TO MAKE CHANGES?
${props.isAuthenticated
            ? `Visit your My Events page to manage your RSVPs: ${baseUrl}/my-events`
            : `Contact the organizer at ${props.organizerEmail} or reply to this email with your RSVP ID: ${props.rsvpId}`
        }

Questions? Contact ${props.organizerName} at ${props.organizerEmail}

---
This email was sent by LocalLoop. You're receiving this because you signed up for ${props.eventTitle}.
Unsubscribe: ${baseUrl}/unsubscribe?email=${encodeURIComponent(props.userEmail)}
  `.trim();
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(
    props: SendWelcomeEmailProps
): Promise<EmailServiceResponse> {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY not configured - email sending disabled');
            return {
                success: false,
                error: 'Email service not configured'
            };
        }

        // Render the email template
        const emailHtml = await render(WelcomeEmail({
            userName: props.userName,
            userEmail: props.to,
        }));

        // Send the email
        const response = await getResendInstance().emails.send({
            from: process.env.RESEND_FROM_EMAIL || `LocalLoop <${EMAIL_ADDRESSES.SYSTEM_FROM}>`,
            to: getRecipientEmail(props.to),
            subject: 'Welcome to LocalLoop! 🎉',
            html: emailHtml,
            // Add text version for better deliverability
            text: generateWelcomeTextVersion(props),
            // Add tags for tracking
            tags: [
                { name: 'type', value: 'welcome' },
                { name: 'user-type', value: 'new-user' }
            ],
        });

        console.log('Welcome email sent successfully:', {
            messageId: response.data?.id,
            to: props.to,
            userName: props.userName
        });

        return {
            success: true,
            messageId: response.data?.id
        };
    } catch (error) {
        console.error('Failed to send welcome email:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Generate text version of the welcome email
 */
function generateWelcomeTextVersion(props: SendWelcomeEmailProps): string {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    return `
WELCOME TO LOCALLOOP! 🎉

Hi ${props.userName},

Welcome to LocalLoop! We're thrilled to have you join our community of local event enthusiasts.

LocalLoop makes it easy to discover, organize, and attend amazing events in your area. Whether you're looking for networking opportunities, workshops, social gatherings, or unique experiences, we've got you covered.

WHAT YOU CAN DO WITH LOCALLOOP:
• 🔍 Discover Events: Browse local events tailored to your interests
• 📅 Easy RSVP: Reserve your spot with just a few clicks
• 🎫 Secure Tickets: Purchase tickets safely with Stripe integration
• 📱 Calendar Sync: Connect with Google Calendar for seamless scheduling
• 🏗️ Create Events: Organize your own events and build community

QUICK START TIPS:
• Complete your profile to get personalized event recommendations
• Connect your Google Calendar to automatically sync RSVPs
• Follow event organizers you're interested in
• Turn on notifications to never miss events you care about

QUICK ACTIONS:
• Explore Events: ${baseUrl}/events
• Create Your First Event: ${baseUrl}/create-event
• Manage Your Profile: ${baseUrl}/my-events

NEED HELP GETTING STARTED?
Visit your My Events page to manage your RSVPs and created events: ${baseUrl}/my-events

Have questions? Contact us at ${EMAIL_ADDRESSES.SUPPORT}

---
This email was sent by LocalLoop. You're receiving this because you created an account.
Unsubscribe: ${baseUrl}/unsubscribe?email=${encodeURIComponent(props.to)}
  `.trim();
}

/**
 * Send event reminder email
 */
export async function sendEventReminderEmail(
    props: SendEventReminderProps
): Promise<EmailServiceResponse> {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY not configured - email sending disabled');
            return {
                success: false,
                error: 'Email service not configured'
            };
        }

        // Render the email template
        const emailHtml = await render(EventReminderEmail(props));

        const getReminderSubject = () => {
            switch (props.reminderType) {
                case '24h':
                    return `Reminder: ${props.eventTitle} is tomorrow!`;
                case '1h':
                    return `Starting Soon: ${props.eventTitle} in 1 hour!`;
                default:
                    return `Event Reminder: ${props.eventTitle}`;
            }
        };

        // Send the email
        const response = await getResendInstance().emails.send({
            from: process.env.RESEND_FROM_EMAIL || `LocalLoop <${EMAIL_ADDRESSES.SYSTEM_FROM}>`,
            to: getRecipientEmail(props.to),
            subject: getReminderSubject(),
            html: emailHtml,
            // Add text version for better deliverability
            text: generateReminderTextVersion(props),
            // Add tags for tracking
            tags: [
                { name: 'type', value: 'event-reminder' },
                { name: 'reminder-type', value: props.reminderType },
                { name: 'event', value: props.eventSlug || 'unknown' },
                { name: 'user-type', value: props.isTicketHolder ? 'ticket-holder' : 'rsvp' }
            ],
            // Add reply-to organizer email
            replyTo: props.organizerEmail,
        });

        console.log('Event reminder email sent successfully:', {
            messageId: response.data?.id,
            to: props.to,
            eventTitle: props.eventTitle,
            reminderType: props.reminderType,
            rsvpId: props.rsvpId
        });

        return {
            success: true,
            messageId: response.data?.id
        };
    } catch (error) {
        console.error('Failed to send event reminder email:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Generate text version of the reminder email
 */
function generateReminderTextVersion(props: SendEventReminderProps): string {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const eventUrl = `${baseUrl}/events/${props.eventSlug}`;

    const getReminderTitle = () => {
        switch (props.reminderType) {
            case '24h':
                return 'EVENT REMINDER: TOMORROW!';
            case '1h':
                return 'STARTING SOON: 1 HOUR TO GO!';
            default:
                return 'EVENT REMINDER';
        }
    };

    const getReminderMessage = () => {
        switch (props.reminderType) {
            case '24h':
                return "Your event is coming up tomorrow! Don't forget to attend.";
            case '1h':
                return "Your event starts in just 1 hour! Time to get ready.";
            default:
                return props.timeUntilEvent ? `Your event starts ${props.timeUntilEvent}!` : 'Your event is coming up soon!';
        }
    };

    return `
${getReminderTitle()}

Hi ${props.userName},

${getReminderMessage()}

EVENT DETAILS:
📅 Date: ${props.eventDate}
🕐 Time: ${props.eventTime}
📍 Location: ${props.eventLocation}
🏢 Address: ${props.eventAddress}
👤 Organizer: ${props.organizerName}
${props.isTicketHolder && props.ticketCount && props.ticketCount > 1 ? `🎫 Tickets: ${props.ticketCount} tickets\n` : ''}

${props.eventDescription}

STATUS: ${props.isTicketHolder ? '🎫 Ticket Holder - You\'re all set to attend!' : '✅ RSVP Confirmed - You\'re registered to attend!'}

PRE-EVENT CHECKLIST:
• Know the exact location and arrive a few minutes early
• Bring any required items or documents${props.isTicketHolder ? '\n• Keep your ticket confirmation email handy' : ''}
• Check the weather and dress appropriately
• Contact the organizer if you have any last-minute questions

QUICK ACTIONS:
• View Event Details: ${eventUrl}
• Add to Google Calendar: https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(props.eventTitle)}
• Get Directions: https://maps.google.com/maps?q=${encodeURIComponent(props.eventAddress)}

${props.rsvpId ? `Your RSVP ID: ${props.rsvpId}\n\n` : ''}Questions about the event? Contact the organizer: ${props.organizerName} at ${props.organizerEmail}

---
This reminder was sent by LocalLoop. You're receiving this because you're registered for ${props.eventTitle}.
Unsubscribe: ${baseUrl}/unsubscribe?email=${encodeURIComponent(props.userEmail)}
  `.trim();
}

/**
 * Send event cancellation email
 */
export async function sendEventCancellationEmail(
    props: SendEventCancellationProps
): Promise<EmailServiceResponse> {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY not configured - email sending disabled');
            return {
                success: false,
                error: 'Email service not configured'
            };
        }

        // Render the email template
        const emailHtml = await render(EventCancellationEmail(props));

        // Send the email
        const response = await getResendInstance().emails.send({
            from: process.env.RESEND_FROM_EMAIL || `LocalLoop <${EMAIL_ADDRESSES.SYSTEM_FROM}>`,
            to: getRecipientEmail(props.to),
            subject: `Event Cancelled: ${props.eventTitle}`,
            html: emailHtml,
            // Add text version for better deliverability
            text: generateEventCancellationTextVersion(props),
            // Add tags for tracking
            tags: [
                { name: 'type', value: 'event-cancellation' },
                { name: 'event', value: props.eventSlug || 'unknown' },
                { name: 'user-type', value: props.isTicketHolder ? 'ticket-holder' : 'rsvp' }
            ],
            // Add reply-to organizer email
            replyTo: props.organizerEmail,
        });

        console.log('Event cancellation email sent successfully:', {
            messageId: response.data?.id,
            to: props.to,
            eventTitle: props.eventTitle,
            isTicketHolder: props.isTicketHolder,
            rsvpId: props.rsvpId
        });

        return {
            success: true,
            messageId: response.data?.id
        };
    } catch (error) {
        console.error('Failed to send event cancellation email:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Generate text version of the cancellation email
 */
function generateEventCancellationTextVersion(props: SendEventCancellationProps): string {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    return `
EVENT CANCELLED

Hi ${props.userName},

We're sorry to inform you that "${props.eventTitle}" has been cancelled by the organizer.

EVENT DETAILS:
📅 Original Date: ${props.eventDate}
🕐 Original Time: ${props.eventTime}
📍 Location: ${props.eventLocation}
🏢 Address: ${props.eventAddress}
👤 Organizer: ${props.organizerName}
${props.rsvpId ? `🆔 Your RSVP ID: ${props.rsvpId}\n` : ''}

${props.eventDescription}

${props.cancellationReason ? `REASON FOR CANCELLATION:
${props.cancellationReason}

` : ''}STATUS: ❌ Event Cancelled - No action required from you

${props.isTicketHolder ? `REFUND INFORMATION:
${props.refundAmount !== undefined
                ? `Refund Amount: $${(props.refundAmount / 100).toFixed(2)}
Processing Time: ${props.refundTimeframe || '5-10 business days'}
Your refund will be processed automatically to your original payment method.`
                : `Since you purchased tickets for this event, a full refund will be processed automatically. 
Please allow ${props.refundTimeframe || '5-10 business days'} for the refund to appear in your account.`
            }

` : ''}WHAT HAPPENS NEXT:
• Your RSVP has been automatically cancelled${props.isTicketHolder ? '\n• Your tickets are no longer valid\n• A full refund will be processed automatically' : ''}
• This event has been removed from your calendar (if synced)
• You can still contact the organizer with any questions

QUICK ACTIONS:
• Find Similar Events: ${baseUrl}/events
• Contact Organizer: ${props.organizerEmail}

Questions about this cancellation? Contact the event organizer: ${props.organizerName} at ${props.organizerEmail}
${props.isTicketHolder ? `For refund inquiries, please contact: ${EMAIL_ADDRESSES.SUPPORT}\n` : ''}
---
This cancellation notice was sent by LocalLoop on behalf of ${props.organizerName}.
Unsubscribe: ${baseUrl}/unsubscribe?email=${encodeURIComponent(props.userEmail)}
  `.trim();
}

/**
 * Send RSVP cancellation email to user
 */
export async function sendRSVPCancellationEmail(
    props: SendRSVPCancellationProps
): Promise<EmailServiceResponse> {
    try {
        // Check if Resend is configured
        if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY not configured - email sending disabled');
            return {
                success: false,
                error: 'Email service not configured'
            };
        }

        // Render the email template
        const emailHtml = await render(RSVPCancellationEmail(props));

        // Send the email
        const response = await getResendInstance().emails.send({
            from: process.env.RESEND_FROM_EMAIL || `LocalLoop <${EMAIL_ADDRESSES.SYSTEM_FROM}>`,
            to: getRecipientEmail(props.to),
            subject: `RSVP Cancelled: ${props.eventTitle}`,
            html: emailHtml,
            // Add text version for better deliverability
            text: generateCancellationTextVersion(props),
            // Add tags for tracking
            tags: [
                { name: 'type', value: 'rsvp-cancellation' },
                { name: 'event', value: props.eventSlug || 'unknown' }
            ],
            // Add reply-to organizer email
            replyTo: props.organizerEmail,
        });

        console.log('RSVP cancellation email sent successfully:', {
            messageId: response.data?.id,
            to: props.to,
            eventTitle: props.eventTitle,
            rsvpId: props.rsvpId
        });

        return {
            success: true,
            messageId: response.data?.id
        };

    } catch (error) {
        console.error('Failed to send RSVP cancellation email:', error);

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Generate text version of the cancellation email for better deliverability
 */
function generateCancellationTextVersion(props: SendRSVPCancellationProps): string {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const eventUrl = `${baseUrl}/events/${props.eventSlug}`;

    return `
RSVP CANCELLED

Hi ${props.userName},

Your RSVP for "${props.eventTitle}" has been cancelled.

EVENT DETAILS:
📅 Date: ${props.eventDate}
🕐 Time: ${props.eventTime}
📍 Location: ${props.eventLocation}
🏢 Address: ${props.eventAddress}
👤 Organizer: ${props.organizerName}
🆔 Your RSVP ID: ${props.rsvpId}

${props.eventDescription}

${props.cancellationReason ? `CANCELLATION REASON:
${props.cancellationReason}

` : ''}STATUS: ❌ RSVP Cancelled - You will not attend this event

WHAT HAPPENS NEXT:
• Your RSVP has been removed from the event
• This event has been removed from your calendar (if synced)
• You can RSVP again later if you change your mind

QUICK ACTIONS:
• View Event Details: ${eventUrl}
• RSVP Again: ${eventUrl}
• Browse Other Events: ${baseUrl}/events

Questions about the event? Contact the organizer: ${props.organizerName} at ${props.organizerEmail}

---
This cancellation notice was sent by LocalLoop.
Unsubscribe: ${baseUrl}/unsubscribe?email=${encodeURIComponent(props.userEmail)}
  `.trim();
}

/**
 * Send refund confirmation email
 */
export async function sendRefundConfirmationEmail(
    props: SendRefundConfirmationProps
): Promise<EmailServiceResponse> {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY not configured - email sending disabled');
            return {
                success: false,
                error: 'Email service not configured'
            };
        }

        // Render the email template
        const emailHtml = await render(RefundConfirmationEmail({
            customerName: props.customerName,
            eventTitle: props.eventTitle,
            eventDate: props.eventDate,
            eventTime: props.eventTime,
            eventLocation: props.eventLocation,
            refundedTickets: props.refundedTickets,
            totalRefundAmount: props.totalRefundAmount,
            originalOrderAmount: props.originalOrderAmount,
            refundType: props.refundType,
            stripeRefundId: props.stripeRefundId,
            orderId: props.orderId,
            processingTimeframe: props.processingTimeframe || '5-10 business days',
            refundReason: props.refundReason,
            remainingAmount: props.remainingAmount || 0
        }));

        // Generate subject line based on refund type
        const subject = props.refundType === 'full_cancellation'
            ? `Event Cancelled - Refund Processed: ${props.eventTitle}`
            : `Refund Confirmation: ${props.eventTitle}`;

        // Send the email
        const response = await getResendInstance().emails.send({
            from: process.env.RESEND_FROM_EMAIL || `LocalLoop <${EMAIL_ADDRESSES.SYSTEM_FROM}>`,
            to: getRecipientEmail(props.to),
            subject: subject,
            html: emailHtml,
            // Add text version for better deliverability
            text: generateRefundTextVersion(props),
            // Add tags for tracking
            tags: [
                { name: 'type', value: 'refund-confirmation' },
                { name: 'refund-type', value: props.refundType },
                { name: 'event', value: props.eventSlug || 'unknown' },
                { name: 'order', value: props.orderId }
            ],
            // Add reply-to support email for refund inquiries
            replyTo: EMAIL_ADDRESSES.SUPPORT,
        });

        console.log('Refund confirmation email sent successfully:', {
            messageId: response.data?.id,
            to: props.to,
            eventTitle: props.eventTitle,
            refundType: props.refundType,
            refundAmount: props.totalRefundAmount,
            orderId: props.orderId,
            stripeRefundId: props.stripeRefundId
        });

        return {
            success: true,
            messageId: response.data?.id
        };
    } catch (error) {
        console.error('Failed to send refund confirmation email:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Generate text version of the refund confirmation email
 */
function generateRefundTextVersion(props: SendRefundConfirmationProps): string {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const eventUrl = `${baseUrl}/events/${props.eventSlug}`;

    const isFullRefund = props.remainingAmount === 0;
    const isEventCancellation = props.refundType === 'full_cancellation';

    return `
REFUND CONFIRMATION

Hi ${props.customerName},

${isEventCancellation
            ? `We're sorry to inform you that "${props.eventTitle}" has been cancelled. Your refund has been processed automatically.`
            : `Your refund request for "${props.eventTitle}" has been processed successfully.`
        }

REFUND DETAILS:
💰 Refund Amount: $${(props.totalRefundAmount / 100).toFixed(2)}
📋 Order ID: ${props.orderId}
🏦 Refund ID: ${props.stripeRefundId}
⏰ Processing Time: ${props.processingTimeframe || '5-10 business days'}

EVENT DETAILS:
📅 Date: ${props.eventDate}
🕐 Time: ${props.eventTime}
📍 Location: ${props.eventLocation}

REFUNDED TICKETS:
${props.refundedTickets.map(ticket =>
            `• ${ticket.ticketType} (${ticket.quantity}x) - Original: $${(ticket.originalPrice / 100).toFixed(2)} | Refund: $${(ticket.refundAmount / 100).toFixed(2)}`
        ).join('\n')}

PAYMENT SUMMARY:
Original Order Total: $${(props.originalOrderAmount / 100).toFixed(2)}
Total Refund Amount: $${(props.totalRefundAmount / 100).toFixed(2)}${!isFullRefund ? `\nRemaining Balance: $${(props.remainingAmount! / 100).toFixed(2)}` : ''}

REFUND INFORMATION:
• Your refund will appear on your original payment method within ${props.processingTimeframe || '5-10 business days'}
• Keep this email as proof of your refund processing${!isEventCancellation ? '\n• Processing fees may apply as shown in the refund amount above' : ''}
• Contact us if you have any questions about your refund${props.refundReason ? `\n• Refund reason: ${props.refundReason}` : ''}

QUICK ACTIONS:
• View Event Details: ${eventUrl}
• Browse Other Events: ${baseUrl}/events
• Contact Support: ${EMAIL_ADDRESSES.SUPPORT}

${isEventCancellation
            ? 'We apologize for any inconvenience caused by the event cancellation.'
            : 'Thank you for your understanding.'
        }

If you have any questions about this refund, please don't hesitate to contact us.

Best regards,
The LocalLoop Events Team

---
This refund confirmation was sent by LocalLoop.
Unsubscribe: ${baseUrl}/unsubscribe?email=${encodeURIComponent(props.to)}
  `.trim();
} 