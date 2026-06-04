"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useProjectStore } from "@/store";
import OnboardingWizard from "@/components/ui/OnboardingWizard";

const ONBOARDING_KEY = "cd-onboarding-wizard-dismissed";

export function OnboardingGate() {
  const [show, setShow] = useState(false);
  const projects = useProjectStore((s) => s.projects);

  useEffect(() => {
    // Show the wizard when the user has no projects and hasn't explicitly dismissed it
    const dismissed = localStorage.getItem(ONBOARDING_KEY);
    if (!dismissed && projects.length === 0) {
      setShow(true);
    }
  }, [projects.length]);

  const handleClose = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && <OnboardingWizard onClose={handleClose} />}
    </AnimatePresence>
  );
}
