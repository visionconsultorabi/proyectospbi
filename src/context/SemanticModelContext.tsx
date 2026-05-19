import React, { createContext, useContext, useState, useEffect } from 'react';
import type { SemanticModel } from '../types';
import { mockModels } from '../data/mockModels';
import { v4 as uuidv4 } from 'uuid';

interface SemanticModelContextType {
  models: SemanticModel[];
  addModel: (model: Omit<SemanticModel, 'id'>) => void;
  updateModel: (id: string, updatedModel: Partial<SemanticModel>) => void;
  deleteModel: (id: string) => void;
}

const SemanticModelContext = createContext<SemanticModelContextType | undefined>(undefined);

export const SemanticModelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [models, setModels] = useState<SemanticModel[]>(() => {
    const saved = localStorage.getItem('pbi-models');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Error parsing models from local storage', e);
      }
    }
    return mockModels;
  });


  useEffect(() => {
    localStorage.setItem('pbi-models', JSON.stringify(models));
  }, [models]);

  const addModel = (modelData: Omit<SemanticModel, 'id'>) => {
    const newModel: SemanticModel = {
      ...modelData,
      id: uuidv4(),
    };
    setModels(prev => [...prev, newModel]);
  };

  const updateModel = (id: string, updatedModel: Partial<SemanticModel>) => {
    setModels(prev => prev.map(m => m.id === id ? { ...m, ...updatedModel } : m));
  };

  const deleteModel = (id: string) => {
    setModels(prev => prev.filter(m => m.id !== id));
  };

  return (
    <SemanticModelContext.Provider value={{ models, addModel, updateModel, deleteModel }}>
      {children}
    </SemanticModelContext.Provider>
  );
};

export const useModels = () => {
  const context = useContext(SemanticModelContext);
  if (context === undefined) {
    throw new Error('useModels must be used within a SemanticModelProvider');
  }
  return context;
};
