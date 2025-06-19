import {
    Html,
    Head,
    Body,
    Container,
    Section,
    Text,
    Link,
    Hr,
    Img,
    Button,
    Preview,
    Heading,
} from '@react-email/components';
import * as React from 'react';

interface EventCancellationEmailProps {
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
}

export const EventCancellationEmail = ({
    userName,
    userEmail,
    eventTitle,
    eventDescription,
    eventDate,
    eventTime,
    eventLocation,
    eventAddress,
    organizerName,
    organizerEmail,
    cancellationReason,
    rsvpId,
    isTicketHolder = false,
    refundAmount,
    refundTimeframe,
}: EventCancellationEmailProps) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    return (
        <Html>
            <Head />
            <Preview>Event Cancelled: {eventTitle}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Img
                            src={`${baseUrl}/logo.svg`}
                            width="50"
                            height="50"
                            alt="LocalLoop"
                            style={logo}
                        />
                        <Heading style={h1}>⚠️ Event Cancelled</Heading>
                    </Section>

                    {/* Main Content */}
                    <Section style={content}>
                        <Text style={greeting}>
                            Hi {userName},
                        </Text>

                        <Text style={paragraph}>
                            We&apos;re sorry to inform you that <strong>{eventTitle}</strong> has been cancelled by the organizer.
                        </Text>

                        {/* Event Details Card */}
                        <Section style={eventCard}>
                            <Heading style={eventTitleStyle}>{eventTitle}</Heading>

                            <Section style={eventDetails}>
                                <Text style={detailItem}>
                                    <strong>📅 Original Date:</strong> {eventDate}
                                </Text>
                                <Text style={detailItem}>
                                    <strong>🕐 Original Time:</strong> {eventTime}
                                </Text>
                                <Text style={detailItem}>
                                    <strong>📍 Location:</strong> {eventLocation}
                                </Text>
                                <Text style={detailItem}>
                                    <strong>🏢 Address:</strong> {eventAddress}
                                </Text>
                                <Text style={detailItem}>
                                    <strong>👤 Organizer:</strong> {organizerName}
                                </Text>
                                {rsvpId && (
                                    <Text style={detailItem}>
                                        <strong>🆔 Your RSVP ID:</strong> {rsvpId}
                                    </Text>
                                )}
                            </Section>

                            <Text style={description}>
                                {eventDescription}
                            </Text>
                        </Section>

                        {/* Cancellation Reason */}
                        {cancellationReason && (
                            <Section style={reasonSection}>
                                <Heading style={h3}>📝 Reason for Cancellation:</Heading>
                                <Text style={reasonText}>
                                    {cancellationReason}
                                </Text>
                            </Section>
                        )}

                        {/* Status Badge */}
                        <Section style={cancelledBadge}>
                            <Text style={cancelledText}>
                                ❌ <strong>Event Cancelled</strong> - No action required from you
                            </Text>
                        </Section>

                        {/* Refund Information for Ticket Holders */}
                        {isTicketHolder && (
                            <Section style={refundSection}>
                                <Heading style={h3}>💰 Refund Information:</Heading>
                                {refundAmount !== undefined ? (
                                    <>
                                        <Text style={refundText}>
                                            <strong>Refund Amount:</strong> ${(refundAmount / 100).toFixed(2)}
                                        </Text>
                                        <Text style={refundText}>
                                            <strong>Processing Time:</strong> {refundTimeframe || '5-10 business days'}
                                        </Text>
                                        <Text style={refundText}>
                                            Your refund will be processed automatically to your original payment method.
                                            You should see the refund in your account within the specified timeframe.
                                        </Text>
                                    </>
                                ) : (
                                    <Text style={refundText}>
                                        Since you purchased tickets for this event, a full refund will be processed automatically.
                                        Please allow {refundTimeframe || '5-10 business days'} for the refund to appear in your account.
                                    </Text>
                                )}
                            </Section>
                        )}

                        {/* Next Steps */}
                        <Section style={nextStepsSection}>
                            <Heading style={h3}>🔄 What happens next:</Heading>
                            <Text style={stepItem}>
                                • Your RSVP has been automatically cancelled
                            </Text>
                            {isTicketHolder && (
                                <Text style={stepItem}>
                                    • Your tickets are no longer valid
                                </Text>
                            )}
                            {isTicketHolder && (
                                <Text style={stepItem}>
                                    • A full refund will be processed automatically
                                </Text>
                            )}
                            <Text style={stepItem}>
                                • This event has been removed from your calendar (if synced)
                            </Text>
                            <Text style={stepItem}>
                                • You can still contact the organizer with any questions
                            </Text>
                        </Section>

                        {/* Action Buttons */}
                        <Section style={buttonContainer}>
                            <Button style={primaryButton} href={`${baseUrl}/events`}>
                                🔍 Find Similar Events
                            </Button>

                            <Button style={secondaryButton} href={`mailto:${organizerEmail}`}>
                                📧 Contact Organizer
                            </Button>
                        </Section>

                        {/* Alternative Events Suggestion */}
                        <Section style={suggestionSection}>
                            <Heading style={h3}>💡 Looking for something similar?</Heading>
                            <Text style={suggestionText}>
                                We understand this cancellation is disappointing. Browse our events page to discover similar events in your area that might interest you.
                            </Text>

                            <Button style={exploreButton} href={`${baseUrl}/events`}>
                                🎉 Explore Other Events
                            </Button>
                        </Section>
                    </Section>

                    <Hr style={divider} />

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            <strong>Questions about this cancellation?</strong>
                        </Text>

                        <Text style={footerText}>
                            Contact the event organizer: <Link href={`mailto:${organizerEmail}`} style={link}>{organizerName}</Link>
                        </Text>

                        {isTicketHolder && (
                            <Text style={footerText}>
                                For refund inquiries, please contact: <Link href="mailto:support@localloopevents.xyz" style={link}>support@localloopevents.xyz</Link>
                            </Text>
                        )}

                        <Hr style={divider} />

                        <Text style={footerSmall}>
                            This cancellation notice was sent by LocalLoop on behalf of {organizerName}.
                            <br />
                            <Link href={`${baseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}`} style={unsubscribeLink}>
                                Unsubscribe from event notifications
                            </Link>
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

// Styles
const main = {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
};

const header = {
    padding: '32px 24px',
    textAlign: 'center' as const,
    backgroundColor: '#dc2626',
    borderRadius: '12px 12px 0 0',
};

const logo = {
    margin: '0 auto',
    borderRadius: '8px',
};

const h1 = {
    color: '#ffffff',
    fontSize: '28px',
    fontWeight: '700',
    margin: '16px 0 0',
    padding: '0',
    lineHeight: '1.3',
};

const h3 = {
    color: '#1f2937',
    fontSize: '18px',
    fontWeight: '600',
    margin: '20px 0 12px',
    padding: '0',
};

const content = {
    padding: '32px 24px',
};

const greeting = {
    color: '#1f2937',
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 24px',
};

const paragraph = {
    color: '#4b5563',
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '0 0 24px',
    fontWeight: '500',
};

const eventCard = {
    backgroundColor: '#f9fafb',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    padding: '24px',
    margin: '24px 0',
};

const eventTitleStyle = {
    color: '#1f2937',
    fontSize: '24px',
    fontWeight: '700',
    margin: '0 0 20px',
    padding: '0',
    lineHeight: '1.3',
    textDecoration: 'line-through',
    opacity: '0.7',
};

const eventDetails = {
    margin: '20px 0',
};

const detailItem = {
    color: '#374151',
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '0 0 8px',
};

const description = {
    color: '#6b7280',
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '20px 0 0',
    fontStyle: 'italic',
};

const reasonSection = {
    backgroundColor: '#fef3c7',
    border: '1px solid #f59e0b',
    borderRadius: '8px',
    padding: '24px',
    margin: '24px 0',
};

const reasonText = {
    color: '#92400e',
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '0',
    fontStyle: 'italic',
};

const cancelledBadge = {
    backgroundColor: '#fef2f2',
    border: '2px solid #dc2626',
    borderRadius: '8px',
    padding: '16px',
    margin: '24px 0',
    textAlign: 'center' as const,
};

const cancelledText = {
    color: '#991b1b',
    fontSize: '16px',
    fontWeight: '600',
    margin: '0',
};

const refundSection = {
    backgroundColor: '#ecfdf5',
    border: '1px solid #10b981',
    borderRadius: '8px',
    padding: '24px',
    margin: '32px 0',
};

const refundText = {
    color: '#047857',
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0 0 12px',
};

const nextStepsSection = {
    backgroundColor: '#f0f9ff',
    border: '1px solid #0ea5e9',
    borderRadius: '8px',
    padding: '24px',
    margin: '32px 0',
};

const stepItem = {
    color: '#0c4a6e',
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0 0 8px',
};

const buttonContainer = {
    textAlign: 'center' as const,
    margin: '32px 0',
};

const primaryButton = {
    backgroundColor: '#6366f1',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '16px 32px',
    margin: '8px 16px',
    minWidth: '180px',
};

const secondaryButton = {
    backgroundColor: '#ffffff',
    border: '2px solid #6366f1',
    borderRadius: '8px',
    color: '#6366f1',
    fontSize: '16px',
    fontWeight: '600',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '14px 30px',
    margin: '8px 16px',
    minWidth: '180px',
};

const suggestionSection = {
    backgroundColor: '#f5f3ff',
    border: '1px solid #a855f7',
    borderRadius: '8px',
    padding: '24px',
    margin: '32px 0',
    textAlign: 'center' as const,
};

const suggestionText = {
    color: '#6b21a8',
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '0 0 20px',
};

const exploreButton = {
    backgroundColor: '#a855f7',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 24px',
    margin: '0',
};

const divider = {
    borderColor: '#e5e7eb',
    margin: '32px 0',
};

const footer = {
    padding: '0 24px 32px',
    textAlign: 'center' as const,
};

const footerText = {
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: '0 0 8px',
};

const footerSmall = {
    color: '#9ca3af',
    fontSize: '12px',
    lineHeight: '1.5',
    margin: '16px 0 0',
};

const link = {
    color: '#6366f1',
    textDecoration: 'underline',
};

const unsubscribeLink = {
    color: '#9ca3af',
    textDecoration: 'underline',
    fontSize: '12px',
};

export default EventCancellationEmail; 