"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Briefcase, Mail, Lock, LogIn, Loader2, Phone, ShieldCheck, MessageSquare, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneInput } from '@/components/common/phone-input';
import { isValidPhoneNumber } from 'react-phone-number-input';

// Zod schemas
const emailSignInSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(1, "Password is required."),
});

const phoneSendSchema = z.object({
  phone: z.string().refine((val) => isValidPhoneNumber(val), {
    message: "Invalid phone number.",
  }),
});

const phoneVerifySchema = z.object({
  code: z.string().length(6, "Verification code must be exactly 6 digits.").regex(/^\d+$/, "Code must contain digits only."),
});

type EmailSignInFormValues = z.infer<typeof emailSignInSchema>;
type PhoneSendFormValues = z.infer<typeof phoneSendSchema>;
type PhoneVerifyFormValues = z.infer<typeof phoneVerifySchema>;

// Inner sign-in UI component that safe-uses search parameters
function SignInPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { refreshProfile } = useAuth();
  
  // Tab state: 'email' | 'phone'
  const [activeTab, setActiveTab] = useState<'email' | 'phone'>('email');
  
  // Universal loading
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Phone flow state
  const [phoneState, setPhoneState] = useState<'idle' | 'code_sent'>('idle');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpTimer, setOtpTimer] = useState(300); // 5 minutes in seconds

  // Read URL query errors (e.g. from Google callback failures)
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      toast({
        title: "Authentication Alert",
        description: errorParam,
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  // Handle countdown timer for SMS OTP
  useEffect(() => {
    if (phoneState === 'code_sent' && otpTimer > 0) {
      const interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (otpTimer === 0) {
      setPhoneState('idle');
      toast({
        title: "Verification Expired",
        description: "Your 6-digit OTP code has expired. Please request a new code.",
        variant: "destructive",
      });
    }
  }, [phoneState, otpTimer, toast]);

  // Email Sign In form
  const emailForm = useForm<EmailSignInFormValues>({
    resolver: zodResolver(emailSignInSchema),
    defaultValues: { email: "", password: "" },
  });

  // Phone Send Form
  const phoneSendForm = useForm<PhoneSendFormValues>({
    resolver: zodResolver(phoneSendSchema),
    defaultValues: { phone: "" },
  });

  // Phone Verify Form
  const phoneVerifyForm = useForm<PhoneVerifyFormValues>({
    resolver: zodResolver(phoneVerifySchema),
    defaultValues: { code: "" },
  });

  // 1. Submit Email Sign In (Local MongoDB Auth)
  async function onEmailSubmit(data: EmailSignInFormValues) {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, expectedRole: 'business' }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Invalid credentials.');
      }
      await refreshProfile(result);
      toast({
        title: "Sign In Successful!",
        description: "Welcome back to your Business Dashboard.",
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: "Sign In Failed",
        description: error.message || "Invalid credentials or unexpected error.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // 2. Send OTP via our own API (Fast2SMS)
  async function onPhoneSendSubmit(data: PhoneSendFormValues) {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/phone/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: data.phone }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Could not send OTP.');
      }

      setPhoneNumber(data.phone);
      setPhoneState('code_sent');
      setOtpTimer(300);

      toast({
        title: "OTP Sent!",
        description: `Verification code sent to ${data.phone}.`,
      });
    } catch (error: any) {
      toast({
        title: "SMS Request Failed",
        description: error.message || "Could not send verification SMS.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // 3. Verify OTP via our own API
  async function onPhoneVerifySubmit(data: PhoneVerifyFormValues) {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/phone/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, code: data.code, expectedRole: 'business' }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'OTP verification failed.');
      }

      await refreshProfile(result);

      toast({
        title: "Sign In Successful!",
        description: "Phone verified. Accessing your business dashboard...",
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // 4. Handle Google Sign-In — direct Google OAuth
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) throw new Error('Google Client ID is not configured.');

      const redirectUri = `${window.location.origin}/api/auth/callback/google`;

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'select_account',
        state: 'business', // Pass the business state to Google callback
      });

      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    } catch (error: any) {
      toast({
        title: 'Google Sign In Failed',
        description: error.message || 'Failed to initiate Google sign in.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  // Convert timer seconds to readable format
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <Card className="border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl relative overflow-hidden rounded-2xl">
      {/* Editorial Luxury Top Rim Accent */}
      <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" style={{ backgroundImage: 'linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)' }} />
      
      <CardHeader className="text-center pt-8 pb-4">
        <Briefcase className="mx-auto h-12 w-12 text-primary mb-2 filter drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]" style={{ color: 'hsl(var(--primary))' }} />
        <CardTitle className="font-headline text-3xl tracking-wide bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-transparent">Business Sign In</CardTitle>
        <CardDescription className="text-neutral-400 font-sans mt-1">Access your Sparkle Studio business dashboard</CardDescription>
      </CardHeader>
      
      <CardContent className="px-6 pb-8 space-y-6">
        
        {/* Luxury Slider Tabs */}
        <div className="grid grid-cols-2 p-1 bg-neutral-900/60 rounded-lg border border-white/5 relative">
          <button
            onClick={() => { setActiveTab('email'); }}
            className={`py-2 text-sm font-sans rounded-md transition-all duration-300 z-10 flex items-center justify-center gap-2 ${
              activeTab === 'email' ? 'text-black font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Mail className="h-4 w-4" />
            Email Login
          </button>
          
          <button
            onClick={() => { setActiveTab('phone'); }}
            className={`py-2 text-sm font-sans rounded-md transition-all duration-300 z-10 flex items-center justify-center gap-2 ${
              activeTab === 'phone' ? 'text-black font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Phone className="h-4 w-4" />
            Phone SMS OTP
          </button>

          {/* Animated backdrop */}
          <motion.div
            layoutId="activeBusinessTabIndicator"
            className="absolute top-1 bottom-1 rounded-md bg-primary"
            style={{ 
              width: 'calc(50% - 4px)', 
              left: activeTab === 'email' ? '4px' : '50%',
              backgroundColor: 'hsl(var(--primary))'
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>

        {/* Tab contents */}
        <AnimatePresence mode="wait">
          {activeTab === 'email' ? (
            <motion.div
              key="email-tab"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center text-neutral-300 text-sm font-sans">
                          <Mail className="mr-2 h-4 w-4 text-primary/80" style={{ color: 'hsl(var(--primary))' }} />
                          Business Email
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="contact@yourcompany.com" 
                            className="bg-neutral-900/40 border-white/10 text-white placeholder-neutral-600 focus-visible:ring-primary" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={emailForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center text-neutral-300 text-sm font-sans">
                          <Lock className="mr-2 h-4 w-4 text-primary/80" style={{ color: 'hsl(var(--primary))' }} />
                          Password
                        </FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="••••••••" 
                              className="bg-neutral-900/40 border-white/10 text-white placeholder-neutral-600 pr-10 focus-visible:ring-primary" 
                              {...field} 
                            />
                          </FormControl>
                          <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 px-3 flex items-center text-neutral-400 hover:text-white"
                          >
                            {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full btn-primary-sparkle text-md py-5 font-headline bg-primary text-primary-foreground hover:opacity-90 font-medium"
                    disabled={isLoading}
                    style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                  >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                    Sign In with Password
                  </Button>
                </form>
              </Form>
            </motion.div>
          ) : (
            <motion.div
              key="phone-tab"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {phoneState === 'idle' ? (
                /* Step A: Request Code */
                <Form {...phoneSendForm}>
                  <form onSubmit={phoneSendForm.handleSubmit(onPhoneSendSubmit)} className="space-y-4">
                    <FormField
                      control={phoneSendForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center text-neutral-300 text-sm font-sans">
                            <Phone className="mr-2 h-4 w-4 text-primary/80" style={{ color: 'hsl(var(--primary))' }} />
                            Mobile Number
                          </FormLabel>
                          <FormControl>
                            <PhoneInput 
                              placeholder="Enter phone number" 
                              className="bg-neutral-900/40 border-white/10 text-white placeholder-neutral-600 focus-visible:ring-primary" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full btn-primary-sparkle text-md py-5 font-headline bg-primary text-primary-foreground font-medium"
                      disabled={isLoading}
                      style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                    >
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                      Send Verification Code
                    </Button>
                  </form>
                </Form>
              ) : (
                /* Step B: Enter verification code */
                <Form {...phoneVerifyForm}>
                  <form onSubmit={phoneVerifyForm.handleSubmit(onPhoneVerifySubmit)} className="space-y-4">
                    <div className="text-center bg-white/5 border border-white/5 rounded-lg py-2.5 px-3">
                      <span className="text-neutral-400 text-xs block mb-1">Code dispatched to phone number:</span>
                      <strong className="text-white text-sm font-sans">{phoneNumber}</strong>
                    </div>

                    <FormField
                      control={phoneVerifyForm.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between text-neutral-300 text-sm font-sans">
                            <span className="flex items-center">
                              <ShieldCheck className="mr-2 h-4 w-4 text-primary/80" style={{ color: 'hsl(var(--primary))' }} />
                              Enter 6-Digit OTP
                            </span>
                            <span className="text-xs text-primary font-sans" style={{ color: 'hsl(var(--primary))' }}>
                              Expires in {formatTime(otpTimer)}
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="text" 
                              maxLength={6}
                              placeholder="123456" 
                              className="bg-neutral-900/40 border-white/10 text-white placeholder-neutral-600 text-center text-xl tracking-[0.6em] font-headline focus-visible:ring-primary" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full btn-primary-sparkle text-md py-5 font-headline bg-primary text-primary-foreground font-medium"
                      disabled={isLoading}
                      style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                    >
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                      Verify & Sign In
                    </Button>

                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => { setPhoneState('idle'); }}
                        className="text-xs text-neutral-400 hover:text-primary font-sans transition-colors underline"
                      >
                        Change phone number or request new code
                      </button>
                    </div>
                  </form>
                </Form>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Or Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="absolute inset-x-0 h-[1px] bg-white/10" />
          <span className="bg-neutral-950 px-4 text-neutral-500 text-xs font-sans relative z-10 tracking-widest uppercase">Or connect via</span>
        </div>

        {/* High-End Gold-Bordered Google Sign-In Button */}
        <motion.button
          type="button"
          onClick={handleGoogleSignIn}
          whileHover={{ scale: 1.015, boxShadow: "0 0 15px rgba(212,175,55,0.2)" }}
          whileTap={{ scale: 0.99 }}
          className="w-full py-3.5 px-4 rounded-xl border border-white/15 bg-neutral-950/40 text-white hover:text-primary hover:border-primary/40 font-sans font-medium flex items-center justify-center gap-3 transition-all duration-300 relative group overflow-hidden"
        >
          {/* Shine Sweep Animation on hover */}
          <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 -translate-x-full group-hover:animate-[shinesweep_1.5s_infinite]" style={{ transform: 'skewX(-20deg) translateX(-100%)' }} />
          
          {/* Custom vector G-Logo to load perfectly offline/online */}
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" width="24" height="24">
            <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.355 0 3.39 2.673 1.473 6.564l3.793 3.201z"/>
            <path fill="#34A853" d="M16.04 15.345c-1.077.732-2.436 1.173-4.04 1.173-2.927 0-5.41-1.982-6.29-4.654L1.908 15.05C3.89 19.064 8.01 21.818 12 21.818c3.218 0 6.073-1.055 8.1-2.873l-4.06-3.6z"/>
            <path fill="#4285F4" d="M23.49 12.273c0-.8-.073-1.573-.209-2.318H12v4.545h6.455a5.527 5.527 0 0 1-2.4 3.636l4.06 3.6c2.373-2.182 3.764-5.4 3.764-9.463z"/>
            <path fill="#FBBC05" d="M5.71 11.864c-.236-.727-.373-1.509-.373-2.318s.137-1.59.373-2.318L1.917 4.027A11.956 11.956 0 0 0 0 9.545c0 2.01.5 3.91 1.382 5.609l4.327-3.29z"/>
          </svg>
          
          <span className="tracking-wide">Continue with Google Workspace</span>
        </motion.button>

        {/* Footer links */}
        <p className="text-center text-sm text-neutral-400 font-sans pt-2">
          Don't have a business account?{' '}
          <Button variant="link" asChild className="p-0 text-primary font-semibold hover:opacity-80" style={{ color: 'hsl(var(--primary))' }}>
            <Link href="/auth/business/signup">Sign Up Here</Link>
          </Button>
        </p>
        <p className="text-center text-xs">
          <Button variant="link" asChild className="p-0 text-neutral-500 hover:text-neutral-300">
            <Link href="/auth/forgot-password">Forgot Password?</Link>
          </Button>
        </p>
      </CardContent>
    </Card>
  );
}

// Top-level exported Page wrapped in Suspense to resolve searchParams hook requirements in Next.js
export default function BusinessSignInPage() {
  return (
    <Suspense fallback={
      <Card className="border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl p-8 flex items-center justify-center min-h-[400px] rounded-2xl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" style={{ color: 'hsl(var(--primary))' }} />
      </Card>
    }>
      <SignInPageContent />
    </Suspense>
  );
}
