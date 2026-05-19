export type UpdateFrequency = 'diaria' | 'semanal' | 'mensual' | 'personalizada';
export type UpdateStatus = 'pendiente' | 'actualizado';
export type LicenseType = 'Pro' | 'Premium' | 'Gratuita';

export type TaskStatus = 'pendiente' | 'en_curso' | 'completada';

export interface ProjectTask {
  id: string;
  title: string;
  status?: TaskStatus;
  dueDate?: string; // YYYY-MM-DD
  completed: boolean; // kept for compatibility, prefer status going forward
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface SemanticModel {
  id: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface Application {
  id: string;
  name: string;
  platform?: string; // Ej. Power BI Service, Teams, etc.
  isActive?: boolean;
}


export interface UpdateHistoryEntry {
  id: string;
  date: string; // ISO string
  notes?: string;
}

export interface PBIUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  licenseType: LicenseType;
  creationDate?: string;
  validityDays?: number;
  expirationDate?: string; // Solo si es aplicable (YYYY-MM-DD)
  isActive?: boolean;
}

export interface PBIProject {
  id: string;
  workspaceId: string; // ID del Área de trabajo
  semanticModelId: string; // ID del modelo semántico
  applicationId: string; // ID de la aplicación
  projectName: string; // Nombre del proyecto (Informe)
  userIds: string[]; // IDs de los usuarios con los que se comparte
  updateFrequency: UpdateFrequency; // Frecuencia de actualización
  customUpdateDate?: string; // Fecha de actualización personalizada
  nextUpdateDate: string; // Fecha de próxima actualización (ISO string format YYYY-MM-DD)
  status: UpdateStatus; // Estado de la actualización
  updateHistory: UpdateHistoryEntry[]; // Historial de actualizaciones
  tasks: ProjectTask[]; // Tareas del proyecto
  link: string; // Link de acceso
  documentationLink?: string; // Link a documentación o carpeta del proyecto
  notes?: string; // Notas adicionales
  isArchived: boolean; // Si el proyecto está archivado
}


