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
import { User, Mail, Phone, MapPin, ArrowRight, Loader2, Building, FileText, Briefcase } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import dynamic from 'next/dynamic';
import { PhoneInput } from '@/components/common/phone-input';
import { isValidPhoneNumber } from 'react-phone-number-input';

const DynamicAddressAutocompleteInput = dynamic(() =>
  import('@/components/common/address-autocomplete-input').then((mod) => mod.AddressAutocompleteInput),
  { ssr: false }
);

const StoreLocationPicker = dynamic(
  () => import('@/components/networks/StoreLocationPicker').then((mod) => mod.StoreLocationPicker),
  { ssr: false }
);

const individualSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().refine((val) => isValidPhoneNumber(val), {
    message: "Invalid phone number.",
  }),
  defaultShippingAddressText: z.string().optional(),
  defaultShippingAddressLat: z.number().optional(),
  defaultShippingAddressLng: z.number().optional(),
  defaultShippingAddressPincode: z.string().optional(),
});

const businessSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  gstNumber: z.string().min(15, "GST number must be 15 characters.").max(15, "GST number must be 15 characters.").regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GST number format."),
  businessType: z.string().min(3, "Please select a business type."),
  businessAddressText: z.string().min(10, "Business address is required."),
  businessAddressLat: z.number().optional(),
  businessAddressLng: z.number().optional(),
  businessPincode: z.string().min(1, "Pincode is required."),
  contactPersonName: z.string().min(2, "Contact person name is required."),
  contactPhoneNumber: z.string().refine((val) => isValidPhoneNumber(val), {
    message: "Invalid phone number.",
  }),
});

const businessTypes = ["Retailer", "Wholesaler", "Artisan/Designer", "Manufacturer", "Online Store", "Other"];

function IndividualOnboardingForm({ profile, onSuccess }: { profile: any, onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof individualSchema>>({
    resolver: zodResolver(individualSchema),
    defaultValues: {
      fullName: profile?.full_name?.startsWith('Phone Member') ? '' : profile?.full_name || '',
      email: profile?.email?.includes('@sparklestudio.co.in') ? '' : profile?.email || '',
      phone: profile?.individual_phone_number || '',
      defaultShippingAddressText: profile?.default_shipping_address_text || '',
      defaultShippingAddressLat: profile?.default_shipping_address_lat || undefined,
      defaultShippingAddressLng: profile?.default_shipping_address_lng || undefined,
      defaultShippingAddressPincode: profile?.default_shipping_address_pincode || '',
    },
  });

  const handlePlaceSelected = (placeDetails: { address: string; latitude: number; longitude: number; pincode?: string } | null) => {
    if (placeDetails) {
      form.setValue('defaultShippingAddressText', placeDetails.address, { shouldValidate: true });
      form.setValue('defaultShippingAddressLat', placeDetails.latitude, { shouldValidate: true });
      form.setValue('defaultShippingAddressLng', placeDetails.longitude, { shouldValidate: true });
      if (placeDetails.pincode) {
        form.setValue('defaultShippingAddressPincode', placeDetails.pincode, { shouldValidate: true });
      }
    }
  };

  async function onSubmit(data: z.infer<typeof individualSchema>) {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/complete-profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update profile.');
      toast({ title: "Profile Completed!", description: "Welcome to Sparkle Studio." });
      onSuccess();
    } catch (error: any) {
      toast({ title: "Update Failed", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="fullName" render={({ field }) => (
          <FormItem><FormLabel className="flex items-center"><User className="mr-2 h-4 w-4" />Full Name</FormLabel>
            <FormControl><Input placeholder="e.g., Alex Smith" {...field} /></FormControl><FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem><FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4" />Email Address</FormLabel>
            <FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl><FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="phone" render={({ field }) => (
          <FormItem><FormLabel className="flex items-center"><Phone className="mr-2 h-4 w-4" />Phone Number</FormLabel>
            <FormControl><PhoneInput placeholder="Enter phone number" {...field} /></FormControl><FormMessage />
          </FormItem>
        )} />
        <FormItem>
          <FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4" />Address (Optional)</FormLabel>
          <DynamicAddressAutocompleteInput onPlaceSelectedAction={handlePlaceSelected} initialValue={form.getValues().defaultShippingAddressText} placeholder="Search your shipping address" />
          <FormField control={form.control} name="defaultShippingAddressText" render={({ field }) => <Input type="hidden" {...field} />} />
          <FormMessage>{form.formState.errors.defaultShippingAddressText?.message}</FormMessage>
        </FormItem>
        <FormField control={form.control} name="defaultShippingAddressPincode" render={({ field }) => (
          <FormItem><FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4" />Pincode (Optional)</FormLabel>
            <FormControl><Input placeholder="Enter your pincode" {...field} /></FormControl><FormMessage />
          </FormItem>
        )} />
        <Button type="submit" className="w-full btn-accent-sparkle text-lg py-3 mt-6" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ArrowRight className="mr-2 h-5 w-5" />}
          Continue to Dashboard
        </Button>
      </form>
    </Form>
  );
}

function BusinessOnboardingForm({ profile, onSuccess }: { profile: any, onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof businessSchema>>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      businessName: profile?.business_name || "",
      email: profile?.email?.includes('@sparklestudio.co.in') ? '' : profile?.email || '',
      gstNumber: profile?.gst_number || "",
      businessType: profile?.business_type || "",
      businessAddressText: profile?.business_address_text || "",
      businessPincode: profile?.business_pincode || "",
      contactPersonName: profile?.contact_person_name || "",
      contactPhoneNumber: profile?.contact_phone_number || "",
    },
  });

  const handlePlaceSelected = (placeDetails: { address: string; latitude: number; longitude: number; pincode?: string } | null) => {
    if (placeDetails) {
      form.setValue('businessAddressText', placeDetails.address, { shouldValidate: true });
      form.setValue('businessAddressLat', placeDetails.latitude, { shouldValidate: true });
      form.setValue('businessAddressLng', placeDetails.longitude, { shouldValidate: true });
      if (placeDetails.pincode) {
        form.setValue('businessPincode', placeDetails.pincode, { shouldValidate: true });
      }
    }
  };

  async function onSubmit(data: z.infer<typeof businessSchema>) {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/complete-profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update profile.');
      toast({ title: "Profile Completed!", description: "Welcome to Sparkle Studio." });
      onSuccess();
    } catch (error: any) {
      toast({ title: "Update Failed", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="businessName" render={({ field }) => (
          <FormItem><FormLabel className="flex items-center"><Building className="mr-2 h-4 w-4" />Business Name</FormLabel>
            <FormControl><Input placeholder="Your Company Inc." {...field} /></FormControl><FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem><FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4" />Business Email</FormLabel>
            <FormControl><Input type="email" placeholder="contact@yourcompany.com" {...field} /></FormControl><FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="gstNumber" render={({ field }) => (
          <FormItem><FormLabel className="flex items-center"><FileText className="mr-2 h-4 w-4" />GST Number</FormLabel>
            <FormControl><Input placeholder="e.g., 29ABCDE1234F1Z5" {...field} /></FormControl><FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="businessType" render={({ field }) => (
          <FormItem><FormLabel className="flex items-center"><Briefcase className="mr-2 h-4 w-4" />Business Type</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Select business type" /></SelectTrigger></FormControl>
              <SelectContent>
                {businessTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
              </SelectContent>
            </Select><FormMessage />
          </FormItem>
        )} />
        <FormItem className="space-y-2">
          <FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4" />Business Address</FormLabel>
          <DynamicAddressAutocompleteInput onPlaceSelectedAction={handlePlaceSelected} initialValue={form.getValues().businessAddressText} placeholder="Search your business address" />
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setIsMapDialogOpen(true)}>Pick on map</Button>
          </div>
          <FormField control={form.control} name="businessAddressText" render={({ field }) => <Input type="hidden" {...field} />} />
          <FormMessage>{form.formState.errors.businessAddressText?.message}</FormMessage>
        </FormItem>
        <FormField control={form.control} name="businessPincode" render={({ field }) => (
          <FormItem><FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4" />Pincode</FormLabel>
            <FormControl><Input placeholder="Enter your pincode" {...field} /></FormControl><FormMessage />
          </FormItem>
        )} />
        
        <Dialog open={isMapDialogOpen} onOpenChange={setIsMapDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Select Store Location</DialogTitle></DialogHeader>
            {StoreLocationPicker && (
              <StoreLocationPicker
                initialLocation={form.watch('businessAddressLat') && form.watch('businessAddressLng') ? { lat: form.watch('businessAddressLat') as number, lng: form.watch('businessAddressLng') as number } : undefined}
                onLocationSelectAction={(location) => {
                  form.setValue('businessAddressLat', location.lat, { shouldValidate: true });
                  form.setValue('businessAddressLng', location.lng, { shouldValidate: true });
                  if (location.address) {
                    form.setValue('businessAddressText', location.address, { shouldValidate: true });
                  }
                  setIsMapDialogOpen(false);
                }}
              />
            )}
            <DialogFooter><DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose></DialogFooter>
          </DialogContent>
        </Dialog>

        <FormField control={form.control} name="contactPersonName" render={({ field }) => (
          <FormItem><FormLabel className="flex items-center"><User className="mr-2 h-4 w-4" />Contact Person</FormLabel>
            <FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl><FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="contactPhoneNumber" render={({ field }) => (
          <FormItem><FormLabel className="flex items-center"><Phone className="mr-2 h-4 w-4" />Contact Phone</FormLabel>
            <FormControl><PhoneInput placeholder="Enter phone number" {...field} /></FormControl><FormMessage />
          </FormItem>
        )} />
        <Button type="submit" className="w-full btn-primary-sparkle text-lg py-3 mt-6" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ArrowRight className="mr-2 h-5 w-5" />}
          Complete Business Profile
        </Button>
      </form>
    </Form>
  );
}

export default function OnboardingPage() {
  const { profile, session, isLoading: authLoading, refreshProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (profile?.profile_completed) {
      window.location.href = '/dashboard';
    }
  }, [profile]);

  const handleSuccess = async () => {
    await refreshProfile();
    window.location.href = '/dashboard';
  };

  if (authLoading || !session) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const isBusiness = session.user.role === 'business';

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl">Complete Your Profile</CardTitle>
          <CardDescription>
            {isBusiness ? "Tell us about your business to get started." : "Just a few more details to personalize your experience."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isBusiness ? (
            <BusinessOnboardingForm profile={profile} onSuccess={handleSuccess} />
          ) : (
            <IndividualOnboardingForm profile={profile} onSuccess={handleSuccess} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
