"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { OnboardingOverlay } from "@/components/ui/OnboardingOverlay";

const ONBOARDING_KEY = "cd-onboarding-seen";

export function OnboardingGate() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(ONBOARDING_KEY);
    if (!seen) setShow(true);
  }, []);

  const handleClose = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && <OnboardingOverlay onClose={handleClose} />}
    </AnimatePresence>
  );
}
