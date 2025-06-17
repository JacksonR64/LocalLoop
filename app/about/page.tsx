import Link from 'next/link';
import { Heart, Users, MapPin } from 'lucide-react';
import { Footer } from '@/components/ui/Footer';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Centered Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-foreground mb-4">About LocalLoop</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Connecting communities through meaningful local events and experiences.
                    </p>
                </div>

                <div className="space-y-12">
                    {/* Mission */}
                    <section className="bg-card rounded-lg shadow-sm border p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Heart className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-card-foreground">Our Mission</h2>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            LocalLoop exists to strengthen communities by making it easier for people to discover,
                            attend, and organize local events. We believe that meaningful connections happen when
                            neighbors come together, and we&apos;re here to facilitate those moments.
                        </p>
                    </section>

                    {/* Features */}
                    <section className="bg-card rounded-lg shadow-sm border p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-card-foreground">What We Offer</h2>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-semibold text-card-foreground mb-2">For Event Organizers</h3>
                                <ul className="text-muted-foreground space-y-1">
                                    <li>• Easy event creation and management</li>
                                    <li>• Integrated ticketing and RSVP system</li>
                                    <li>• Real-time analytics and insights</li>
                                    <li>• Seamless payment processing</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-card-foreground mb-2">For Attendees</h3>
                                <ul className="text-muted-foreground space-y-1">
                                    <li>• Discover events in your area</li>
                                    <li>• Easy registration and ticketing</li>
                                    <li>• Calendar integration</li>
                                    <li>• Community connections</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Values */}
                    <section className="bg-card rounded-lg shadow-sm border p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                                <MapPin className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-card-foreground">Our Values</h2>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-card-foreground mb-2">Community First</h3>
                                <p className="text-muted-foreground text-sm">
                                    Every feature we build is designed to strengthen local communities and foster genuine connections.
                                </p>
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-card-foreground mb-2">Simplicity</h3>
                                <p className="text-muted-foreground text-sm">
                                    We believe great tools should be intuitive and accessible to everyone, regardless of technical expertise.
                                </p>
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-card-foreground mb-2">Reliability</h3>
                                <p className="text-muted-foreground text-sm">
                                    When your event matters, our platform delivers. We&apos;re committed to providing dependable service.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Call to Action */}
                    <section className="text-center py-8">
                        <h2 className="text-2xl font-bold text-foreground mb-4">Ready to Get Started?</h2>
                        <p className="text-muted-foreground mb-6">
                            Join thousands of community organizers who trust LocalLoop for their events.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/staff"
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Create Your First Event
                            </Link>
                            <Link
                                href="/"
                                className="border border-border text-foreground px-6 py-3 rounded-lg hover:bg-muted transition-colors"
                            >
                                Browse Events
                            </Link>
                        </div>
                    </section>
                </div>
            </div>

            <Footer />
        </div>
    );
} 