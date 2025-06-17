import { Footer } from '@/components/ui/Footer';
import Link from 'next/link';
import { Shield, Eye, Lock, UserCheck, FileText, Mail } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h1 className="text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Your privacy is important to us. This policy explains how we collect, use, and protect your information.
                    </p>
                </div>

                <div className="space-y-8">
                    <section className="bg-card rounded-lg shadow-sm border p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            <h2 className="text-2xl font-semibold text-foreground">Information We Collect</h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-foreground mb-2">Account Information</h3>
                                <p className="text-muted-foreground text-sm">
                                    When you create an account, we collect your name, email address, and any profile information you choose to provide.
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground mb-2">Event Data</h3>
                                <p className="text-muted-foreground text-sm">
                                    Information about events you create, attend, or show interest in, including RSVPs and ticket purchases.
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground mb-2">Usage Information</h3>
                                <p className="text-muted-foreground text-sm">
                                    How you interact with our platform, including pages visited, features used, and time spent on the site.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="bg-card rounded-lg shadow-sm border p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <UserCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            <h2 className="text-2xl font-semibold text-foreground">How We Use Your Information</h2>
                        </div>
                        <ul className="space-y-3 text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                                <span>To provide and improve our event discovery and management services</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                                <span>To send you relevant event recommendations and updates</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                                <span>To facilitate communication between event organizers and attendees</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                                <span>To ensure platform security and prevent fraud</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                                <span>To comply with legal obligations and protect our rights</span>
                            </li>
                        </ul>
                    </section>

                    <section className="bg-card rounded-lg shadow-sm border p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            <h2 className="text-2xl font-semibold text-foreground">Data Protection</h2>
                        </div>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            We implement industry-standard security measures to protect your personal information:
                        </p>
                        <ul className="space-y-2 text-muted-foreground">
                            <li>• Encryption of data in transit and at rest</li>
                            <li>• Regular security audits and updates</li>
                            <li>• Limited access to personal data on a need-to-know basis</li>
                            <li>• Secure payment processing through trusted providers</li>
                        </ul>
                    </section>

                    <section className="bg-card rounded-lg shadow-sm border p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            <h2 className="text-2xl font-semibold text-foreground">Your Rights</h2>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            You have the right to access, update, or delete your personal information at any time.
                            You can also opt out of marketing communications and request a copy of your data.
                            Contact us if you have any questions about exercising these rights.
                        </p>
                    </section>

                    <section className="bg-card rounded-lg shadow-sm border p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            <h2 className="text-2xl font-semibold text-foreground">Updates to This Policy</h2>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            We may update this privacy policy from time to time. We&apos;ll notify you of any significant changes
                            via email or through our platform. Your continued use of LocalLoop after such changes constitutes
                            acceptance of the updated policy.
                        </p>
                    </section>
                </div>

                <div className="text-center mt-12 bg-card rounded-lg shadow-sm border p-8">
                    <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">Questions?</h3>
                    <p className="text-muted-foreground mb-4">
                        If you have any questions about this privacy policy, please don&apos;t hesitate to contact us.
                    </p>
                    <Link
                        href="/contact"
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        Contact Us
                    </Link>
                </div>
            </main>
            <Footer />
        </div>
    );
} 