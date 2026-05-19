import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Application } from '../types';
import { mockApps } from '../data/mockApps';
import { v4 as uuidv4 } from 'uuid';

interface ApplicationContextType {
  apps: Application[];
  addApp: (app: Omit<Application, 'id'>) => void;
  updateApp: (id: string, updatedApp: Partial<Application>) => void;
  deleteApp: (id: string) => void;
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined);

export const ApplicationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apps, setApps] = useState<Application[]>(() => {
    const saved = localStorage.getItem('pbi-apps');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Error parsing apps from local storage', e);
      }
    }
    return mockApps;
  });


  useEffect(() => {
    localStorage.setItem('pbi-apps', JSON.stringify(apps));
  }, [apps]);

  const addApp = (appData: Omit<Application, 'id'>) => {
    const newApp: Application = {
      ...appData,
      id: uuidv4(),
    };
    setApps(prev => [...prev, newApp]);
  };

  const updateApp = (id: string, updatedApp: Partial<Application>) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, ...updatedApp } : a));
  };

  const deleteApp = (id: string) => {
    setApps(prev => prev.filter(a => a.id !== id));
  };

  return (
    <ApplicationContext.Provider value={{ apps, addApp, updateApp, deleteApp }}>
      {children}
    </ApplicationContext.Provider>
  );
};

export const useApps = () => {
  const context = useContext(ApplicationContext);
  if (context === undefined) {
    throw new Error('useApps must be used within an ApplicationProvider');
  }
  return context;
};
