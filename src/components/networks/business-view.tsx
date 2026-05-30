"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { updateBusinessProfile, addJewelryItem, getJewelryItemsByBusiness, type JewelryItemData, addStoreBranch, type StoreBranchData } from '@/lib/actions/supabase-actions';
import { Loader2, Save, Edit, UploadCloud, Building, FileText, MapPin, User, Phone, Briefcase, ImageIcon, ListOrdered, ShoppingBag, PackageSearch, PlusCircle, Lock } from 'lucide-react';
import { AddressAutocompleteInput } from '@/components/common/address-autocomplete-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { JewelryCard, type JewelryItem } from '@/components/networks/jewelry-card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import dynamic from "next/dynamic";
const StoreLocationPicker = dynamic(() => import("./StoreLocationPicker").then(mod => mod.StoreLocationPicker), { ssr: false });
const StoreMap = dynamic(() => import('./StoreMap').then(mod => mod.StoreMap), { ssr: false });
const StoreDirectionsMap = dynamic(() => import('./StoreDirectionsMap').then(mod => mod.default), { ssr: false });

const businessProfileSchema = z.object({
  business_name: z.string().min(2, "Business name is required."),
  gst_number: z.string().min(15, "GST number must be 15 characters.").max(15, "GST number must be 15 characters.").regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GST number format."),
  business_type: z.string().min(3, "Business type is required."),
  business_address_text: z.string().min(10, "Business address is required."),
  business_address_lat: z.number().nullable().optional(), // Allow null
  business_address_lng: z.number().nullable().optional(), // Allow null
  contact_person_name: z.string().min(2, "Contact person name is required."),
  contact_phone_number: z.string().min(10, "Phone number must be at least 10 digits.").regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format."),
});

type BusinessProfileFormValues = z.infer<typeof businessProfileSchema>;

const jewelryItemSchema = z.object({
  name: z.string().min(2, "Jewelry name is required."),
  description: z.string().min(10, "Description is required."),
  material: z.string().min(2, "Material is required."),
  style: z.string().min(2, "Style is required."),
  image_url: z
    .string()
    .min(10, "A valid image URL is required.")
    .refine((value) => {
      const trimmed = value.trim();
      if (trimmed.startsWith('data:image/')) return true;
      try {
        const url = new URL(trimmed);
        const host = url.hostname.replace(/^www\./, '');
        if (host === 'google.com' && url.pathname === '/imgres') {
          return Boolean(url.searchParams.get('imgurl'));
        }
        return /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(trimmed);
      } catch {
        return false;
      }
    }, "Use a direct image URL (.jpg/.png/.webp) or a Google Images link."),
});

type JewelryItemFormValues = z.infer<typeof jewelryItemSchema>;

const businessTypes = ["Retailer", "Wholesaler", "Artisan/Designer", "Manufacturer", "Online Store", "Other"];

interface FetchedJewelryItem extends JewelryItemData {
  id: string;
  created_at: string;
}

const branchSchema = z.object({
  name: z.string().min(2, "Branch name is required."),
  address_text: z.string().min(10, "Branch address is required."),
  address_lat: z.number({ required_error: "Latitude is required for branch location." }),
  address_lng: z.number({ required_error: "Longitude is required for branch location." }),
});

type BranchFormValues = z.infer<typeof branchSchema>;

export function BusinessNetworkView() {
  const { user, profile, isLoading: authLoading, refreshProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  
  const [isSubmittingJewelry, setIsSubmittingJewelry] = useState(false);
  const [listedItems, setListedItems] = useState<FetchedJewelryItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [showMapDialog, setShowMapDialog] = useState(false);
  const [showAddBranchDialog, setShowAddBranchDialog] = useState(false);
  const [mapDialogTarget, setMapDialogTarget] = useState<'profile' | 'branch' | null>(null);

  const profileForm = useForm<BusinessProfileFormValues>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      business_name: "", gst_number: "", business_type: "", business_address_text: "",
      business_address_lat: null, business_address_lng: null, // Default to null
      contact_person_name: "", contact_phone_number: "",
    },
  });

  const jewelryForm = useForm<JewelryItemFormValues>({
    resolver: zodResolver(jewelryItemSchema),
    defaultValues: { name: "", description: "", material: "", style: "", image_url: "" },
  });

  const branchForm = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: "",
      address_text: "",
      address_lat: 0,
      address_lng: 0,
    },
  });

  const fetchListedItems = async () => {
    if (!user) return;
    setIsLoadingItems(true);
    const { data, error } = await getJewelryItemsByBusiness(user.id);
    if (error) {
      toast({ title: "Error", description: "Could not fetch your listed jewelry items.", variant: "destructive" });
    } else {
      setListedItems((data as FetchedJewelryItem[] | null) || []);
    }
    setIsLoadingItems(false);
  };
  
  useEffect(() => {
    if (!authLoading && (!user || profile?.role !== 'business')) {
      router.replace('/auth/business');
    }
    if (user && profile && profile.role === 'business') {
      profileForm.reset({
        business_name: profile.business_name || "",
        gst_number: profile.gst_number || "",
        business_type: profile.business_type || "",
        business_address_text: profile.business_address_text || "",
        business_address_lat: profile.business_address_lat === undefined ? null : profile.business_address_lat,
        business_address_lng: profile.business_address_lng === undefined ? null : profile.business_address_lng,
        contact_person_name: profile.contact_person_name || "",
        contact_phone_number: profile.contact_phone_number || "",
      });
      fetchListedItems();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile, authLoading, router, profileForm.reset]); // Removed toast from deps array as it's stable

  const handlePlaceSelected = (placeDetails: { address: string; latitude: number; longitude: number } | null) => {
    if (placeDetails) {
      profileForm.setValue('business_address_text', placeDetails.address, { shouldValidate: true });
      profileForm.setValue('business_address_lat', placeDetails.latitude, { shouldValidate: true });
      profileForm.setValue('business_address_lng', placeDetails.longitude, { shouldValidate: true });
    } else {
      // If placeDetails is null (e.g., address cleared), reset address text and explicitly set lat/lng to null
      profileForm.setValue('business_address_text', "", { shouldValidate: true }); 
      profileForm.setValue('business_address_lat', null, { shouldValidate: true }); 
      profileForm.setValue('business_address_lng', null, { shouldValidate: true }); 
    }
  };

  const handleMapSelect = (location: { lat: number; lng: number; address?: string }) => {
    if (mapDialogTarget === 'profile') {
      profileForm.setValue('business_address_lat', location.lat, { shouldValidate: true });
      profileForm.setValue('business_address_lng', location.lng, { shouldValidate: true });
      if (location.address) {
        profileForm.setValue('business_address_text', location.address, { shouldValidate: true });
      }
    } else if (mapDialogTarget === 'branch') {
      branchForm.setValue('address_lat', location.lat, { shouldValidate: true });
      branchForm.setValue('address_lng', location.lng, { shouldValidate: true });
      if (location.address) {
        branchForm.setValue('address_text', location.address, { shouldValidate: true });
      }
    }
  };

  const handleBranchMapSelect = (location: { lat: number; lng: number; address?: string }) => {
    branchForm.setValue('address_lat', location.lat, { shouldValidate: true });
    branchForm.setValue('address_lng', location.lng, { shouldValidate: true });
    if (location.address) {
      branchForm.setValue('address_text', location.address, { shouldValidate: true });
    }
  };

  async function onProfileSubmit(values: BusinessProfileFormValues) {
    if (!user) return;
    setIsSubmittingProfile(true);
    try {
      // Ensure lat/lng are numbers or undefined (not null) before sending to server action
      const submissionValues = {
        ...values,
        business_address_lat: typeof values.business_address_lat === 'number' ? values.business_address_lat : undefined,
        business_address_lng: typeof values.business_address_lng === 'number' ? values.business_address_lng : undefined,
      };
      const { error } = await updateBusinessProfile(user.id, submissionValues); 
      if (error) throw error;
      await refreshProfile(); 
      toast({ title: "Success", description: "Business profile updated successfully." });
      setIsEditingProfile(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update profile.", variant: "destructive" });
    } finally {
      setIsSubmittingProfile(false);
    }
  }

  async function onJewelrySubmit(values: JewelryItemFormValues) {
    if (!user) return;
    setIsSubmittingJewelry(true);
    try {
      let normalizedImageUrl = values.image_url.trim();
      try {
        const parsed = new URL(normalizedImageUrl);
        const host = parsed.hostname.replace(/^www\./, '');
        if (host === 'google.com' && parsed.pathname === '/imgres') {
          const imgUrlParam = parsed.searchParams.get('imgurl');
          if (imgUrlParam) {
            normalizedImageUrl = imgUrlParam;
          }
        }
      } catch {
        // keep original
      }

      const itemData: JewelryItemData = { ...values, image_url: normalizedImageUrl, business_id: user.id };
      const { error } = await addJewelryItem(itemData);
      if (error) throw error;
      toast({ title: "Success", description: "Jewelry item listed successfully." });
      jewelryForm.reset();
      await fetchListedItems(); 
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to list jewelry item.", variant: "destructive" });
    } finally {
      setIsSubmittingJewelry(false);
    }
  }

  async function onBranchSubmit(values: BranchFormValues) {
    if (!user) return;
    setIsSubmittingProfile(true); // Using profile submitting state for now, consider separate if needed
    try {
      const branchData = { ...values, business_id: user.id };
      const { data, error } = await addStoreBranch(branchData);
      if (error) throw error;
      toast({ title: "Success", description: `Branch '${data?.name || values.name}' added successfully!` });
      branchForm.reset();
      setShowAddBranchDialog(false);
      // Optionally refetch stores if you have a display for them
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add branch.", variant: "destructive" });
    } finally {
      setIsSubmittingProfile(false);
    }
  }

  if (authLoading || !profile) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-10 w-1/2 mx-auto my-4" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
   if (profile.role !== 'business') {
     return <p>Loading or Access Denied...</p>;
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Cinematic Minimalist Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 1, 0.25, 1] }}
        className="relative w-full rounded-[2rem] overflow-hidden border border-white/5 bg-black/20 backdrop-blur-2xl p-8 lg:p-12 shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
      >
         <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
         
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-6">
                <div className="h-24 w-24 rounded-[1.5rem] bg-black/60 border border-white/10 flex items-center justify-center shadow-inner relative overflow-hidden">
                    {/* Add a subtle glow behind the icon inside the box */}
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 opacity-50" />
                    <ShoppingBag className="h-10 w-10 text-primary relative z-10" />
                </div>
                <div>
                    <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-white mb-3">
                        {profile.business_name || "Your Business"}
                    </h1>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm text-white/60 font-medium tracking-wide">
                        <span className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-primary" />
                            {profile.business_address_text || "Location not configured"}
                        </span>
                        <span className="flex items-center">
                            <Briefcase className="h-4 w-4 mr-2 text-primary" />
                            {profile.business_type || "Type unassigned"}
                        </span>
                    </div>
                    {/* Restriction badge / Action Prompt */}
                    {profile.role === 'business' ? (
                        (!profile.business_address_lat || !profile.business_address_lng) && (
                        <div className="mt-4 bg-primary/10 border border-primary/20 rounded-xl p-3 flex items-center gap-3 inline-flex">
                            <span className="text-primary text-sm font-medium">Configure store location to appear on maps.</span>
                            <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/20" onClick={() => setIsEditingProfile(true)}>
                                Set Location
                            </Button>
                        </div>
                        )
                    ) : (
                        <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs font-medium">
                            <Lock className="h-3 w-3 mr-2" /> View Only Access
                        </div>
                    )}
                </div>
            </div>
            
            <div className="mt-4 md:mt-0">
                <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
                  <DialogTrigger asChild>
                    <Button className="rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white transition-all px-8 h-12 tracking-wide font-medium">
                      <Edit className="mr-2 h-4 w-4" /> Configure Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center"><Building className="mr-2 h-6 w-6 text-primary"/>Edit Business Profile</DialogTitle>
                      <DialogDescription>Update your business information. Click save when you're done.</DialogDescription>
                    </DialogHeader>
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-3">
                        <FormField control={profileForm.control} name="business_name" render={({ field }) => (
                            <FormItem><FormLabel>Business Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                          )}
                        />
                        <FormItem><FormLabel>Business Email</FormLabel><Input value={user?.email || ""} disabled /></FormItem>
                        <FormField control={profileForm.control} name="gst_number" render={({ field }) => (
                            <FormItem><FormLabel className="flex items-center"><FileText className="mr-2 h-4 w-4" />GST Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                          )}
                        />
                        <FormField control={profileForm.control} name="business_type" render={({ field }) => (
                            <FormItem><FormLabel className="flex items-center"><Briefcase className="mr-2 h-4 w-4" />Business Type</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                                <SelectContent>{businessTypes.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent>
                              </Select><FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormItem>
                          <FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4" />Business Address</FormLabel>
                          <div className="flex flex-col gap-1">
                            <AddressAutocompleteInput
                              onPlaceSelectedAction={handlePlaceSelected}
                              initialValue={profileForm.getValues().business_address_text || ""}
                              placeholder="Search your business address"
                            />
                            <div className="flex gap-2 mt-2">
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => { setMapDialogTarget('profile'); setShowMapDialog(true); }}
                                disabled={profile.role !== 'business'}
                                title={profile.role !== 'business' ? 'Only business owners can pick location on map.' : undefined}
                              >
                                <MapPin className="mr-2 h-4 w-4" />Pick on Map
                              </Button>
                              {profileForm.watch('business_address_lat') && profileForm.watch('business_address_lng') && (
                                <span className="text-xs text-muted-foreground">Lat: {profileForm.watch('business_address_lat')}, Lng: {profileForm.watch('business_address_lng')}</span>
                              )}
                            </div>
                            {profile.role !== 'business' && (
                              <span className="text-xs text-gray-500 mt-1 flex items-center"><Lock className="h-3 w-3 mr-1" /> Store location can only be set by the business owner.</span>
                            )}
                          </div>
                          <FormField control={profileForm.control} name="business_address_text" render={({ field }) => <Input type="hidden" {...field} />} />
                          <FormField control={profileForm.control} name="business_address_lat" render={({ field }) => <Input type="hidden" value={field.value ?? ''} onChange={field.onChange} name={field.name} ref={field.ref} />} />
                          <FormField control={profileForm.control} name="business_address_lng" render={({ field }) => <Input type="hidden" value={field.value ?? ''} onChange={field.onChange} name={field.name} ref={field.ref} />} />
                          <FormMessage>{profileForm.formState.errors.business_address_text?.message || profileForm.formState.errors.business_address_lat?.message || profileForm.formState.errors.business_address_lng?.message}</FormMessage>
                        </FormItem>
                        <FormField control={profileForm.control} name="contact_person_name" render={({ field }) => (
                            <FormItem><FormLabel className="flex items-center"><User className="mr-2 h-4 w-4" />Contact Person</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                          )}
                        />
                        <FormField control={profileForm.control} name="contact_phone_number" render={({ field }) => (
                            <FormItem><FormLabel className="flex items-center"><Phone className="mr-2 h-4 w-4" />Contact Phone</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                          )}
                        />
                         <DialogFooter className="pt-4">
                            <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={isSubmittingProfile}>
                              {isSubmittingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                              Save Changes
                            </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                    {/* Map Dialog for picking location */}
                    <Dialog open={showMapDialog} onOpenChange={setShowMapDialog}>
                      <DialogContent className="max-w-4xl p-0">
                        <DialogHeader className="p-6 pb-4">
                          <DialogTitle>Pick Store Location on Map</DialogTitle>
                          <DialogDescription>Drag the marker to your exact store location.</DialogDescription>
                        </DialogHeader>
                        <div className="px-6 pb-6">
                          <StoreLocationPicker
                            initialLocation={mapDialogTarget === 'profile' && profile.business_address_lat && profile.business_address_lng ? { lat: profile.business_address_lat, lng: profile.business_address_lng } : 
                                              mapDialogTarget === 'branch' && branchForm.watch('address_lat') !== 0 && branchForm.watch('address_lng') !== 0 ? { lat: branchForm.watch('address_lat'), lng: branchForm.watch('address_lng') } : undefined}
                            onLocationSelectAction={handleMapSelect}
                          />
                        </div>
                        <DialogFooter className="px-6 py-4 border-t border-gray-200">
                          <DialogClose asChild>
                            <Button type="button" variant="outline" onClick={() => setShowMapDialog(false)}>Cancel</Button>
                          </DialogClose>
                          <Button type="button" onClick={() => setShowMapDialog(false)}>Save Location</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </DialogContent>
                </Dialog>
            </div>
        </div>
      </motion.div>

      <Separator />

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 1, 0.25, 1] }} className="rounded-[2rem] border border-white/5 bg-black/20 backdrop-blur-md p-8 lg:p-10 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] rounded-full pointer-events-none" />
            <div className="mb-8 relative z-10">
                <h2 className="text-2xl font-medium tracking-wide text-white flex items-center"><UploadCloud className="mr-3 h-6 w-6 text-primary"/>List New Jewelry Item</h2>
                <p className="text-white/50 text-sm mt-2 tracking-wide">Add your jewelry pieces to the digital showroom catalog.</p>
            </div>
            <div className="relative z-10">
            <Form {...jewelryForm}>
                <form onSubmit={jewelryForm.handleSubmit(onJewelrySubmit)} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                    <FormField control={jewelryForm.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Jewelry Name</FormLabel><FormControl><Input placeholder="e.g., Diamond Solitaire Ring" {...field} /></FormControl><FormMessage /></FormItem>
                    )}
                    />
                    <FormField control={jewelryForm.control} name="image_url" render={({ field }) => (
                        <FormItem><FormLabel className="flex items-center"><ImageIcon className="mr-2 h-4 w-4" />Image URL</FormLabel><FormControl><Input type="url" placeholder="https://yourimagehost.com/image.png" {...field} /></FormControl><FormMessage /></FormItem>
                    )}
                    />
                </div>
                <FormField control={jewelryForm.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Detailed description of the piece..." {...field} rows={3} /></FormControl><FormMessage /></FormItem>
                    )}
                />
                <div className="grid sm:grid-cols-2 gap-6">
                    <FormField control={jewelryForm.control} name="material" render={({ field }) => (
                        <FormItem><FormLabel>Material</FormLabel><FormControl><Input placeholder="e.g., 18k White Gold, Platinum" {...field} /></FormControl><FormMessage /></FormItem>
                    )}
                    />
                    <FormField control={jewelryForm.control} name="style" render={({ field }) => (
                        <FormItem><FormLabel>Style</FormLabel><FormControl><Input placeholder="e.g., Vintage, Modern, Art Deco" {...field} /></FormControl><FormMessage /></FormItem>
                    )}
                    />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl bg-primary text-black hover:bg-primary/90 transition-all font-medium tracking-wide uppercase text-xs shadow-[0_0_15px_rgba(212,175,55,0.2)]" disabled={isSubmittingJewelry}>
                    {isSubmittingJewelry ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                    Publish Item
                </Button>
                </form>
            </Form>
            </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 1, 0.25, 1] }} className="rounded-[2rem] border border-white/5 bg-black/20 backdrop-blur-md p-8 lg:p-10 shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 blur-[50px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center">
            <Building className="h-12 w-12 text-primary/80 mb-6" />
            <h2 className="text-2xl font-medium tracking-wide text-white mb-3">Branch Management</h2>
            <p className="text-white/50 text-sm mb-10 tracking-wide max-w-sm">
              Expand your showroom network by adding and managing physical locations.
            </p>
          </div>
          <div className="w-full relative z-10">
            <Dialog open={showAddBranchDialog} onOpenChange={setShowAddBranchDialog}>
              <DialogTrigger asChild>
                <Button className="w-full h-12 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all font-medium tracking-wide uppercase text-xs">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Location
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center"><Building className="mr-2 h-6 w-6 text-primary"/>Add New Store Branch</DialogTitle>
                  <DialogDescription>Enter details for your new branch location. Click save when you're done.</DialogDescription>
                </DialogHeader>
                <Form {...branchForm}>
                  <form onSubmit={branchForm.handleSubmit(onBranchSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-3">
                    <FormField control={branchForm.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Branch Name</FormLabel><FormControl><Input placeholder="e.g., Downtown Branch" {...field} /></FormControl><FormMessage /></FormItem>
                      )}
                    />
                    <FormItem>
                      <FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4" />Branch Address</FormLabel>
                      <div className="flex flex-col gap-1">
                        <AddressAutocompleteInput
                          onPlaceSelectedAction={(placeDetails) => {
                            if (placeDetails) {
                              branchForm.setValue('address_text', placeDetails.address, { shouldValidate: true });
                              branchForm.setValue('address_lat', placeDetails.latitude, { shouldValidate: true });
                              branchForm.setValue('address_lng', placeDetails.longitude, { shouldValidate: true });
                            } else {
                              branchForm.setValue('address_text', "", { shouldValidate: true });
                              branchForm.setValue('address_lat', 0, { shouldValidate: true });
                              branchForm.setValue('address_lng', 0, { shouldValidate: true });
                            }
                          }}
                          initialValue={branchForm.getValues().address_text || ""}
                          placeholder="Search branch address"
                        />
                        <div className="flex gap-2 mt-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => { setMapDialogTarget('branch'); setShowMapDialog(true); }}
                          >
                            <MapPin className="mr-2 h-4 w-4" />Pick on Map
                          </Button>
                          {branchForm.watch('address_lat') !== 0 && branchForm.watch('address_lng') !== 0 && (
                            <span className="text-xs text-muted-foreground">Lat: {branchForm.watch('address_lat')}, Lng: {branchForm.watch('address_lng')}</span>
                          )}
                        </div>
                      </div>
                      <FormField control={branchForm.control} name="address_text" render={({ field }) => <Input type="hidden" {...field} />} />
                      <FormField control={branchForm.control} name="address_lat" render={({ field }) => <Input type="hidden" value={field.value ?? ''} onChange={field.onChange} name={field.name} ref={field.ref} />} />
                      <FormField control={branchForm.control} name="address_lng" render={({ field }) => <Input type="hidden" value={field.value ?? ''} onChange={field.onChange} name={field.name} ref={field.ref} />} />
                      <FormMessage>{branchForm.formState.errors.address_text?.message || branchForm.formState.errors.address_lat?.message || branchForm.formState.errors.address_lng?.message}</FormMessage>
                    </FormItem>
                    <DialogFooter className="pt-4">
                      <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                      <Button type="submit" disabled={isSubmittingProfile}> {/* Re-using isSubmittingProfile */} 
                        {isSubmittingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Branch
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>
      </div>
      
      <Separator />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 1, 0.25, 1] }}>
        <h2 className="text-2xl md:text-3xl font-medium tracking-wide text-white mb-8 flex items-center gap-3">
          <ListOrdered className="h-6 w-6 text-primary" /> Active Showroom Items
        </h2>
        {isLoadingItems ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-72 w-full" />)}
          </div>
        ) : listedItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listedItems.map(item => (
              <JewelryCard
                key={item.id}
                id={item.id}
                name={item.name}
                type={'Assorted'}
                style={item.style}
                material={item.material}
                description={item.description}
                imageUrl={item.image_url}
                dataAiHint={`${item.style} ${item.name.split(' ')[0]}`}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 border border-white/5 rounded-[2rem] bg-black/20 backdrop-blur-md">
            <PackageSearch className="h-16 w-16 text-white/20 mb-6" />
            <p className="text-lg text-white/80 font-medium tracking-wide mb-2">Your showroom is empty.</p>
            <p className="text-sm text-white/50 tracking-wide">Items you publish will appear here beautifully formatted.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
