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
import { EMAIL_ADDRESSES } from '../config/email-addresses';

interface WelcomeEmailProps {
    userName: string;
    userEmail: string;
}

export const WelcomeEmail = ({
    userName,
    userEmail,
}: WelcomeEmailProps) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    return (
        <Html>
            <Head />
            <Preview>Welcome to LocalLoop - Discover amazing local events!</Preview>
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
                        <Heading style={h1}>Welcome to LocalLoop! 🎉</Heading>
                    </Section>

                    {/* Main Content */}
                    <Section style={content}>
                        <Text style={greeting}>
                            Hi {userName},
                        </Text>

                        <Text style={paragraph}>
                            Welcome to LocalLoop! We&apos;re thrilled to have you join our community of local event enthusiasts.
                        </Text>

                        <Text style={paragraph}>
                            LocalLoop makes it easy to discover, organize, and attend amazing events in your area.
                            Whether you&apos;re looking for networking opportunities, workshops, social gatherings, or unique experiences,
                            we&apos;ve got you covered.
                        </Text>

                        {/* Features Section */}
                        <Section style={featureSection}>
                            <Heading style={h2}>What you can do with LocalLoop:</Heading>

                            <Text style={featureItem}>
                                🔍 <strong>Discover Events:</strong> Browse local events tailored to your interests
                            </Text>
                            <Text style={featureItem}>
                                📅 <strong>Easy RSVP:</strong> Reserve your spot with just a few clicks
                            </Text>
                            <Text style={featureItem}>
                                🎫 <strong>Secure Tickets:</strong> Purchase tickets safely with Stripe integration
                            </Text>
                            <Text style={featureItem}>
                                📱 <strong>Calendar Sync:</strong> Connect with Google Calendar for seamless scheduling
                            </Text>
                            <Text style={featureItem}>
                                🏗️ <strong>Create Events:</strong> Organize your own events and build community
                            </Text>
                        </Section>

                        {/* Action Buttons */}
                        <Section style={buttonContainer}>
                            <Button style={primaryButton} href={`${baseUrl}/events`}>
                                🎉 Explore Events
                            </Button>

                            <Button style={secondaryButton} href={`${baseUrl}/create-event`}>
                                ➕ Create Your First Event
                            </Button>
                        </Section>

                        {/* Quick Start Tips */}
                        <Section style={tipSection}>
                            <Heading style={h3}>🚀 Quick Start Tips:</Heading>
                            <Text style={tipItem}>
                                • Complete your profile to get personalized event recommendations
                            </Text>
                            <Text style={tipItem}>
                                • Connect your Google Calendar to automatically sync RSVPs
                            </Text>
                            <Text style={tipItem}>
                                • Follow event organizers you&apos;re interested in
                            </Text>
                            <Text style={tipItem}>
                                • Turn on notifications to never miss events you care about
                            </Text>
                        </Section>
                    </Section>

                    <Hr style={divider} />

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            <strong>Need help getting started?</strong>
                        </Text>

                        <Text style={footerText}>
                            Visit your <Link href={`${baseUrl}/my-events`} style={link}>My Events</Link> page to manage your RSVPs and created events.
                        </Text>

                        <Text style={footerText}>
                            Have questions? Contact us at <Link href={`mailto:${EMAIL_ADDRESSES.SUPPORT}`} style={link}>{EMAIL_ADDRESSES.SUPPORT}</Link>
                        </Text>

                        <Hr style={divider} />

                        <Text style={footerSmall}>
                            This email was sent by LocalLoop. You&apos;re receiving this because you created an account.
                            <br />
                            <Link href={`${baseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}`} style={unsubscribeLink}>
                                Unsubscribe from promotional emails
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
    backgroundColor: '#6366f1',
    borderRadius: '12px 12px 0 0',
};

const logo = {
    margin: '0 auto',
    borderRadius: '8px',
};

const h1 = {
    color: '#ffffff',
    fontSize: '32px',
    fontWeight: '700',
    margin: '16px 0 0',
    padding: '0',
    lineHeight: '1.3',
};

const h2 = {
    color: '#1f2937',
    fontSize: '20px',
    fontWeight: '600',
    margin: '24px 0 16px',
    padding: '0',
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
    margin: '0 0 16px',
};

const featureSection = {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '24px',
    margin: '32px 0',
};

const featureItem = {
    color: '#374151',
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '0 0 12px',
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
    minWidth: '200px',
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
    minWidth: '200px',
};

const tipSection = {
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    borderRadius: '8px',
    padding: '24px',
    margin: '32px 0',
};

const tipItem = {
    color: '#065f46',
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0 0 8px',
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

export default WelcomeEmail; 