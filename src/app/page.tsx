import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, MessageSquare, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600" />
            <span className="text-xl font-bold">dwella</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center gap-8 py-20 md:py-32">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Dwell Better,{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Pay Smarter
            </span>
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Find verified roommates and affordable housing in Nigeria. 
            Compatibility-first matching with built-in safety and trust.
          </p>
          <div className="flex gap-4 mt-4">
            <Link href="/signup?role=seeker">
              <Button size="lg">Find a Room</Button>
            </Link>
            <Link href="/signup?role=host">
              <Button size="lg" variant="outline">List Your Room</Button>
            </Link>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-8 mt-12 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span>Verified Identities</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span>Secure Payments</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span>Safety First</span>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t bg-muted/50">
        <div className="container py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">How Dwella Works</h2>
            <p className="text-muted-foreground mt-2">Simple, safe, and smart</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>1. Get Verified</CardTitle>
                <CardDescription>
                  Upload your ID and complete our quick verification process. 
                  Only verified users can connect.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 mb-4">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>2. Find Your Match</CardTitle>
                <CardDescription>
                  Our compatibility algorithm matches you with roommates who share 
                  your lifestyle, habits, and preferences.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <MessageSquare className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>3. Connect Safely</CardTitle>
                <CardDescription>
                  Chat in-app first, then unlock contact details securely 
                  when you're ready to meet.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Why Choose Dwella</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Verified Identities</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Every user completes ID verification before they can unlock contacts.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Compatibility Matching</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Find roommates who match your lifestyle, schedule, and habits.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Secure Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Contact details protected by verified payment system.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Safety Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                In-app chat, reporting, blocking, and moderation to keep you safe.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <div className="container py-20 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Your Perfect Roommate?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of Nigerians finding safe, compatible housing matches.
          </p>
          <Link href="/signup">
            <Button size="lg">Get Started Free</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600" />
              <span className="text-lg font-bold">dwella</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Dwell Better, Pay Smarter
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/how-it-works">How It Works</Link></li>
              <li><Link href="/safety">Safety</Link></li>
              <li><Link href="/pricing">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/blog">Blog</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/terms">Terms of Service</Link></li>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/safety-guidelines">Safety Guidelines</Link></li>
            </ul>
          </div>
        </div>

        <div className="container border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Dwella. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
