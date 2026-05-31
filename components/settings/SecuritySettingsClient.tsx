"use client";

import { startTransition, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, Copy, KeyRound, Laptop, RefreshCw, Shield, Smartphone, UserRoundX } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  beginTotpEnrollmentAction,
  confirmTotpEnrollmentAction,
  disableTotpAction,
  regenerateRecoveryCodesAction,
  revokeMySessionsAction,
  revokeTrustedDeviceAction,
  revokeUserSessionsByAdminAction,
  updateTenantSecurityPolicyAction,
} from "@/modules/security/actions";

type TrustedDeviceItem = {
  id: string;
  label: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  lastUsedAt: Date | null;
  expiresAt: Date;
};

type SecurityEventItem = {
  id: string;
  type: string;
  status: string;
  details: string | null;
  createdAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
};

type MemberSecurityItem = {
  membershipId: string;
  userId: string;
  name: string | null;
  email: string | null;
  role: string;
  totpEnabled: boolean;
  trustedDeviceCount: number;
};

type SecurityPolicyShape = {
  requireTwoFactorForAllUsers: boolean;
  requireTwoFactorForPrivileged: boolean;
  enforcePasskeysForAdmins: boolean;
  restrictConcurrentSessions: boolean;
  forcePasswordReset: boolean;
  emergencyLockEnabled: boolean;
  maxActiveDevices: number | null;
  idleTimeoutMinutes: number;
  absoluteSessionLifetimeMinutes: number | null;
  staffIdleTimeoutMinutes: number | null;
  managerIdleTimeoutMinutes: number | null;
  accountantIdleTimeoutMinutes: number | null;
  adminIdleTimeoutMinutes: number | null;
  superAdminIdleTimeoutMinutes: number | null;
};

const PRESET_TIMEOUTS = [5, 15, 30, 60, 120, 240, 480, 720];

export function SecuritySettingsClient({
  currentRole,
  canManagePolicy,
  mfaRequiredEnrollment,
  profile,
  trustedDevices,
  policy,
  recoveryCodeCount,
  memberSecurity,
  recentEvents,
}: {
  currentRole: string;
  canManagePolicy: boolean;
  mfaRequiredEnrollment: boolean;
  profile: { totpEnabled: boolean };
  trustedDevices: TrustedDeviceItem[];
  policy: SecurityPolicyShape;
  recoveryCodeCount: number;
  memberSecurity: MemberSecurityItem[];
  recentEvents: SecurityEventItem[];
}) {
  const [setupPayload, setSetupPayload] = useState<null | {
    qrCodeDataUrl: string;
    manualEntryKey: string;
  }>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryVerificationCode, setRecoveryVerificationCode] = useState("");
  const [mutablePolicy, setMutablePolicy] = useState<SecurityPolicyShape>(policy);

  const timeoutPresetValue = useMemo(() => {
    return PRESET_TIMEOUTS.includes(mutablePolicy.idleTimeoutMinutes) ? String(mutablePolicy.idleTimeoutMinutes) : "custom";
  }, [mutablePolicy.idleTimeoutMinutes]);

  const beginEnrollment = () => {
    startTransition(async () => {
      const result = await beginTotpEnrollmentAction();
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      if (!("data" in result) || !result.data) {
        toast.error("We couldn't start authenticator setup right now.");
        return;
      }
      setSetupPayload({
        qrCodeDataUrl: result.data.qrCodeDataUrl,
        manualEntryKey: result.data.manualEntryKey,
      });
      toast.success("Authenticator setup started. Scan the QR code to continue.");
    });
  };

  const confirmEnrollment = () => {
    startTransition(async () => {
      const result = await confirmTotpEnrollmentAction({ code: verificationCode });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setRecoveryCodes(result.data?.recoveryCodes ?? []);
      setSetupPayload(null);
      setVerificationCode("");
      toast.success("Two-factor authentication is now active.");
    });
  };

  const disableEnrollment = () => {
    startTransition(async () => {
      const result = await disableTotpAction({
        password: disablePassword,
        verificationCode: disableCode,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setDisablePassword("");
      setDisableCode("");
      toast.success("Two-factor authentication disabled.");
      window.location.reload();
    });
  };

  const rotateRecoveryCodes = () => {
    startTransition(async () => {
      const result = await regenerateRecoveryCodesAction({
        password: recoveryPassword,
        verificationCode: recoveryVerificationCode,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setRecoveryCodes(result.data?.recoveryCodes ?? []);
      setRecoveryPassword("");
      setRecoveryVerificationCode("");
      toast.success("Recovery codes rotated.");
    });
  };

  const savePolicy = () => {
    startTransition(async () => {
      const result = await updateTenantSecurityPolicyAction(mutablePolicy);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Security policy updated. Existing sessions will be refreshed.");
      window.location.reload();
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-on-surface uppercase">
            Security <span className="text-primary">Command</span>
          </h2>
          <p className="mt-1 text-sm font-medium text-on-surface-variant">
            Harden workspace access with authenticator-based 2FA, trusted devices, and session controls.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={profile.totpEnabled ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700"}>
            {profile.totpEnabled ? "2FA active" : "2FA inactive"}
          </Badge>
          <Badge variant="outline" className="border-outline-variant/30 text-on-surface-variant">
            Role: {currentRole}
          </Badge>
        </div>
      </div>

      {mfaRequiredEnrollment ? (
        <Card className="rounded-3xl border-amber-500/20 bg-amber-500/5 shadow-soft">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-black uppercase tracking-widest text-amber-700">Authenticator setup required</p>
                <p className="mt-1 text-sm font-medium text-amber-900/80">
                  Your role requires two-factor authentication. Complete setup before continuing with sensitive workspace actions.
                </p>
              </div>
            </div>
            {!profile.totpEnabled ? (
              <Button className="rounded-2xl bg-primary text-on-primary" onClick={beginEnrollment}>
                Enable authenticator
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <Card className="rounded-3xl shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight">
              <Shield className="h-5 w-5 text-primary" />
              Two-factor authentication
            </CardTitle>
            <CardDescription className="text-sm font-medium text-on-surface-variant">
              Use any TOTP-compatible authenticator app including Google Authenticator, Microsoft Authenticator, Apple Passwords, 1Password, or Bitwarden.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!profile.totpEnabled && !setupPayload ? (
              <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-low/30 p-5">
                <p className="text-sm font-semibold text-on-surface">Set up an authenticator app</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Scan a QR code, confirm a 6-digit code, then store your recovery codes offline.
                </p>
                <Button className="mt-4 rounded-2xl bg-primary text-on-primary" onClick={beginEnrollment}>
                  Start setup
                </Button>
              </div>
            ) : null}

            {setupPayload ? (
              <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
                <div className="overflow-hidden rounded-3xl border border-outline-variant/30 bg-white p-4 shadow-soft">
                  <img src={setupPayload.qrCodeDataUrl} alt="Authenticator QR code" className="h-full w-full rounded-2xl" />
                </div>
                <div className="space-y-4">
                  <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-low/30 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant">Manual setup key</p>
                    <div className="mt-2 flex items-center gap-2">
                      <code className="rounded-xl bg-surface px-3 py-2 text-sm font-black text-on-surface">{setupPayload.manualEntryKey}</code>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={async () => {
                          await navigator.clipboard.writeText(setupPayload.manualEntryKey);
                          toast.success("Setup key copied.");
                        }}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="totp-code" className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                      Confirm 6-digit code
                    </Label>
                    <Input
                      id="totp-code"
                      value={verificationCode}
                      onChange={(event) => setVerificationCode(event.target.value)}
                      placeholder="123456"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button className="rounded-2xl bg-primary text-on-primary" onClick={confirmEnrollment}>
                      Activate 2FA
                    </Button>
                    <Button type="button" variant="outline" className="rounded-2xl" onClick={() => setSetupPayload(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}

            {profile.totpEnabled ? (
              <div className="space-y-6">
                <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                  <p className="text-sm font-semibold text-emerald-800">Authenticator protection is active.</p>
                  <p className="mt-1 text-sm text-emerald-700/80">
                    You currently have {recoveryCodeCount} unused backup recovery code{recoveryCodeCount === 1 ? "" : "s"}.
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-low/20 p-4">
                    <p className="flex items-center gap-2 text-sm font-black text-on-surface">
                      <RefreshCw className="h-4 w-4 text-primary" />
                      Regenerate recovery codes
                    </p>
                    <div className="mt-4 space-y-3">
                      <Input
                        type="password"
                        placeholder="Current password"
                        value={recoveryPassword}
                        onChange={(event) => setRecoveryPassword(event.target.value)}
                      />
                      <Input
                        placeholder="Authenticator or recovery code"
                        value={recoveryVerificationCode}
                        onChange={(event) => setRecoveryVerificationCode(event.target.value)}
                      />
                      <Button className="w-full rounded-2xl bg-primary text-on-primary" onClick={rotateRecoveryCodes}>
                        Generate new recovery codes
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-low/20 p-4">
                    <p className="flex items-center gap-2 text-sm font-black text-on-surface">
                      <UserRoundX className="h-4 w-4 text-error" />
                      Disable two-factor
                    </p>
                    <div className="mt-4 space-y-3">
                      <Input
                        type="password"
                        placeholder="Current password"
                        value={disablePassword}
                        onChange={(event) => setDisablePassword(event.target.value)}
                      />
                      <Input
                        placeholder="Authenticator or recovery code"
                        value={disableCode}
                        onChange={(event) => setDisableCode(event.target.value)}
                      />
                      <Button className="w-full rounded-2xl bg-error text-on-error" onClick={disableEnrollment}>
                        Disable 2FA
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {recoveryCodes.length > 0 ? (
              <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-low/20 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant">Recovery codes</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Save these offline now. They won&apos;t be shown again after you leave this page.
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {recoveryCodes.map((code) => (
                    <code key={code} className="rounded-xl border border-outline-variant/20 bg-surface px-3 py-2 text-sm font-black text-on-surface">
                      {code}
                    </code>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-3xl shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight">
                <Laptop className="h-5 w-5 text-primary" />
                Trusted devices
              </CardTitle>
              <CardDescription className="text-sm font-medium text-on-surface-variant">
                Devices marked as trusted can skip the authenticator challenge until they expire or are revoked.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {trustedDevices.length === 0 ? (
                <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-low/20 p-4 text-sm text-on-surface-variant">
                  No trusted devices are active for this account yet.
                </div>
              ) : (
                trustedDevices.map((device) => (
                  <div key={device.id} className="rounded-3xl border border-outline-variant/20 bg-surface-container-low/20 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-black text-on-surface">{device.label || "Trusted browser"}</p>
                        <p className="mt-1 text-xs font-medium text-on-surface-variant">
                          {device.ipAddress || "IP unavailable"} • {device.userAgent || "User agent unavailable"}
                        </p>
                        <p className="mt-2 text-[11px] font-medium text-on-surface-variant">
                          Last used {device.lastUsedAt ? formatDistanceToNow(new Date(device.lastUsedAt), { addSuffix: true }) : "recently"} • expires{" "}
                          {formatDistanceToNow(new Date(device.expiresAt), { addSuffix: true })}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="rounded-2xl text-error"
                        onClick={() => {
                        startTransition(async () => {
                          const result = await revokeTrustedDeviceAction(device.id);
                          if ("error" in result && typeof result.error === "string" && result.error) {
                            toast.error(result.error);
                            return;
                          }
                            toast.success("Trusted device revoked.");
                            window.location.reload();
                          });
                        }}
                      >
                        Revoke
                      </Button>
                    </div>
                  </div>
                ))
              )}

              <Button
                variant="outline"
                className="w-full rounded-2xl"
                onClick={() => {
                  startTransition(async () => {
                    const result = await revokeMySessionsAction();
                    if ("error" in result && typeof result.error === "string" && result.error) {
                      toast.error(result.error);
                      return;
                    }
                    toast.success("All active sessions revoked. Sign in again on other devices.");
                    window.location.assign("/auth/force-signout");
                  });
                }}
              >
                Revoke all my sessions
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-3xl shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight">
                <KeyRound className="h-5 w-5 text-primary" />
                Passkeys
              </CardTitle>
              <CardDescription className="text-sm font-medium text-on-surface-variant">
                WebAuthn passkey enrollment is staged for the next security rollout. Policy controls are already reserved so existing rollout-safe MFA can land first.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-low/20 p-4 text-sm text-on-surface-variant">
                Supported targets for the next slice include Apple Passwords, Face ID, Touch ID, Windows Hello, and password manager passkeys.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {canManagePolicy ? (
        <Card className="rounded-3xl shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg font-black tracking-tight">Tenant security policy</CardTitle>
            <CardDescription className="text-sm font-medium text-on-surface-variant">
              Changes here revoke active sessions immediately so new protections take effect across the workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 xl:grid-cols-2">
              <PolicyToggle
                label="Require 2FA for all users"
                description="Every workspace account must enroll an authenticator app."
                checked={mutablePolicy.requireTwoFactorForAllUsers}
                onCheckedChange={(checked) => setMutablePolicy((value) => ({ ...value, requireTwoFactorForAllUsers: checked }))}
              />
              <PolicyToggle
                label="Require 2FA for privileged roles"
                description="Owners and admins must enroll even if general enforcement is off."
                checked={mutablePolicy.requireTwoFactorForPrivileged}
                onCheckedChange={(checked) => setMutablePolicy((value) => ({ ...value, requireTwoFactorForPrivileged: checked }))}
              />
              <PolicyToggle
                label="Restrict concurrent sessions"
                description="Cap trusted devices and active browser sessions per account."
                checked={mutablePolicy.restrictConcurrentSessions}
                onCheckedChange={(checked) => setMutablePolicy((value) => ({ ...value, restrictConcurrentSessions: checked }))}
              />
              <PolicyToggle
                label="Force password reset"
                description="Require users to rotate passwords on their next login after you communicate a reset campaign."
                checked={mutablePolicy.forcePasswordReset}
                onCheckedChange={(checked) => setMutablePolicy((value) => ({ ...value, forcePasswordReset: checked }))}
              />
              <PolicyToggle
                label="Emergency tenant lock"
                description="Block tenant sign-ins immediately during an active security incident."
                checked={mutablePolicy.emergencyLockEnabled}
                onCheckedChange={(checked) => setMutablePolicy((value) => ({ ...value, emergencyLockEnabled: checked }))}
              />
              <PolicyToggle
                label="Passkey enforcement reserved"
                description="Passkey enforcement will activate in the upcoming WebAuthn rollout."
                checked={mutablePolicy.enforcePasskeysForAdmins}
                onCheckedChange={(checked) => setMutablePolicy((value) => ({ ...value, enforcePasskeysForAdmins: checked }))}
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <LabeledField label="Idle timeout">
                <select
                  value={timeoutPresetValue}
                  onChange={(event) => {
                    if (event.target.value === "custom") return;
                    setMutablePolicy((value) => ({ ...value, idleTimeoutMinutes: Number(event.target.value) }));
                  }}
                  className="h-11 w-full rounded-xl border border-outline-variant bg-surface-container px-3 text-sm font-semibold text-on-surface outline-none"
                >
                  {PRESET_TIMEOUTS.map((minutes) => (
                    <option key={minutes} value={minutes}>
                      {minutes < 60 ? `${minutes} minutes` : `${minutes / 60} hour${minutes === 60 ? "" : "s"}`}
                    </option>
                  ))}
                  <option value="custom">Custom</option>
                </select>
              </LabeledField>

              <LabeledField label="Custom idle timeout (minutes)">
                <Input
                  type="number"
                  min={5}
                  max={720}
                  value={mutablePolicy.idleTimeoutMinutes}
                  onChange={(event) =>
                    setMutablePolicy((value) => ({ ...value, idleTimeoutMinutes: Number(event.target.value || 0) }))
                  }
                />
              </LabeledField>

              <LabeledField label="Absolute lifetime (minutes)">
                <Input
                  type="number"
                  min={15}
                  max={10080}
                  value={mutablePolicy.absoluteSessionLifetimeMinutes ?? ""}
                  placeholder="Optional"
                  onChange={(event) =>
                    setMutablePolicy((value) => ({
                      ...value,
                      absoluteSessionLifetimeMinutes: event.target.value ? Number(event.target.value) : null,
                    }))
                  }
                />
              </LabeledField>

              <LabeledField label="Maximum active devices">
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={mutablePolicy.maxActiveDevices ?? ""}
                  placeholder="Optional"
                  onChange={(event) =>
                    setMutablePolicy((value) => ({
                      ...value,
                      maxActiveDevices: event.target.value ? Number(event.target.value) : null,
                    }))
                  }
                />
              </LabeledField>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
              <RoleTimeoutField label="Staff timeout" value={mutablePolicy.staffIdleTimeoutMinutes} onChange={(minutes) => setMutablePolicy((value) => ({ ...value, staffIdleTimeoutMinutes: minutes }))} />
              <RoleTimeoutField label="Manager timeout" value={mutablePolicy.managerIdleTimeoutMinutes} onChange={(minutes) => setMutablePolicy((value) => ({ ...value, managerIdleTimeoutMinutes: minutes }))} />
              <RoleTimeoutField label="Accountant timeout" value={mutablePolicy.accountantIdleTimeoutMinutes} onChange={(minutes) => setMutablePolicy((value) => ({ ...value, accountantIdleTimeoutMinutes: minutes }))} />
              <RoleTimeoutField label="Admin timeout" value={mutablePolicy.adminIdleTimeoutMinutes} onChange={(minutes) => setMutablePolicy((value) => ({ ...value, adminIdleTimeoutMinutes: minutes }))} />
              <RoleTimeoutField label="Super admin timeout" value={mutablePolicy.superAdminIdleTimeoutMinutes} onChange={(minutes) => setMutablePolicy((value) => ({ ...value, superAdminIdleTimeoutMinutes: minutes }))} />
            </div>

            <div className="flex justify-end">
              <Button className="rounded-2xl bg-primary px-8 text-on-primary" onClick={savePolicy}>
                Save security policy
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {canManagePolicy ? (
        <Card className="rounded-3xl shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg font-black tracking-tight">Workspace user session control</CardTitle>
            <CardDescription className="text-sm font-medium text-on-surface-variant">
              Review who has 2FA enrolled and revoke sessions if an account looks risky.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {memberSecurity.map((member) => (
              <div key={member.membershipId} className="rounded-3xl border border-outline-variant/20 bg-surface-container-low/20 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-black text-on-surface">{member.name || member.email || "Workspace member"}</p>
                    <p className="mt-1 text-xs font-medium text-on-surface-variant">
                      {member.email || "No email"} • role {member.role} • {member.trustedDeviceCount} trusted device{member.trustedDeviceCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={member.totpEnabled ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700"}>
                      {member.totpEnabled ? "2FA enabled" : "2FA missing"}
                    </Badge>
                    <Button
                      variant="outline"
                      className="rounded-2xl text-error"
                      onClick={() => {
                        startTransition(async () => {
                          const result = await revokeUserSessionsByAdminAction(member.userId);
                          if ("error" in result && typeof result.error === "string" && result.error) {
                            toast.error(result.error);
                            return;
                          }
                          toast.success(`Sessions revoked for ${member.name || member.email || "user"}.`);
                        });
                      }}
                    >
                      Force logout
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-3xl shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg font-black tracking-tight">Recent security events</CardTitle>
          <CardDescription className="text-sm font-medium text-on-surface-variant">
            Authenticator changes, suspicious sign-in outcomes, and session actions across this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentEvents.length === 0 ? (
            <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-low/20 p-4 text-sm text-on-surface-variant">
              No security events have been recorded yet.
            </div>
          ) : (
            recentEvents.map((event) => (
              <div key={event.id} className="rounded-3xl border border-outline-variant/20 bg-surface-container-low/20 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-on-surface">{event.type}</p>
                    <p className="mt-1 text-sm font-medium text-on-surface-variant">{event.details || "Security event recorded."}</p>
                    <p className="mt-2 text-[11px] font-medium text-on-surface-variant">
                      {event.ipAddress || "IP unavailable"} • {event.userAgent || "User agent unavailable"}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="border-outline-variant/30 text-on-surface-variant">
                      {event.status}
                    </Badge>
                    <p className="mt-2 text-[11px] font-medium text-on-surface-variant">
                      {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PolicyToggle({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-low/20 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-on-surface">{label}</p>
          <p className="mt-1 text-sm text-on-surface-variant">{description}</p>
        </div>
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
      </div>
    </div>
  );
}

function LabeledField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{label}</Label>
      {children}
    </div>
  );
}

function RoleTimeoutField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <LabeledField label={label}>
      <Input
        type="number"
        min={5}
        max={720}
        value={value ?? ""}
        placeholder="Use default"
        onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
      />
    </LabeledField>
  );
}
