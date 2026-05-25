import { useState } from 'react';
import { useProjects } from './context/ProjectContext';
import { ProjectCard } from './components/ProjectCard';
import { ProjectFormModal } from './components/ProjectFormModal';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { UsersPage } from './components/UsersPage';
import { SemanticModelsPage } from './components/SemanticModelsPage';
import { ApplicationsPage } from './components/ApplicationsPage';
import { WorkspacesPage } from './components/WorkspacesPage';
import { TasksPage } from './components/TasksPage';
import { FlowGraphPage } from './components/FlowGraphPage';
import { generatePDFReport, generateWordReport } from './utils/reportGenerator';
import { useUsers } from './context/UserContext';
import { useModels } from './context/SemanticModelContext';
import { useApps } from './context/ApplicationContext';
import { useWorkspaces } from './context/WorkspaceContext';
import { PlusCircle, Calendar as CalendarIcon, LayoutDashboard, Users as UsersIcon, Database, Globe, Briefcase, CheckSquare, RotateCcw, Network, FileText, FileDown } from 'lucide-react';

const MOTIVATIONAL_QUOTES = [
  "El trabajo en equipo divide la tarea y multiplica el éxito.",
  "La buena planificación es la mitad de la batalla ganada.",
  "Los grandes proyectos no se logran con la fuerza, sino con perseverancia.",
  "El conflicto es una oportunidad para aprender a entender nuestras diferencias.",
  "Visión sin acción es solo un sueño. Acción sin visión es pasar el tiempo.",
  "La organización no es sobre perfección, es sobre eficiencia.",
  "El éxito en un proyecto es la suma de pequeños esfuerzos repetidos día tras día."
];

const getDailyQuote = () => {
  const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
  return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
};

import type { PBIProject } from './types';
import { isBefore, isToday, isTomorrow, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';

function App() {
  const { projects, addProject, updateProject, deleteProject, archiveProject, markAsUpdated } = useProjects();
  const { users } = useUsers();
  const { models } = useModels();
  const { apps } = useApps();
  const { workspaces } = useWorkspaces();
  
  const [currentTab, setCurrentTab] = useState<'projects' | 'users' | 'models' | 'apps' | 'workspaces' | 'tasks' | 'relations'>('tasks');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<PBIProject | null>(null);
  const [editingProject, setEditingProject] = useState<PBIProject | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWorkspace, setFilterWorkspace] = useState('');
  const [filterModel, setFilterModel] = useState('');
  const [filterApp, setFilterApp] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterFreq, setFilterFreq] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // Filter projects for the Agenda
  const urgentProjects = projects.filter(p => 
    p.nextUpdateDate &&
    (isBefore(parseISO(p.nextUpdateDate), new Date()) || isToday(parseISO(p.nextUpdateDate))) &&
    p.status === 'pendiente'
  );

  const recentlyUpdated = projects.filter(p => 
    p.status === 'actualizado' && 
    p.updateHistory.length > 0 &&
    isToday(parseISO(p.updateHistory[p.updateHistory.length - 1].date))
  );

  // Get all pending tasks
  const pendingTasks = projects.flatMap(p => 
    p.tasks.filter(t => !t.completed).map(t => ({ ...t, projectName: p.projectName, projectId: p.id }))
  );

  // Expiring licenses (today or tomorrow)
  const expiringLicenses = users.filter(u => {
    if (!u.expirationDate || u.isActive === false) return false;
    const expDate = parseISO(u.expirationDate);
    return isToday(expDate) || isTomorrow(expDate);
  });

  const filteredProjects = projects.filter(p => {
    // Archived logic (defaults to false if undefined)
    const isArchived = !!p.isArchived;
    if (showArchived ? !isArchived : isArchived) return false;

    const workspace = workspaces.find(w => w.id === p.workspaceId);
    const matchSearch = p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (workspace?.name.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    const matchWorkspace = filterWorkspace ? p.workspaceId === filterWorkspace : true;
    const matchModel = filterModel ? p.semanticModelId === filterModel : true;
    const matchApp = filterApp ? p.applicationId === filterApp : true;
    const matchUser = filterUser ? p.userIds?.includes(filterUser) : true;
    const matchFreq = filterFreq ? p.updateFrequency === filterFreq : true;
    
    return matchSearch && matchWorkspace && matchModel && matchApp && matchUser && matchFreq;
  });

  const handleSaveProject = (projectData: any, id?: string) => {
    if (id) {
      updateProject(id, projectData);
    } else {
      addProject(projectData);
    }
  };

  const handleEdit = (project: PBIProject) => {
    setSelectedProject(null);
    setEditingProject(project);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingProject(null);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterWorkspace('');
    setFilterModel('');
    setFilterApp('');
    setFilterUser('');
    setFilterFreq('');
  };

  const renderContent = () => {

    switch (currentTab) {
      case 'users': return <UsersPage />;
      case 'models': return <SemanticModelsPage />;
      case 'apps': return <ApplicationsPage />;
      case 'workspaces': return <WorkspacesPage />;
      case 'relations': return <FlowGraphPage />;
      case 'projects': {
        const activeCount = projects.filter(p => !p.isArchived).length;
        const archivedCount = projects.filter(p => p.isArchived).length;
        
        return (
        <section className="projects-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Gestión de Proyectos</h2>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
                <span style={{ color: '#16a34a', fontWeight: 600 }}>Activos: {activeCount}</span>
                <span style={{ color: '#ef4444', fontWeight: 600 }}>Archivados: {archivedCount}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button className="btn-secondary" onClick={() => generatePDFReport({ projects, workspaces, models, apps, users })} title="Exportar a PDF">
                <FileText size={16} color="#e11d48" /> PDF
              </button>
              <button className="btn-secondary" onClick={() => generateWordReport({ projects, workspaces, models, apps, users })} title="Exportar a Word">
                <FileDown size={16} color="#2563eb" /> Word
              </button>
              <button className="btn-primary" onClick={() => { setEditingProject(null); setIsFormOpen(true); }}>
                <PlusCircle size={18} /> Nuevo Proyecto
              </button>
            </div>
          </div>

          <div className="filters-container">
            <div className="filters-row">
              <select className="filter-select" value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
                <option value="">Todos los Usuarios</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
              </select>

              <select className="filter-select" value={filterWorkspace} onChange={(e) => setFilterWorkspace(e.target.value)}>
                <option value="">Todas las Áreas</option>
                {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>

              <select className="filter-select" value={filterModel} onChange={(e) => setFilterModel(e.target.value)}>
                <option value="">Todos los Modelos</option>
                {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>

              <select className="filter-select" value={filterApp} onChange={(e) => setFilterApp(e.target.value)}>
                <option value="">Todas las Apps</option>
                {apps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            
            <div className="filters-row">
              <input 
                type="text" 
                className="filter-input" 
                placeholder="Buscar por nombre o área..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <select className="filter-select" value={filterFreq} onChange={(e) => setFilterFreq(e.target.value)}>
                <option value="">Cualquier Frecuencia</option>
                <option value="diaria">Diaria</option>
                <option value="semanal">Semanal</option>
                <option value="mensual">Mensual</option>
                <option value="personalizada">Personalizada</option>
              </select>

              <button 
                className="filter-select btn-secondary" 
                style={{ flex: 'none', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                onClick={handleClearFilters}
              >
                <RotateCcw size={16} />
                Limpiar Filtros
              </button>

              <button 
                className={`filter-select ${showArchived ? 'btn-primary' : 'btn-secondary'}`} 
                style={{ flex: 'none', padding: '0.5rem 1rem' }}
                onClick={() => setShowArchived(!showArchived)}
              >
                {showArchived ? 'Ocultar Archivados' : 'Ver Archivados'}
              </button>
            </div>
          </div>

          <div className="projects-grid">
            {filteredProjects.map(project => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onClick={() => setSelectedProject(project)} 
              />
            ))}
          </div>
        </section>
        );
      }
      case 'tasks':
      default: return (
        <main className="dashboard">
          <aside className="agenda-section">
            <div style={{ marginBottom: '1.5rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--accent-color)' }}>
              <h2 style={{ marginBottom: '0.25rem', borderBottom: 'none', paddingBottom: 0 }}>
                <CalendarIcon size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
                Agenda de Hoy
              </h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {format(new Date(), "EEEE, d 'de' MMMM", { locale: es }).replace(/^\w/, (c) => c.toUpperCase())}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f0fdf4', borderLeft: '4px solid #22c55e', borderRadius: '4px' }}>
              <div style={{ fontStyle: 'italic', color: '#166534', fontSize: '0.9rem' }}>
                "{getDailyQuote()}"
              </div>
            </div>

            {expiringLicenses.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.85rem', color: '#f59e0b', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  ⚠ Licencias por Vencer
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {expiringLicenses.map(u => (
                    <div key={u.id} style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', padding: '0.75rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#92400e' }}>{u.firstName} {u.lastName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#92400e' }}>
                        {u.email.toLowerCase()} · Vence: {format(parseISO(u.expirationDate!), "dd 'de' MMMM", { locale: es })}
                        {isToday(parseISO(u.expirationDate!)) ? ' ⚠ HOY' : ' (mañana)'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {urgentProjects.length === 0 && recentlyUpdated.length === 0 && pendingTasks.length === 0 && expiringLicenses.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                No hay proyectos pendientes para actualizar hoy. ¡Todo al día!
              </p>
            ) : null}

            {urgentProjects.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.85rem', color: '#ef4444', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Requieren Actualización
                </h3>
                {urgentProjects.map(project => {
                  const ws = workspaces.find(w => w.id === project.workspaceId);
                  return (
                    <div key={project.id} className="agenda-item today" onClick={() => setSelectedProject(project)} style={{ cursor: 'pointer' }}>
                      <div className="agenda-item-title">{project.projectName}</div>
                      <div className="agenda-item-meta" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                        <span>{ws?.name || 'Área desconocida'} • {project.updateFrequency}</span>
                        {project.nextUpdateDate && (
                          <span style={{ fontWeight: 600 }}>
                            {format(parseISO(project.nextUpdateDate), 'dd MMM', { locale: es })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {pendingTasks.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.85rem', color: 'var(--primary-hover)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckSquare size={14} />
                  Tareas Pendientes
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {pendingTasks.map(task => (
                    <div 
                      key={task.id} 
                      className="agenda-item" 
                      style={{ 
                        backgroundColor: 'var(--surface-color)', 
                        borderLeft: '4px solid var(--primary-color)',
                        padding: '0.75rem',
                        cursor: 'pointer'
                      }}
                      onClick={() => setSelectedProject(projects.find(p => p.id === task.projectId) || null)}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{task.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Proyecto: {task.projectName}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recentlyUpdated.length > 0 && (
              <div>
                <h3 style={{ fontSize: '0.85rem', color: '#16a34a', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Actualizados Hoy
                </h3>
                {recentlyUpdated.map(project => (
                  <div key={project.id} className="agenda-item updated" onClick={() => setSelectedProject(project)} style={{ cursor: 'pointer' }}>
                    <div className="agenda-item-title">{project.projectName}</div>
                    <div className="agenda-item-meta">
                      Completado a las {format(parseISO(project.updateHistory[project.updateHistory.length - 1].date), 'HH:mm')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>

          <TasksPage />
        </main>
      );
    }
  };

  return (
    <div className="app-container">
      <header className="header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', alignItems: 'center' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="pbi-logo">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="18" width="6" height="10" rx="1" fill="#F2C811"/>
                <rect x="13" y="10" width="6" height="18" rx="1" fill="#F2C811"/>
                <rect x="22" y="4" width="6" height="24" rx="1" fill="#F2C811"/>
              </svg>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Gestor PBI</h1>
          </div>
        </div>


        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', marginLeft: 'auto' }}>
          <nav style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button 
              className={currentTab === 'tasks' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setCurrentTab('tasks')}
            >
              <CheckSquare size={16} /> Tareas
            </button>
            <button 
              className={currentTab === 'projects' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setCurrentTab('projects')}
            >
              <LayoutDashboard size={16} /> Proyectos
            </button>
            <button 
              className={currentTab === 'users' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setCurrentTab('users')}
            >
              <UsersIcon size={16} /> Usuarios
            </button>
            <button 
              className={currentTab === 'workspaces' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setCurrentTab('workspaces')}
            >
              <Briefcase size={16} /> Áreas
            </button>
            <button 
              className={currentTab === 'models' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setCurrentTab('models')}
            >
              <Database size={16} /> Modelos
            </button>
            <button 
              className={currentTab === 'apps' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setCurrentTab('apps')}
            >
              <Globe size={16} /> Apps
            </button>
            <button 
              className={currentTab === 'relations' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setCurrentTab('relations')}
            >
              <Network size={16} /> Relaciones
            </button>
          </nav>
        </div>
      </header>


      {renderContent()}

      <ProjectFormModal 
        isOpen={isFormOpen} 
        onClose={handleCloseForm} 
        onSave={handleSaveProject} 
        initialData={editingProject}
      />

      <ProjectDetailModal 
        project={selectedProject} 
        isOpen={!!selectedProject} 
        onClose={() => setSelectedProject(null)} 
        onMarkUpdated={markAsUpdated}
        onEdit={handleEdit}
        onArchive={archiveProject}
        onDelete={deleteProject}
      />
    </div>
  );
}

export default App;


