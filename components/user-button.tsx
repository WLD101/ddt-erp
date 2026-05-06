// components/user-button.tsx
"use client";

import React from "react";
import { 
  LogOut, 
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
            className="w-9 h-9 rounded-full border border-outline-variant shadow-sm hover:opacity-80 transition-opacity p-0 overflow-hidden"
          />
        }
      >
        {user.image ? (
          <img 
            src={user.image} 
            alt={user.name || "User"} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-primary-container flex items-center justify-center text-on-primary font-bold">
            {user.name?.[0]?.toUpperCase() || "U"}
          </div>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 mt-2 border-outline-variant bg-surface shadow-soft" align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-semibold text-on-surface leading-none">{user.name || "Anonymous"}</p>
              <p className="text-xs leading-none text-on-surface-variant">{user.email}</p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-outline-variant" />
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="focus:bg-surface-container-low cursor-pointer"
            onClick={() => window.location.assign("/")}
          >
            <LayoutDashboard className="mr-2 h-4 w-4 text-primary" />
            <span className="font-body-md">Dashboard</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="focus:bg-surface-container-low cursor-pointer"
            onClick={() => window.location.assign("/settings")}
          >
            <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
            <span className="font-body-md">Org Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="focus:bg-surface-container-low cursor-pointer">
            <User className="mr-2 h-4 w-4 text-primary" />
            <span className="font-body-md">My Profile</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-outline-variant" />
        <DropdownMenuItem 
          className="focus:bg-error-container/20 text-error cursor-pointer transition-colors"
          onClick={async () => {
            await signOutAction();
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span className="font-body-md font-medium">Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
