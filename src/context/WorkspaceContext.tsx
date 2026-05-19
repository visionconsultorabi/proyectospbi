import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Workspace } from '../types';
import { mockWorkspaces } from '../data/mockWorkspaces';
import { v4 as uuidv4 } from 'uuid';

interface WorkspaceContextType {
  workspaces: Workspace[];
  addWorkspace: (workspace: Omit<Workspace, 'id'>) => void;
  updateWorkspace: (id: string, updatedWorkspace: Partial<Workspace>) => void;
  deleteWorkspace: (id: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    const saved = localStorage.getItem('pbi-workspaces');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Error parsing workspaces from local storage', e);
      }
    }
    return mockWorkspaces;
  });

  useEffect(() => {
    localStorage.setItem('pbi-workspaces', JSON.stringify(workspaces));
  }, [workspaces]);

  const addWorkspace = (workspaceData: Omit<Workspace, 'id'>) => {
    const newWorkspace: Workspace = {
      ...workspaceData,
      id: uuidv4(),
    };
    setWorkspaces(prev => [...prev, newWorkspace]);
  };

  const updateWorkspace = (id: string, updatedWorkspace: Partial<Workspace>) => {
    setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, ...updatedWorkspace } : w));
  };

  const deleteWorkspace = (id: string) => {
    setWorkspaces(prev => prev.filter(w => w.id !== id));
  };

  return (
    <WorkspaceContext.Provider value={{ workspaces, addWorkspace, updateWorkspace, deleteWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspaces = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspaces must be used within a WorkspaceProvider');
  }
  return context;
};
