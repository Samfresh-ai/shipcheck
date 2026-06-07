import type { Metadata } from "next";
import { ProjectSetupForm } from "@/components/setup/ProjectSetupForm";

export const metadata: Metadata = {
  title: "Start Check",
  description: "Set up your product context before starting the 20-question readiness check.",
};

export default function CheckPage() {
  return (
    <div className="px-5 py-10">
      <ProjectSetupForm />
    </div>
  );
}
