"use client";
import React from 'react'; // Ensure React is imported
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { UserCircle, LogOut, ChevronDown, Loader2, LogIn, Briefcase, User, Settings, Star } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from "@/lib/utils";

export function AuthNavMenu({ isCollapsed }: { isCollapsed?: boolean }) {
  const { user, profile, signOut, isLoading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/'); 
  };

  if (isLoading) {
    return <Button variant="ghost" size="sm" disabled><Loader2 className="h-4 w-4 animate-spin" /> {isCollapsed ? "" : "Loading..."}</Button>;
  }

  if (!user || !profile) {
    return (
      <div className={cn("flex gap-2", isCollapsed ? "flex-col items-center" : "items-center")}>
         <Button variant="outline" size="sm" asChild className={cn(isCollapsed && "h-10 w-10 p-0 rounded-full")}>
            <Link href="/auth/individual" title="Client Sign In">
                <User className={cn("h-4 w-4", !isCollapsed && "mr-1 md:mr-2")}/> <span className={cn("hidden md:inline", isCollapsed && "md:hidden")}>Client Sign In</span>
            </Link>
         </Button>
         <Button variant="default" size="sm" asChild className={cn("btn-primary-sparkle", isCollapsed && "h-10 w-10 p-0 rounded-full")}>
            <Link href="/auth/business" title="Business Sign In">
                <Briefcase className={cn("h-4 w-4", !isCollapsed && "mr-1 md:mr-2")}/> <span className={cn("hidden md:inline", isCollapsed && "md:hidden")}>Business Sign In</span>
            </Link>
         </Button>
      </div>
    );
  }
  
  const profileName = profile.role === 'business' ? profile.business_name : profile.full_name;
  const initials = profileName?.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() || user.email?.[0].toUpperCase() || "U";
  
  // Updated logic: "My Profile" for business users now points to /dashboard/networks
  const profileOrNetworkLink = profile.role === 'business' ? "/dashboard/networks" : "/dashboard/profile/individual";
  const profileOrNetworkLabel = profile.role === 'business' ? "Business Dashboard" : "My Profile";
  const profileIcon = profile.role === 'business' ? Settings : UserCircle;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-full rounded-xl justify-start p-2 hover:bg-white/5 transition-all">
           <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary/20 text-primary text-xs border border-primary/30">{initials}</AvatarFallback>
          </Avatar>
          <span className={cn("hidden md:inline text-sm font-medium ml-3 truncate text-foreground/90", isCollapsed && "md:hidden")}>{profileName || "Profile"}</span>
          <ChevronDown className={cn("ml-auto h-4 w-4 opacity-50 hidden md:inline", isCollapsed && "md:hidden")} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{profileName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            <p className="text-xs leading-none text-muted-foreground capitalize">
              Role: {profile.role}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={profileOrNetworkLink}>
            {React.createElement(profileIcon, { className: "mr-2 h-4 w-4" })}
            {profileOrNetworkLabel}
          </Link>
        </DropdownMenuItem>
        {profile.role === 'business' && (
          <DropdownMenuItem asChild>
            <Link href="/dashboard/reviews">
              <Star className="mr-2 h-4 w-4" />
              Reviews
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

