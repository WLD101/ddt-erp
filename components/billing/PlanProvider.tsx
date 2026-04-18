"use client";

import React, { createContext, useContext, useState } from "react";
import { PlanLimitModal } from "./PlanLimitModal";

interface PlanContextType {
  showLimitModal: (limitType?: string, description?: string) => void;
  hideLimitModal: () => void;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [modalProps, setModalProps] = useState<{ limitType?: string; description?: string }>({});

  const showLimitModal = (limitType?: string, description?: string) => {
    setModalProps({ limitType, description });
    setIsOpen(true);
  };

  const hideLimitModal = () => setIsOpen(false);

  return (
    <PlanContext.Provider value={{ showLimitModal, hideLimitModal }}>
      {children}
      <PlanLimitModal 
        isOpen={isOpen} 
        onClose={hideLimitModal} 
        limitType={modalProps.limitType}
        description={modalProps.description}
      />
    </PlanContext.Provider>
  );
}

export function usePlanModal() {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error("usePlanModal must be used within a PlanProvider");
  }
  return context;
}
