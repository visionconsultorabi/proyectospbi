import React from 'react';
import type { PBIProject } from '../types';
import { ExternalLink, Calendar, Users, RefreshCw, LayoutTemplate, CheckSquare } from 'lucide-react';
import { format, isBefore, isToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useUsers } from '../context/UserContext';
import { useModels } from '../context/SemanticModelContext';
import { useWorkspaces } from '../context/WorkspaceContext';

interface ProjectCardProps {
  project: PBIProject;
  onClick: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  const { users } = useUsers();
  const { models } = useModels();
  const { workspaces } = useWorkspaces();
  
  const isUrgent = project.nextUpdateDate 
    ? (isBefore(parseISO(project.nextUpdateDate), new Date()) || isToday(parseISO(project.nextUpdateDate))) && project.status === 'pendiente'
    : false;
  
  const projectUsers = users.filter(u => project.userIds?.includes(u.id));
  const userNames = projectUsers.length > 0 
    ? projectUsers.map(u => `${u.firstName} ${u.lastName}`).join(', ') 
    : 'Sin usuarios';

  const model = models.find(m => m.id === project.semanticModelId);
  const workspace = workspaces.find(w => w.id === project.workspaceId);

  const completedTasks = project.tasks?.filter(t => t.completed).length || 0;
  const totalTasks = project.tasks?.length || 0;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const hasOverdueTasks = isUrgent || project.tasks?.some(t => {
    if (t.completed || t.status === 'completada') return false;
    return t.dueDate ? isBefore(parseISO(t.dueDate), new Date()) : false;
  });

  return (
    <div className={`project-card ${project.isArchived ? 'archived' : ''} ${isUrgent ? 'card-urgent' : ''}`} onClick={onClick} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'stretch' }}>
      
      {/* Fila 1: Cabecera y Estado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, paddingRight: '1rem' }}>
          <div className="project-workspace">{workspace?.name || 'Área desconocida'}</div>
          <h3 className="project-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            {project.projectName}
            {project.isArchived && <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>(Archivado)</span>}
          </h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem', maxWidth: '50%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {hasOverdueTasks && (
              <span className="status-badge status-pendiente" style={{ fontSize: '0.65rem' }}>
                Pendiente
              </span>
            )}
            <a 
              href={project.link} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-link"
              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', margin: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={14} /> App
            </a>
          </div>
          {project.notes && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'right', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {project.notes}
            </div>
          )}
        </div>
      </div>
      
      {/* Fila 2: Detalles (Modelo, Frecuencia, Próxima) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', padding: '0.75rem 0', borderTop: '1px dashed var(--border-color)', borderBottom: '1px dashed var(--border-color)' }}>
        <div className="detail-row" style={{ fontSize: '0.8rem' }}>
          <LayoutTemplate size={14} />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{model?.name || 'No asignado'}</span>
        </div>
        <div className="detail-row" style={{ fontSize: '0.8rem' }}>
          <RefreshCw size={14} />
          <span>{project.updateFrequency}</span>
        </div>
        <div className="detail-row" style={{ fontSize: '0.8rem' }}>
          <Calendar size={14} color={isUrgent ? '#ef4444' : undefined} />
          {project.nextUpdateDate ? (
            <span style={{ color: isUrgent ? '#ef4444' : undefined, fontWeight: isUrgent ? '600' : 'normal' }}>
              {format(parseISO(project.nextUpdateDate), 'dd MMM yyyy', { locale: es })}
            </span>
          ) : (
            <span style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>Sin fecha</span>
          )}
        </div>
      </div>

      {/* Fila 3: Tareas y Usuarios */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', overflow: 'hidden' }}>
          <Users size={14} style={{ flexShrink: 0 }} />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {userNames}
          </span>
        </div>
        
        <div style={{ width: '150px', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '4px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CheckSquare size={12}/> Tareas</span>
            <span>{completedTasks} / {totalTasks}</span>
          </div>
          <div style={{ height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', backgroundColor: progress === 100 ? '#16a34a' : 'var(--primary-color)', width: `${progress}%`, transition: 'width 0.3s ease' }}></div>
          </div>
        </div>
      </div>

    </div>
  );
};


