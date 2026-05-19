import React, { useState } from 'react';
import type { PBIProject } from '../types';
import { X, ExternalLink, CheckCircle, Clock, History, Archive, Trash2, Plus, Trash, CheckSquare, Square } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useUsers } from '../context/UserContext';
import { useModels } from '../context/SemanticModelContext';
import { useApps } from '../context/ApplicationContext';
import { useWorkspaces } from '../context/WorkspaceContext';
import { useProjects } from '../context/ProjectContext';

interface ProjectDetailModalProps {
  project: PBIProject | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkUpdated: (id: string, notes: string, nextCustomDate?: string) => void;
  onEdit: (project: PBIProject) => void;
  onArchive: (id: string, archiveStatus: boolean) => void;
  onDelete: (id: string) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ project, isOpen, onClose, onMarkUpdated, onEdit, onArchive, onDelete }) => {
  const [updateNotes, setUpdateNotes] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [nextCustomUpdateDate, setNextCustomUpdateDate] = useState('');
  
  const { users } = useUsers();
  const { models } = useModels();
  const { apps } = useApps();
  const { workspaces } = useWorkspaces();
  const { addTask, toggleTask, removeTask } = useProjects();

  if (!isOpen || !project) return null;

  const handleUpdate = () => {
    onMarkUpdated(project.id, updateNotes, nextCustomUpdateDate);
    setUpdateNotes('');
    setNextCustomUpdateDate('');
    onClose();
  };

  const handleDelete = () => {
    if (confirm('¿Estás seguro de que deseas eliminar este proyecto de forma permanente?')) {
      onDelete(project.id);
      onClose();
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      addTask(project.id, newTaskTitle.trim(), newTaskDueDate || undefined);
      setNewTaskTitle('');
      setNewTaskDueDate('');
    }
  };

  const projectUsers = users.filter(u => project.userIds?.includes(u.id));
  const model = models.find(m => m.id === project.semanticModelId);
  const app = apps.find(a => a.id === project.applicationId);
  const workspace = workspaces.find(w => w.id === project.workspaceId);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ marginBottom: '4px' }}>{project.projectName} {project.isArchived && <span style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontStyle: 'italic' }}>(Archivado)</span>}</h2>
            <span className={`status-badge status-${project.status}`}>
              {project.status === 'pendiente' ? 'Actualización Pendiente' : 'Actualizado'}
            </span>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="modal-body" style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Área de Trabajo</p>
              <p style={{ fontWeight: 500 }}>{workspace?.name || 'Área desconocida'}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Modelo Semántico</p>

              <p style={{ fontWeight: 500 }}>{model?.name || 'No asignado'}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Aplicación Destino</p>
              <p style={{ fontWeight: 500 }}>{app?.name || 'No asignada'}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Usuarios Compartidos</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                {projectUsers.length > 0 
                  ? projectUsers.map(u => (
                      <span key={u.id} style={{ fontSize: '0.8rem', backgroundColor: 'var(--bg-color)', padding: '2px 8px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        {u.firstName} {u.lastName}
                      </span>
                    ))
                  : <span style={{ fontWeight: 500 }}>Ninguno</span>}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Frecuencia</p>
              <p style={{ fontWeight: 500, textTransform: 'capitalize' }}>{project.updateFrequency}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Próxima Actualización</p>
              {project.updateFrequency === 'personalizada' ? (
                project.customUpdateDate
                  ? <p style={{ fontWeight: 500 }}>{format(parseISO(project.customUpdateDate), 'dd MMMM yyyy', { locale: es })}</p>
                  : <p style={{ fontWeight: 500, color: 'var(--text-secondary)', fontStyle: 'italic' }}>Sin actualización programada</p>
              ) : (
                <p style={{ fontWeight: 500 }}>{format(parseISO(project.nextUpdateDate), 'dd MMMM yyyy', { locale: es })}</p>
              )}
            </div>

          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckSquare size={18} color="var(--primary-color)" />
              Tareas del Proyecto
            </h3>
            
            <form onSubmit={handleAddTask} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder="Nueva tarea..." 
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                style={{ flex: 1, minWidth: '200px' }}
              />
              <input 
                type="date" 
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }}
              />
              <button type="submit" className="btn-primary" style={{ padding: '0.5rem' }}>
                <Plus size={20} />
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {project.tasks.map(task => {
                const currentStatus = task.status || (task.completed ? 'completada' : 'pendiente');
                return (
                  <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', backgroundColor: currentStatus === 'completada' ? '#f8fafc' : 'var(--bg-color)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                      <button 
                        onClick={() => toggleTask(project.id, task.id)}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', color: currentStatus === 'completada' ? '#16a34a' : currentStatus === 'en_curso' ? '#3b82f6' : 'var(--text-secondary)' }}
                      >
                        {currentStatus === 'completada' ? <CheckSquare size={20} /> : currentStatus === 'en_curso' ? <Clock size={20} /> : <Square size={20} />}
                      </button>
                      <span style={{ fontSize: '0.9rem', textDecoration: currentStatus === 'completada' ? 'line-through' : 'none', color: currentStatus === 'completada' ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                        {task.title}
                      </span>
                    </div>
                    {task.dueDate && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {format(parseISO(task.dueDate), "d 'de' MMM", { locale: es })}
                      </span>
                    )}
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, padding: '2px 6px', borderRadius: '4px', backgroundColor: currentStatus === 'completada' ? '#dcfce7' : currentStatus === 'en_curso' ? '#dbeafe' : '#f1f5f9', color: currentStatus === 'completada' ? '#166534' : currentStatus === 'en_curso' ? '#1e40af' : '#475569' }}>
                      {currentStatus === 'completada' ? 'Completada' : currentStatus === 'en_curso' ? 'En Curso' : 'Pendiente'}
                    </span>
                  <button 
                    onClick={() => removeTask(project.id, task.id)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#ef4444', opacity: 0.6 }}
                  >
                    <Trash size={16} />
                  </button>
                </div>
                );
              })}
              {project.tasks.length === 0 && (
                <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  Sin tareas pendientes.
                </p>
              )}
            </div>
          </div>

          {project.documentationLink && (
            <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--primary-color)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Documentación / Carpeta</p>
              <a href={project.documentationLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', color: 'var(--primary-hover)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ExternalLink size={16} />
                Ver Documentos
              </a>
            </div>
          )}

          {project.notes && (
            <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: '8px' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Notas del Proyecto</p>
              <p style={{ fontSize: '0.9rem' }}>{project.notes}</p>
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={18} color="var(--secondary-color)" />
              Marcar como Actualizado
            </h3>
            {project.updateFrequency === 'personalizada' && (
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Próxima Fecha de Actualización (Opcional - dejar vacío si no hay programada)
                </label>
                <input 
                  type="date" 
                  value={nextCustomUpdateDate}
                  onChange={(e) => setNextCustomUpdateDate(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }}
                />
              </div>
            )}
            <div className="form-group">
              <input 
                type="text" 
                placeholder="Añadir notas sobre esta actualización (opcional)..." 
                value={updateNotes}
                onChange={(e) => setUpdateNotes(e.target.value)}
              />
            </div>
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleUpdate}>
              Confirmar Actualización de Hoy
            </button>
          </div>

          {project.updateHistory.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={18} color="var(--text-secondary)" />
                Historial de Actualizaciones
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {project.updateHistory.slice().reverse().map(history => (
                  <li key={history.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.9rem' }}>
                    <Clock size={16} color="var(--text-secondary)" style={{ marginTop: '2px' }} />
                    <div>
                      <span style={{ fontWeight: 500 }}>
                        {format(parseISO(history.date), 'dd MMM yyyy, HH:mm', { locale: es })}
                      </span>
                      {history.notes && <p style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{history.notes}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <a href={project.link} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
              <ExternalLink size={18} />
              Ir a Power BI
            </a>
            <button className="btn-secondary" onClick={() => onArchive(project.id, !project.isArchived)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Archive size={18} />
              {project.isArchived ? 'Desarchivar' : 'Archivar'}
            </button>
            <button className="btn-secondary" onClick={handleDelete} style={{ color: '#ef4444', borderColor: '#fecaca', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Trash2 size={18} />
              Eliminar
            </button>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn-secondary" onClick={() => onEdit(project)}>Editar Proyecto</button>
            <button className="btn-secondary" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

