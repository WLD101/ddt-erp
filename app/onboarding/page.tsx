import { getOnboardingState } from "@/modules/onboarding/actions";
import { shouldShowOnboarding } from "@/modules/onboarding/actions";
import { ONBOARDING_STEPS } from "@/modules/onboarding/service";
import { WizardShell } from "./WizardShell";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const isEligible = await shouldShowOnboarding();
  if (!isEligible) redirect("/");

  const state = await getOnboardingState();

  return (
    <WizardShell
      initialStep={state.currentStep}
      completedSteps={state.completedSteps as string[]}
      skippedSteps={state.skippedSteps as string[]}
      steps={ONBOARDING_STEPS as any}
    />
  );
}
