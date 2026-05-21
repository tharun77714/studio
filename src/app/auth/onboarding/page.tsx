"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Phone, MapPin, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import dynamic from 'next/dynamic';

const DynamicAddressAutocompleteInput = dynamic(() =>
  import('@/components/common/address-autocomplete-input').then((mod) => mod.AddressAutocompleteInput),
  { ssr: false }
);

const onboardingSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().min(10, "Phone number must be at least 10 digits.").regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format."),
  defaultShippingAddressText: z.string().optional(),
  defaultShippingAddressLat: z.number().optional(),
  defaultShippingAddressLng: z.number().optional(),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const { profile, session, isLoading: authLoading, refreshProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      defaultShippingAddressText: "",
    },
  });

  // Pre-fill form when profile data loads
  useEffect(() => {
    if (profile) {
      if (profile.profile_completed) {
        // If they somehow got here but profile is already complete, redirect to dashboard
        router.push('/dashboard');
      }

      form.reset({
        fullName: profile.full_name?.startsWith('Phone Member') ? '' : profile.full_name || '',
        email: profile.email?.includes('@sparklestudio.co.in') ? '' : profile.email || '',
        phone: profile.individual_phone_number || '',
        defaultShippingAddressText: profile.default_shipping_address_text || '',
        defaultShippingAddressLat: profile.default_shipping_address_lat || undefined,
        defaultShippingAddressLng: profile.default_shipping_address_lng || undefined,
      });
    }
  }, [profile, form, router]);

  const handlePlaceSelected = (placeDetails: { address: string; latitude: number; longitude: number } | null) => {
    if (placeDetails) {
      form.setValue('defaultShippingAddressText', placeDetails.address, { shouldValidate: true });
      form.setValue('defaultShippingAddressLat', placeDetails.latitude, { shouldValidate: true });
      form.setValue('defaultShippingAddressLng', placeDetails.longitude, { shouldValidate: true });
    }
  };

  async function onSubmit(data: OnboardingFormValues) {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile.');
      }

      toast({
        title: "Profile Completed!",
        description: "Welcome to Sparkle Studio.",
      });
      
      await refreshProfile(); // Refresh session/profile context before redirect
      router.push('/dashboard');
      
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Just a few more details to help us personalize your Sparkle Studio experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><User className="mr-2 h-4 w-4" />Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Alex Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4" />Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Phone className="mr-2 h-4 w-4" />Phone Number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="+1234567890 (with country code)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4" />Address (Optional)</FormLabel>
                <DynamicAddressAutocompleteInput
                  onPlaceSelectedAction={handlePlaceSelected}
                  initialValue={form.getValues().defaultShippingAddressText}
                  placeholder="Search your shipping address"
                />
                <FormField control={form.control} name="defaultShippingAddressText" render={({ field }) => <Input type="hidden" {...field} />} />
                <FormMessage>{form.formState.errors.defaultShippingAddressText?.message}</FormMessage>
              </FormItem>

              <Button type="submit" className="w-full btn-accent-sparkle text-lg py-3 mt-6" disabled={isSubmitting} style={{ '--accent-foreground': 'hsl(var(--accent-foreground))', backgroundColor: 'hsl(var(--accent))' } as React.CSSProperties}>
                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ArrowRight className="mr-2 h-5 w-5" />}
                Continue to Dashboard
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
