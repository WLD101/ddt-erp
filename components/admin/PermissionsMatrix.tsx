"use client";

import React, { useState, useTransition } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield, ShieldAlert, Save, RotateCcw } from "lucide-react";
import { updateRolePermissions } from "@/modules/admin/roles-actions";

interface RoleWithPermissions {
  id: string;
  name: string;
  organizationId: string | null;
  permissions: { name: string }[];
}

interface Permission {
  id: string;
  name: string;
  category: string | null;
}

interface PermissionsMatrixProps {
  roles: RoleWithPermissions[];
  allPermissions: Permission[];
}

export function PermissionsMatrix({ roles, allPermissions }: PermissionsMatrixProps) {
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions>(roles[0]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    roles[0].permissions.map(p => p.name)
  );
  const [isPending, startTransition] = useTransition();

  const handleRoleSelect = (role: RoleWithPermissions) => {
    setSelectedRole(role);
    setSelectedPermissions(role.permissions.map(p => p.name));
  };

  const togglePermission = (name: string) => {
    setSelectedPermissions(prev => 
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    );
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateRolePermissions({
        roleId: selectedRole.id,
        permissionNames: selectedPermissions
      });

      if (result.success) {
        toast.success(`Permissions updated for ${selectedRole.name}`);
      } else {
        toast.error(result.error || "Failed to update permissions");
      }
    });
  };

  const categories = Array.from(new Set(allPermissions.map(p => p.category))).sort();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Role Sidebar */}
      <div className="lg:col-span-1 space-y-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground px-2">Access Roles</h3>
        <div className="space-y-1">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => handleRoleSelect(role)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-center justify-between group ${
                selectedRole.id === role.id 
                  ? "bg-primary text-white shadow-[0_10px_20px_-5px_rgba(124,58,237,0.4)]" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Shield className={`w-4 h-4 ${selectedRole.id === role.id ? "text-white" : "text-primary/60 group-hover:text-primary"}`} />
                <span className="font-bold capitalize">{role.name}</span>
              </div>
              {role.organizationId === null && (
                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                  selectedRole.id === role.id ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                }`}>System</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Permission Matrix */}
      <Card className="lg:col-span-3 bg-slate-900/50 border-white/5 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-white/5 bg-white/5 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black tracking-tight text-white flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-primary" />
                Permission Matrix: <span className="capitalize text-primary">{selectedRole.name}</span>
              </CardTitle>
              <CardDescription className="text-muted-foreground italic mt-1">
                Configure granular document and action-level overrides.
              </CardDescription>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedPermissions(selectedRole.permissions.map(p => p.name))}
                disabled={isPending}
                className="text-muted-foreground hover:text-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Reset
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={isPending || selectedRole.name === 'owner'}
                className="bg-primary hover:bg-primary/90 text-white font-bold shadow-[0_0_20px_rgba(124,58,237,0.3)]"
              >
                {isPending ? "Syncing..." : <> <Save className="w-4 h-4 mr-2" /> Persist Policy </>}
              </Button>
            </div>
          </div>
          {selectedRole.name === 'owner' && (
            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Note: The Owner role always bypasses permission checks and cannot be modified.
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[60vh] overflow-auto">
            <Table>
              <TableHeader className="bg-slate-950/50 sticky top-0 z-10">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="w-[300px] py-4 pl-8 uppercase text-[10px] font-black tracking-widest text-muted-foreground">Permission Capability</TableHead>
                  <TableHead className="py-4 uppercase text-[10px] font-black tracking-widest text-muted-foreground text-center">Authorization Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <React.Fragment key={category}>
                    <TableRow className="bg-white/5 border-white/5 hover:bg-white/5">
                      <TableCell colSpan={2} className="py-2 pl-8 text-[10px] font-black text-primary uppercase tracking-[0.2em]">{category || "Uncategorized"}</TableCell>
                    </TableRow>
                    {allPermissions
                      .filter(p => p.category === category)
                      .map((permission) => (
                        <TableRow key={permission.id} className="border-white/5 group hover:bg-white/[0.02] transition-colors">
                          <TableCell className="py-4 pl-10">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">{permission.name}</span>
                              <span className="text-[10px] text-muted-foreground italic">Granular key for system-wide {category?.toLowerCase()} control.</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 text-center">
                            <Checkbox 
                              checked={selectedPermissions.includes(permission.name)}
                              onCheckedChange={() => togglePermission(permission.name)}
                              disabled={isPending || selectedRole.name === 'owner'}
                              className="w-5 h-5 border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all scale-110"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    }
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
