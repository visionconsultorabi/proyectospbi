import React, { createContext, useContext, useState, useEffect } from 'react';
import type { PBIUser } from '../types';
import { mockUsers } from '../data/mockUsers';
import { v4 as uuidv4 } from 'uuid';

interface UserContextType {
  users: PBIUser[];
  addUser: (user: Omit<PBIUser, 'id'>) => void;
  updateUser: (id: string, updatedUser: Partial<PBIUser>) => void;
  deleteUser: (id: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<PBIUser[]>(() => {
    const saved = localStorage.getItem('pbi-users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing users from local storage', e);
      }
    }
    return mockUsers;
  });

  useEffect(() => {
    localStorage.setItem('pbi-users', JSON.stringify(users));
  }, [users]);

  const addUser = (userData: Omit<PBIUser, 'id'>) => {
    const newUser: PBIUser = {
      ...userData,
      id: uuidv4(),
    };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (id: string, updatedUser: Partial<PBIUser>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updatedUser } : u));
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  return (
    <UserContext.Provider value={{ users, addUser, updateUser, deleteUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUsers = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUsers must be used within a UserProvider');
  }
  return context;
};
