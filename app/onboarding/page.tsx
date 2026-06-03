import { getOnboardingState } from "@/modules/onboarding/actions";
import { shouldShowOnboarding } from "@/modules/onboarding/actions";
import { ONBOARDING_STEPS } from "@/modules/onboarding/service";
import { WizardShell } from "./WizardShell";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isPlatformAdminEmail } from "@/lib/security/access";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await auth();
  if (session?.user?.email && isPlatformAdminEmail(session.user.email)) {
    redirect("/wq-command-center");
  }

  const isEligible = await shouldShowOnboarding();
  if (!isEligible) redirect("/dashboard");

  const state = await getOnboardingState();

  return (
    <WizardShell
      initialStep={state.currentStep}
      completedSteps={state.completedSteps as string[]}
      skippedSteps={state.skippedSteps as string[]}
      steps={ONBOARDING_STEPS as any}
      state={state}
    />
  );
}
