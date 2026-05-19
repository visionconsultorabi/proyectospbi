import React, { createContext, useContext, useState, useEffect } from 'react';
import type { PBIProject, UpdateHistoryEntry, ProjectTask } from '../types';
import { mockProjects } from '../data/mockData';
import { v4 as uuidv4 } from 'uuid';
import { addDays, addWeeks, addMonths, format, parseISO } from 'date-fns';

interface ProjectContextType {
  projects: PBIProject[];
  addProject: (project: Omit<PBIProject, 'id' | 'updateHistory' | 'status' | 'isArchived' | 'tasks'>) => void;
  updateProject: (id: string, updatedProject: Partial<PBIProject>) => void;
  deleteProject: (id: string) => void;
  archiveProject: (id: string, archiveStatus: boolean) => void;
  markAsUpdated: (id: string, notes?: string, nextCustomDate?: string) => void;
  addTask: (projectId: string, title: string, dueDate?: string) => void;
  toggleTask: (projectId: string, taskId: string) => void;
  removeTask: (projectId: string, taskId: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<PBIProject[]>(() => {
    const saved = localStorage.getItem('pbi-projects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
          // Migración: Asegurar que todos los proyectos tengan los campos necesarios
          return parsed.map((p: any) => ({
            ...p,
            userIds: p.userIds || [],
            isArchived: !!p.isArchived,
            tasks: p.tasks || [],
            workspaceId: p.workspaceId || p.workspace || '', // Migración de texto a ID (el usuario deberá re-asignar si no coincide)
            semanticModelId: p.semanticModelId || p.semanticModel || '',
            applicationId: p.applicationId || p.application || '',
          }));

      } catch (e) {
        console.error('Error parsing projects from local storage', e);
      }
    }
    return mockProjects;
  });

  useEffect(() => {
    localStorage.setItem('pbi-projects', JSON.stringify(projects));
  }, [projects]);

  // Automated checker to transition updated projects back to pending status when their scheduled update date has arrived or passed.
  useEffect(() => {
    const checkAndTransitionProjects = () => {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      setProjects(prev => {
        let changed = false;
        const updated = prev.map(p => {
          if (p.status === 'actualizado' && p.nextUpdateDate && p.nextUpdateDate <= todayStr) {
            changed = true;
            return { ...p, status: 'pendiente' as const };
          }
          return p;
        });
        return changed ? updated : prev;
      });
    };

    checkAndTransitionProjects();
    
    // Check every hour in case the app remains open past midnight
    const interval = setInterval(checkAndTransitionProjects, 1000 * 60 * 60);
    return () => clearInterval(interval);
  }, []);

  const addProject = (projectData: Omit<PBIProject, 'id' | 'updateHistory' | 'status' | 'isArchived' | 'tasks'>) => {
    // Determine the initial nextUpdateDate depending on the frequency type
    const nextUpdateDate = projectData.updateFrequency === 'personalizada'
      ? (projectData.customUpdateDate || '')
      : projectData.nextUpdateDate;

    const newProject: PBIProject = {
      ...projectData,
      nextUpdateDate,
      id: uuidv4(),
      status: 'pendiente',
      updateHistory: [],
      tasks: [],
      isArchived: false,
    };
    setProjects(prev => [...prev, newProject]);
  };

  const updateProject = (id: string, updatedProject: Partial<PBIProject>) => {
    setProjects(prev => prev.map(p => {
      if (p.id === id) {
        const merged = { ...p, ...updatedProject };
        // Recalculate nextUpdateDate if frequency or custom date changed
        if (updatedProject.updateFrequency !== undefined || updatedProject.customUpdateDate !== undefined || updatedProject.nextUpdateDate !== undefined) {
          merged.nextUpdateDate = merged.updateFrequency === 'personalizada'
            ? (merged.customUpdateDate || '')
            : (updatedProject.nextUpdateDate || merged.nextUpdateDate);
        }
        return merged;
      }
      return p;
    }));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const archiveProject = (id: string, archiveStatus: boolean) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, isArchived: archiveStatus } : p));
  };

  const markAsUpdated = (id: string, notes?: string, nextCustomDate?: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === id) {
        const historyEntry: UpdateHistoryEntry = {
          id: uuidv4(),
          date: new Date().toISOString(),
          notes: notes,
        };
        
        let nextDateStr = p.nextUpdateDate;
        let customDateStr = p.customUpdateDate;

        if (p.updateFrequency === 'personalizada') {
          if (nextCustomDate) {
            nextDateStr = nextCustomDate;
            customDateStr = nextCustomDate;
          } else {
            nextDateStr = '';
            customDateStr = '';
          }
        } else {
          // Calculate next update date based on frequency
          let nextDate = parseISO(p.nextUpdateDate);
          const today = new Date();
          
          // If the scheduled date is in the past, start from today
          const baseDate = nextDate < today ? today : nextDate;

          if (p.updateFrequency === 'diaria') {
            nextDate = addDays(baseDate, 1);
          } else if (p.updateFrequency === 'semanal') {
            nextDate = addWeeks(baseDate, 1);
          } else if (p.updateFrequency === 'mensual') {
            nextDate = addMonths(baseDate, 1);
          }
          nextDateStr = format(nextDate, 'yyyy-MM-dd');
        }

        return {
          ...p,
          status: 'actualizado',
          nextUpdateDate: nextDateStr,
          customUpdateDate: customDateStr,
          updateHistory: [...p.updateHistory, historyEntry],
        };
      }
      return p;
    }));
  };

  const addTask = (projectId: string, title: string, dueDate?: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const newTask: ProjectTask = {
          id: uuidv4(),
          title,
          status: 'pendiente',
          dueDate,
          completed: false
        };
        return { ...p, tasks: [...p.tasks, newTask] };
      }
      return p;
    }));
  };

  const toggleTask = (projectId: string, taskId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          tasks: p.tasks.map(t => {
            if (t.id === taskId) {
               const currentStatus = t.status || (t.completed ? 'completada' : 'pendiente');
               const nextStatus = currentStatus === 'pendiente' ? 'en_curso' : currentStatus === 'en_curso' ? 'completada' : 'pendiente';
               return { ...t, status: nextStatus, completed: nextStatus === 'completada' };
            }
            return t;
          })
        };
      }
      return p;
    }));
  };

  const removeTask = (projectId: string, taskId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          tasks: p.tasks.filter(t => t.id !== taskId)
        };
      }
      return p;
    }));
  };

  return (
    <ProjectContext.Provider value={{ 
      projects, addProject, updateProject, deleteProject, archiveProject, markAsUpdated,
      addTask, toggleTask, removeTask 
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};

