import { Footer } from '@/components/ui/Footer';
import { Mail, Phone, MessageCircle } from 'lucide-react';
import { EMAIL_ADDRESSES } from '@/lib/config/email-addresses';

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-foreground mb-4">Contact Us</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Have questions about LocalLoop? We&apos;d love to hear from you.
                        Send us a message and we&apos;ll respond as soon as possible.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Contact Information */}
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground mb-6">Get in Touch</h2>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Mail className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground">Email</h3>
                                        <a 
                                            href={`mailto:${EMAIL_ADDRESSES.CONTACT}`}
                                            className="text-muted-foreground hover:text-blue-600 transition-colors"
                                        >
                                            {EMAIL_ADDRESSES.CONTACT}
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                        <MessageCircle className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground">Coming Soon</h3>
                                        <p className="text-muted-foreground">Live chat support will be available soon</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <Phone className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground">Phone</h3>
                                        <a 
                                            href="tel:+15551234567"
                                            className="text-muted-foreground hover:text-purple-600 transition-colors"
                                        >
                                            +1 (555) 123-4567
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-card rounded-lg shadow-sm border p-8">
                        <h2 className="text-2xl font-bold text-foreground mb-6">Send us a message</h2>
                        <form className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="contact-firstName" className="block text-sm font-medium text-foreground mb-2">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        id="contact-firstName"
                                        name="firstName"
                                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background text-foreground"
                                        placeholder="John"
                                        autoComplete="given-name"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="contact-lastName" className="block text-sm font-medium text-foreground mb-2">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        id="contact-lastName"
                                        name="lastName"
                                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background text-foreground"
                                        placeholder="Doe"
                                        autoComplete="family-name"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="contact-email" className="block text-sm font-medium text-foreground mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    id="contact-email"
                                    name="email"
                                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background text-foreground"
                                    placeholder="john@example.com"
                                    autoComplete="email"
                                />
                            </div>
                            <div>
                                <label htmlFor="contact-subject" className="block text-sm font-medium text-foreground mb-2">
                                    Subject
                                </label>
                                <input
                                    type="text"
                                    id="contact-subject"
                                    name="subject"
                                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background text-foreground"
                                    placeholder="How can we help?"
                                />
                            </div>
                            <div>
                                <label htmlFor="contact-message" className="block text-sm font-medium text-foreground mb-2">
                                    Message
                                </label>
                                <textarea
                                    id="contact-message"
                                    name="message"
                                    rows={6}
                                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background text-foreground"
                                    placeholder="Tell us how we can help you..."
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                Send Message
                            </button>
                        </form>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
} 