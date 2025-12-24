import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Paintbrush, CheckCircle2, TrendingUp, Users, Shield, ArrowRight, Star } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-1.5 rounded-lg">
                            <Paintbrush className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-slate-900">PaintPro</span>
                    </div>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                        <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
                        <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
                        <a href="#testimonials" className="hover:text-blue-600 transition-colors">Stories</a>
                    </nav>

                    <div className="flex items-center gap-4">
                        <Link href="/login">
                            <Button variant="ghost" className="hidden sm:inline-flex">Log in</Button>
                        </Link>
                        <Link href="/register">
                            <Button className="bg-blue-600 hover:bg-blue-700">Start Free Trial</Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-20 pb-32 overflow-hidden">
                <div className="container mx-auto px-4 text-center relative z-10">
                    <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 mb-6 border border-blue-100">
                        <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2 animate-pulse"></span>
                        New: AI Estimation Assistant
                    </div>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6 max-w-4xl mx-auto line-clamp-3">
                        The All-in-One OS for <br />
                        <span className="text-blue-600">Professional Painting</span> Businesses
                    </h1>
                    <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto">
                        Streamline estimates, manage crews, and scale your painting business with the platform built by painters, for painters.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link href="/register">
                            <Button size="lg" className="h-14 px-8 text-lg bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200">
                                Get Started for Free
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Link href="#demo">
                            <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-2">
                                View Live Demo
                            </Button>
                        </Link>
                    </div>
                    <div className="mt-8 flex items-center justify-center gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span>No credit card required</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span>14-day free trial</span>
                        </div>
                    </div>
                </div>

                {/* Background Gradients */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-200/20 blur-[100px] rounded-full -z-10" />
            </section>

            {/* Stats / Social Proof */}
            <section className="py-10 bg-white border-y border-slate-100">
                <div className="container mx-auto px-4">
                    <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-70">
                        {['Sherwin-Williams', 'Benjamin Moore', 'Behr', 'PPG', 'Graco'].map((brand) => (
                            <span key={brand} className="text-xl font-bold text-slate-400">{brand}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 bg-slate-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need to scale</h2>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                            Stop using spreadsheets and paper. Run your entire painting business from one professional dashboard.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: TrendingUp,
                                title: "Smart Estimation",
                                desc: "Create professional estimates in minutes. Calculate labor, materials, and profit margins automatically."
                            },
                            {
                                icon: Users,
                                title: "Crew Management",
                                desc: "Schedule jobs, assign crews, and track progress. Keep everyone in sync with real-time updates."
                            },
                            {
                                icon: Shield,
                                title: "Client Portal",
                                desc: "Impress clients with a branded portal. Send quotes, collect signatures, and get paid faster."
                            }
                        ].map((feature, i) => (
                            <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                                    <feature.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Simple, transparent pricing</h2>
                        <p className="text-lg text-slate-500">Choose the plan that fits your business stage.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {/* Starter */}
                        <div className="p-8 rounded-2xl border border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-900">Starter</h3>
                            <div className="mt-4 mb-6">
                                <span className="text-4xl font-bold text-slate-900">$0</span>
                                <span className="text-slate-500">/mo</span>
                            </div>
                            <p className="text-slate-500 mb-6 text-sm">Perfect for solo painters just getting started.</p>
                            <Button className="w-full mb-8" variant="outline">Start Free</Button>
                            <ul className="space-y-3 text-sm text-slate-600">
                                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Up to 3 Active Jobs</li>
                                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Basic Estimating</li>
                                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /> CRM (Leads)</li>
                            </ul>
                        </div>

                        {/* Pro - Highlighted */}
                        <div className="p-8 rounded-2xl border-2 border-blue-600 bg-blue-50/50 relative">
                            <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-lg">
                                POPULAR
                            </div>
                            <h3 className="text-lg font-semibold text-blue-900">Professional</h3>
                            <div className="mt-4 mb-6">
                                <span className="text-4xl font-bold text-slate-900">$49</span>
                                <span className="text-slate-500">/mo</span>
                            </div>
                            <p className="text-blue-700/80 mb-6 text-sm">For growing businesses managing multiple crews.</p>
                            <Button className="w-full mb-8 bg-blue-600 hover:bg-blue-700">Get Started</Button>
                            <ul className="space-y-3 text-sm text-slate-700">
                                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Unlimited Jobs</li>
                                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Advanced Scheduling</li>
                                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Profit Analysis</li>
                                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /> QuickBooks Sync</li>
                            </ul>
                        </div>

                        {/* Business */}
                        <div className="p-8 rounded-2xl border border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-900">Business</h3>
                            <div className="mt-4 mb-6">
                                <span className="text-4xl font-bold text-slate-900">$99</span>
                                <span className="text-slate-500">/mo</span>
                            </div>
                            <p className="text-slate-500 mb-6 text-sm">For established companies scaling operations.</p>
                            <Button className="w-full mb-8" variant="outline">Contact Sales</Button>
                            <ul className="space-y-3 text-sm text-slate-600">
                                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Multi-Org Support</li>
                                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /> API Access</li>
                                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Dedicated Manager</li>
                                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /> White Labeling</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-slate-900 text-white">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to professionalize your business?</h2>
                    <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
                        Join thousands of painting contractors who use PaintPro to win more jobs and manage their crews.
                    </p>
                    <Link href="/register">
                        <Button size="lg" className="h-14 px-8 text-lg bg-blue-600 hover:bg-blue-500 border-none font-bold">
                            Start Your Free Trial Now
                        </Button>
                    </Link>
                    <p className="mt-6 text-sm text-slate-500">No credit card required. Cancel anytime.</p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-50 py-12 border-t border-slate-200">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-600 p-1 rounded-md">
                                <Paintbrush className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-lg font-bold text-slate-900">PaintPro</span>
                        </div>
                        <p className="text-slate-500 text-sm">
                            &copy; {new Date().getFullYear()} PaintPro SaaS. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
