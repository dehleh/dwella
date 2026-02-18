"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Home, User } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"role" | "details">("role");
  const [role, setRole] = useState<"host" | "seeker" | null>(
    searchParams.get("role") as "host" | "seeker" | null
  );

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const displayName = formData.get("displayName") as string;

    try {
      const supabase = createClient();

      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            role,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create user record in database via API
        const response = await fetch("/api/auth/complete-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: authData.user.id,
            email,
            displayName,
            role,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to complete signup");
        }

        toast.success("Account created! Please check your email to verify.");
        router.push("/onboarding/verify");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  if (step === "role" && !role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600" />
              <span className="text-2xl font-bold">dwella</span>
            </Link>
            <h1 className="text-3xl font-bold mt-4">Get Started</h1>
            <p className="text-muted-foreground mt-2">
              Are you looking for a room or do you have one to share?
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card 
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => {
                setRole("seeker");
                setStep("details");
              }}
            >
              <CardHeader>
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle>I'm Looking for a Room</CardTitle>
                <CardDescription>
                  Find verified roommates and affordable housing that matches your lifestyle.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Continue as Seeker</Button>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => {
                setRole("host");
                setStep("details");
              }}
            >
              <CardHeader>
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 mb-4">
                  <Home className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle>I Have a Room to Share</CardTitle>
                <CardDescription>
                  Find verified, compatible roommates for your spare room.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">Continue as Host</Button>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600" />
            <span className="text-xl font-bold">dwella</span>
          </Link>
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>
            {role === "seeker" 
              ? "Find your perfect roommate match" 
              : "List your room and find great roommates"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Full Name</Label>
              <Input
                id="displayName"
                name="displayName"
                placeholder="John Doe"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john@example.com"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={8}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters
              </p>
            </div>

            <div className="flex items-start space-x-2 text-sm">
              <input type="checkbox" required className="mt-1" />
              <p className="text-muted-foreground">
                I agree to the{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setStep("role")}
              disabled={loading}
            >
              Back
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
