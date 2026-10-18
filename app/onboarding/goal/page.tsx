import { redirect } from "next/navigation";

export default function GoalOnboardingPage() { redirect("/onboarding?step=1"); }
