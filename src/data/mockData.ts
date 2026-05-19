import { v4 as uuidv4 } from 'uuid';
import type { PBIProject } from '../types';
import { format, addDays } from 'date-fns';
import { mockUsers } from './mockUsers';

const today = format(new Date(), 'yyyy-MM-dd');
const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

export const mockProjects: PBIProject[] = [
  {
    id: uuidv4(),
    workspaceId: 'w1',
    semanticModelId: 'm1',
    projectName: 'Consulta empleador',
    applicationId: 'a1',
    userIds: [mockUsers[0].id],
    updateFrequency: 'diaria',
    nextUpdateDate: today,
    status: 'pendiente',
    updateHistory: [],
    tasks: [
      { id: uuidv4(), title: 'Validar origen SQL', completed: true },
      { id: uuidv4(), title: 'Actualizar gateway', completed: false },
    ],
    link: 'https://app.powerbi.com/groups/me/apps/fake-link-1',
    notes: 'Requiere revisión previa de base de datos.',
    isArchived: false,
  },
  {
    id: uuidv4(),
    workspaceId: 'w1',
    semanticModelId: 'm1',
    projectName: 'Empleo Privado SIPA',
    applicationId: 'a1',
    userIds: [mockUsers[0].id],
    updateFrequency: 'mensual',
    nextUpdateDate: tomorrow,
    status: 'pendiente',
    updateHistory: [],
    tasks: [],
    link: 'https://app.powerbi.com/groups/me/apps/fake-link-2',
    isArchived: false,
  },
  {
    id: uuidv4(),
    workspaceId: 'w1',
    semanticModelId: 'm1',
    projectName: 'Observatorio de trabajo ene26',
    applicationId: 'a3',
    userIds: [mockUsers[0].id],
    updateFrequency: 'semanal',
    nextUpdateDate: today,
    status: 'actualizado',
    updateHistory: [
      { id: uuidv4(), date: new Date().toISOString(), notes: 'Actualización automática OK' }
    ],
    tasks: [],
    link: 'https://app.powerbi.com/groups/me/apps/fake-link-3',
    isArchived: false,
  },
  {
    id: uuidv4(),
    workspaceId: 'w2',
    semanticModelId: 'm2',
    projectName: 'Becas para compartir CM',
    applicationId: 'a2',
    userIds: [mockUsers[0].id],
    updateFrequency: 'semanal',
    nextUpdateDate: today,
    status: 'pendiente',
    updateHistory: [],
    tasks: [],
    link: 'https://app.powerbi.com/groups/me/apps/fake-link-4',
    isArchived: false,
  }

];

