// components/user-button.tsx
"use client";

import React from "react";
import { 
  UserCircle, 
  LogOut, 
  Settings, 
  User, 
  ShieldCheck,
  LayoutDashboard
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/modules/auth/actions";
import Link from "next/link";

interface UserButtonProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

export function UserButton({ user }: UserButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full bg-primary/10 hover:bg-primary/20 hover:-translate-y-0.5 transition-all duration-300 ring-2 ring-transparent hover:ring-primary/50 relative group"
          />
        }
      >
        {user.image ? (
          <img 
            src={user.image} 
            alt={user.name || "User"} 
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <UserCircle className="w-6 h-6 text-primary" />
        )}
        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full group-hover:scale-110 transition-transform" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 mt-2 border-white/10 bg-[#121212]/95 backdrop-blur-xl shadow-2xl" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold text-white leading-none">{user.name || "Anonymous"}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/5" />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="focus:bg-white/5 cursor-pointer">
            <Link href="/" className="flex items-center">
              <LayoutDashboard className="mr-2 h-4 w-4 text-primary" />
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="focus:bg-white/5 cursor-pointer">
            <Link href="/settings" className="flex items-center">
              <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
              <span>Org Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="focus:bg-white/5 cursor-pointer">
            <User className="mr-2 h-4 w-4 text-primary" />
            <span>My Profile</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-white/5" />
        <DropdownMenuItem 
          className="focus:bg-red-500/10 text-red-500 cursor-pointer transition-colors"
          onClick={() => signOutAction()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
