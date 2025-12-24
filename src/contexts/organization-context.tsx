'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  email: string | null;
  phone: string | null;
  plan: string;
  role: string;
}

interface OrganizationContextType {
  organization: Organization | null;
  isLoading: boolean;
  refreshOrganization: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrganization = async () => {
    try {
      const res = await fetch('/api/organizations');
      if (res.ok) {
        const data = await res.json();
        // Get the first/default organization
        if (data.organizations && data.organizations.length > 0) {
          // Find default org or use first one
          const defaultOrg = data.organizations.find((o: Organization & { isDefault?: boolean }) => o.isDefault)
            || data.organizations[0];
          setOrganization(defaultOrg);
        }
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganization();
  }, []);

  const refreshOrganization = async () => {
    setIsLoading(true);
    await fetchOrganization();
  };

  return (
    <OrganizationContext.Provider value={{ organization, isLoading, refreshOrganization }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
