import React, { useState, useMemo } from 'react';
import { useProjects } from '../context/ProjectContext';
import { CheckSquare, Square, LayoutTemplate, Search, Plus, Calendar, PlaySquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { PBIProject, TaskStatus, ProjectTask } from '../types';

export const TasksPage: React.FC = () => {
  const { projects, updateProject } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pendiente' | 'en_curso' | 'completada'>('all');
  
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask & { projectId: string } | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskProjectId, setNewTaskProjectId] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  const handleStatusChange = (project: PBIProject, taskId: string, newStatus: TaskStatus) => {
    const newTasks = project.tasks.map(t => 
      t.id === taskId ? { ...t, status: newStatus, completed: newStatus === 'completada' } : t
    );
    updateProject(project.id, { tasks: newTasks });
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !newTaskProjectId) return;
    
    const project = projects.find(p => p.id === newTaskProjectId);
    if (!project) return;

    const newTask: ProjectTask = {
      id: crypto.randomUUID(),
      title: newTaskTitle,
      status: 'pendiente',
      completed: false,
      dueDate: newTaskDueDate || undefined,
    };

    updateProject(project.id, { tasks: [...project.tasks, newTask] });
    setIsAddingTask(false);
    setNewTaskTitle('');
    setNewTaskProjectId('');
    setNewTaskDueDate('');
  };

  const handleSaveEditTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editingTask.title || !editingTask.projectId) return;

    const project = projects.find(p => p.id === editingTask.projectId);
    if (!project) return;

    const newTasks = project.tasks.map(t => 
      t.id === editingTask.id ? { 
        ...t, 
        title: editingTask.title, 
        dueDate: editingTask.dueDate || undefined,
        status: editingTask.status,
        completed: editingTask.status === 'completada'
      } : t
    );

    updateProject(project.id, { tasks: newTasks });
    setEditingTask(null);
  };

  // flatten tasks
  const allTasks = useMemo(() => {
    return projects.flatMap(p => p.tasks.map(t => ({ 
      ...t, 
      project: p,
      // Normalize legacy tasks
      status: t.status || (t.completed ? 'completada' : 'pendiente')
    })));
  }, [projects]);

  const pendingCount = allTasks.filter(t => t.status === 'pendiente').length;
  const inProgressCount = allTasks.filter(t => t.status === 'en_curso').length;
  const completedCount = allTasks.filter(t => t.status === 'completada').length;

  const filteredTasks = useMemo(() => {
    return allTasks.filter(t => {
      if (filter !== 'all' && t.status !== filter) return false;
      
      const searchStr = `${t.title} ${t.project.projectName}`.toLowerCase();
      return searchStr.includes(searchQuery.toLowerCase());
    }).sort((a, b) => {
      // Completadas al final
      const aCompleted = a.status === 'completada';
      const bCompleted = b.status === 'completada';
      
      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;

      // Ordenar por fecha de vencimiento (ascendente)
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate) return -1; // Tareas con fecha primero
      if (b.dueDate) return 1;

      return 0;
    });
  }, [allTasks, filter, searchQuery]);





  return (
    <section className="projects-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Gestor de Tareas</h2>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', flexWrap: 'wrap' }}>
            <span style={{ color: '#ef4444', fontWeight: 600 }}>Pendientes: {pendingCount}</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>En Curso: {inProgressCount}</span>
            <span style={{ color: '#16a34a', fontWeight: 600 }}>Completadas: {completedCount}</span>
          </div>
        </div>
        <button className="btn-primary" onClick={() => setIsAddingTask(true)}>
          <Plus size={18} /> Nueva Tarea
        </button>
      </div>

      {isAddingTask && (
        <div style={{ backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--border-radius)', marginBottom: '1.5rem', boxShadow: 'var(--box-shadow)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Agregar Nueva Tarea</h3>
          <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Tarea</label>
                <input type="text" required value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Proyecto</label>
                <select required value={newTaskProjectId} onChange={e => setNewTaskProjectId(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  <option value="">Seleccione un proyecto...</option>
                  {projects.filter(p => !p.isArchived).map(p => (
                    <option key={p.id} value={p.id}>{p.projectName}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Fecha Límite (Opcional)</label>
              <input type="date" value={newTaskDueDate} onChange={e => setNewTaskDueDate(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={() => setIsAddingTask(false)}>Cancelar</button>
              <button type="submit" className="btn-primary">Guardar Tarea</button>
            </div>
          </form>
        </div>
      )}

      {editingTask && (
        <div style={{ backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--border-radius)', marginBottom: '1.5rem', boxShadow: 'var(--box-shadow)', borderLeft: '4px solid var(--primary-color)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Editar Tarea</h3>
          <form onSubmit={handleSaveEditTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Tarea</label>
                <input type="text" required value={editingTask.title} onChange={e => setEditingTask({...editingTask, title: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Proyecto</label>
                <select disabled value={editingTask.projectId} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
                  <option value={editingTask.projectId}>{projects.find(p => p.id === editingTask.projectId)?.projectName}</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Fecha Límite (Opcional)</label>
                <input type="date" value={editingTask.dueDate || ''} onChange={e => setEditingTask({...editingTask, dueDate: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Estado</label>
                <select value={editingTask.status} onChange={e => setEditingTask({...editingTask, status: e.target.value as TaskStatus})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  <option value="pendiente">Pendiente</option>
                  <option value="en_curso">En Curso</option>
                  <option value="completada">Completada</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={() => setEditingTask(null)}>Cancelar</button>
              <button type="submit" className="btn-primary">Guardar Cambios</button>
            </div>
          </form>
        </div>
      )}

      <div className="filters-container" style={{ padding: '0.75rem', marginBottom: '1rem', display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', gap: '1rem', alignItems: 'center', backgroundColor: 'var(--surface-color)', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input className="filter-input" style={{ paddingLeft: '2rem', width: '100%', margin: 0, border: 'none', backgroundColor: 'transparent' }} placeholder="Buscar tarea o proyecto..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }}></div>
        <div style={{ display: 'flex', gap: '0.25rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {(['all', 'pendiente', 'en_curso', 'completada'] as const).map(f => (
            <button key={f} className={filter === f ? 'btn-primary' : 'btn-secondary'} style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', border: filter === f ? 'none' : '1px solid transparent', backgroundColor: filter === f ? 'var(--primary-color)' : 'transparent', color: filter === f ? 'white' : 'var(--text-secondary)' }} onClick={() => setFilter(f)}>
              {f === 'all' ? 'Todas' : f === 'pendiente' ? 'Pendientes' : f === 'en_curso' ? 'En Curso' : 'Completadas'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filteredTasks.map(task => {
          return (
            <div key={`${task.project.id}-${task.id}`} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: task.status === 'completada' ? '#f8fafc' : 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)', opacity: task.status === 'completada' ? 0.7 : 1, flexWrap: 'wrap' }}>
              
              <div 
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '250px', cursor: 'pointer' }}
                onClick={() => setEditingTask({ ...task, projectId: task.project.id })}
                title="Clic para editar"
              >
                <button 
                  onClick={(e) => { e.stopPropagation(); handleStatusChange(task.project, task.id, task.status === 'pendiente' ? 'en_curso' : task.status === 'en_curso' ? 'completada' : 'pendiente'); }}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', color: task.status === 'completada' ? '#16a34a' : task.status === 'en_curso' ? '#3b82f6' : 'var(--text-secondary)' }}
                >
                  {task.status === 'completada' ? <CheckSquare size={20} /> : task.status === 'en_curso' ? <PlaySquare size={20} /> : <Square size={20} />}
                </button>
                <span style={{ fontSize: '0.85rem', fontWeight: 'normal', textDecoration: task.status === 'completada' ? 'line-through' : 'none', color: task.status === 'completada' ? 'var(--text-secondary)' : 'var(--text-primary)', lineHeight: '1.2' }}>
                  {task.title}
                </span>
              </div>

              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '200px', color: 'var(--text-secondary)' }}>
                <LayoutTemplate size={16} />
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{task.project.projectName}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ minWidth: '100px' }}>
                  {task.dueDate && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <Calendar size={14} />
                      {format(parseISO(task.dueDate), "d 'de' MMM", { locale: es })}
                    </div>
                  )}
                </div>
                
                <div style={{ minWidth: '110px' }}>
                  <select 
                    value={task.status} 
                    onChange={(e) => handleStatusChange(task.project, task.id, e.target.value as TaskStatus)}
                    style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: task.status === 'completada' ? '#dcfce7' : task.status === 'en_curso' ? '#dbeafe' : '#f1f5f9', cursor: 'pointer', outline: 'none', fontWeight: 600, color: task.status === 'completada' ? '#166534' : task.status === 'en_curso' ? '#1e40af' : '#475569', fontSize: '0.8rem' }}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en_curso">En Curso</option>
                    <option value="completada">Completada</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}
        {filteredTasks.length === 0 && <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', padding: '1rem' }}>No se encontraron tareas.</p>}
      </div>
    </section>
  );
};
