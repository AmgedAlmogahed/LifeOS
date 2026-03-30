"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type CompanyFilter = "all" | "rabwatech" | "lubb" | "personal";

interface CompanyFilterContextType {
  selectedCompany: CompanyFilter;
  setSelectedCompany: (company: CompanyFilter) => void;
}

const CompanyFilterContext = createContext<CompanyFilterContextType>({
  selectedCompany: "all",
  setSelectedCompany: () => {},
});

const STORAGE_KEY = "lifeos-company-filter";

export function CompanyFilterProvider({ children }: { children: ReactNode }) {
  const [selectedCompany, setSelectedCompanyState] = useState<CompanyFilter>("all");

  // Read from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && ["all", "rabwatech", "lubb", "personal"].includes(stored)) {
        setSelectedCompanyState(stored as CompanyFilter);
      }
    } catch {}
  }, []);

  const setSelectedCompany = (company: CompanyFilter) => {
    setSelectedCompanyState(company);
    try {
      localStorage.setItem(STORAGE_KEY, company);
    } catch {}
  };

  return (
    <CompanyFilterContext.Provider value={{ selectedCompany, setSelectedCompany }}>
      {children}
    </CompanyFilterContext.Provider>
  );
}

export function useCompanyFilter() {
  return useContext(CompanyFilterContext);
}
