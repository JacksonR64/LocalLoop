import { Footer } from '@/components/ui/Footer';
import Link from 'next/link';
import { FileText } from 'lucide-react';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h1 className="text-4xl font-bold text-foreground mb-4">Terms of Service</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Please read these terms carefully before using LocalLoop.
                    </p>
                </div>

                <div className="space-y-8">
                    <section className="bg-card rounded-lg shadow-sm border p-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-4">Acceptance of Terms</h2>
                        <p className="text-muted-foreground">
                            By accessing and using LocalLoop, you accept and agree to be bound by these Terms of Service.
                            If you do not agree to these terms, please do not use our platform.
                        </p>
                    </section>

                    <section className="bg-card rounded-lg shadow-sm border p-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-4">Use of Service</h2>
                        <div className="space-y-4 text-muted-foreground">
                            <div>
                                <h3 className="font-semibold text-foreground mb-2">Permitted Use</h3>
                                <p>LocalLoop is designed for discovering, creating, and managing local community events. You may use our service for lawful purposes only.</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground mb-2">Prohibited Activities</h3>
                                <ul className="space-y-1 pl-4">
                                    <li>• Creating fake or misleading events</li>
                                    <li>• Harassing or threatening other users</li>
                                    <li>• Sharing inappropriate or offensive content</li>
                                    <li>• Attempting to damage or disrupt the service</li>
                                    <li>• Using the platform for commercial spam</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section className="bg-card rounded-lg shadow-sm border p-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-4">User Accounts</h2>
                        <div className="space-y-4 text-muted-foreground">
                            <p>To access certain features, you must create an account. You are responsible for:</p>
                            <ul className="space-y-2 pl-4">
                                <li>• Providing accurate and current information</li>
                                <li>• Maintaining the security of your account credentials</li>
                                <li>• All activities that occur under your account</li>
                                <li>• Notifying us of any unauthorized use</li>
                            </ul>
                        </div>
                    </section>

                    <section className="bg-card rounded-lg shadow-sm border p-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-4">Event Creation and Management</h2>
                        <div className="space-y-4 text-muted-foreground">
                            <div>
                                <h3 className="font-semibold text-foreground mb-2">Event Organizer Responsibilities</h3>
                                <p>As an event organizer, you agree to:</p>
                                <ul className="space-y-1 pl-4 mt-2">
                                    <li>• Provide accurate event information</li>
                                    <li>• Honor RSVPs and ticket sales</li>
                                    <li>• Comply with local laws and regulations</li>
                                    <li>• Handle participant data responsibly</li>
                                    <li>• Communicate changes or cancellations promptly</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section className="bg-card rounded-lg shadow-sm border p-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-4">Payments and Refunds</h2>
                        <div className="space-y-4 text-muted-foreground">
                            <div>
                                <h3 className="font-semibold text-foreground mb-2">Payment Processing</h3>
                                <p>Payments are processed securely through third-party providers. We do not store payment information on our servers.</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground mb-2">Refund Policy</h3>
                                <p>Refunds are subject to the event organizer&apos;s policies. We facilitate communications but are not responsible for refund decisions.</p>
                            </div>
                        </div>
                    </section>

                    <section className="bg-card rounded-lg shadow-sm border p-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-4">Content and Intellectual Property</h2>
                        <div className="space-y-4 text-muted-foreground">
                            <div>
                                <h3 className="font-semibold text-foreground mb-2">User Content</h3>
                                <p>You retain ownership of content you post, but grant us a license to use, modify, and display it on our platform.</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground mb-2">Platform Content</h3>
                                <p>LocalLoop&apos;s design, features, and original content are protected by intellectual property laws.</p>
                            </div>
                        </div>
                    </section>

                    <section className="bg-card rounded-lg shadow-sm border p-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-4">Disclaimers and Limitations</h2>
                        <div className="space-y-4 text-muted-foreground">
                            <div>
                                <h3 className="font-semibold text-foreground mb-2">Service Availability</h3>
                                <p>We strive for 99.9% uptime but cannot guarantee uninterrupted service availability.</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground mb-2">Event Responsibility</h3>
                                <p>LocalLoop is a platform that connects users. We are not responsible for the actual events, their quality, or outcomes.</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground mb-2">Limitation of Liability</h3>
                                <p>Our liability is limited to the amount you paid for the service, not exceeding $100 in any case.</p>
                            </div>
                        </div>
                    </section>

                    <section className="bg-card rounded-lg shadow-sm border p-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-4">Termination</h2>
                        <div className="space-y-4 text-muted-foreground">
                            <p>We may suspend or terminate your account if you violate these terms. You may delete your account at any time through your account settings.</p>
                        </div>
                    </section>

                    <section className="bg-card rounded-lg shadow-sm border p-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-4">Changes to Terms</h2>
                        <p className="text-muted-foreground">
                            We may update these terms from time to time. Significant changes will be communicated via email or platform notifications.
                            Continued use constitutes acceptance of revised terms.
                        </p>
                    </section>
                </div>

                <div className="text-center mt-12 bg-card rounded-lg shadow-sm border p-8">
                    <h3 className="text-xl font-semibold text-foreground mb-4">Questions About These Terms?</h3>
                    <p className="text-muted-foreground mb-6">
                        If you have questions about these terms of service, please don&apos;t hesitate to contact us.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/contact"
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            Contact Support
                        </Link>
                        <Link
                            href="/privacy"
                            className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                        >
                            View Privacy Policy
                        </Link>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
} 