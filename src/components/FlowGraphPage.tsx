import React, { useMemo, useState, useEffect } from 'react';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useProjects } from '../context/ProjectContext';
import { useWorkspaces } from '../context/WorkspaceContext';
import { useModels } from '../context/SemanticModelContext';
import { useApps } from '../context/ApplicationContext';

export const FlowGraphPage: React.FC = () => {
  const { projects } = useProjects();
  const { workspaces } = useWorkspaces();
  const { models } = useModels();
  const { apps } = useApps();

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');

  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: any[] = [];
    const edges: any[] = [];

    const filteredWorkspaces = selectedWorkspaceId 
      ? workspaces.filter(w => w.id === selectedWorkspaceId)
      : workspaces;
      
    const filteredProjects = selectedWorkspaceId
      ? projects.filter(p => p.workspaceId === selectedWorkspaceId)
      : projects;

    const modelIdsInUse = new Set(filteredProjects.map(p => p.semanticModelId));
    const appIdsInUse = new Set(filteredProjects.map(p => p.applicationId));

    const filteredModels = selectedWorkspaceId ? models.filter(m => modelIdsInUse.has(m.id)) : models;
    const filteredApps = selectedWorkspaceId ? apps.filter(a => appIdsInUse.has(a.id)) : apps;
    
    // Add Workspace Nodes
    filteredWorkspaces.forEach((w, index) => {
      nodes.push({
        id: `ws-${w.id}`,
        data: { label: `Área: ${w.name}` },
        position: { x: 50, y: index * 100 },
        style: { background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', padding: '10px' }
      });
    });

    // Add Semantic Model Nodes
    filteredModels.forEach((m, index) => {
      nodes.push({
        id: `mod-${m.id}`,
        data: { label: `Modelo: ${m.name}` },
        position: { x: 300, y: index * 100 },
        style: { background: '#dbeafe', border: '1px solid #3b82f6', borderRadius: '8px', padding: '10px' }
      });
    });

    // Add App Nodes
    filteredApps.forEach((a, index) => {
      nodes.push({
        id: `app-${a.id}`,
        data: { label: `App: ${a.name}` },
        position: { x: 800, y: index * 100 },
        style: { background: '#dcfce7', border: '1px solid #22c55e', borderRadius: '8px', padding: '10px' }
      });
    });

    // Add Project Nodes and their connections
    filteredProjects.forEach((p, index) => {
      const pId = `proj-${p.id}`;
      nodes.push({
        id: pId,
        data: { label: `Proyecto: ${p.projectName}` },
        position: { x: 550, y: index * 80 },
        style: { background: '#f3f4f6', border: '1px solid #6b7280', borderRadius: '8px', padding: '10px' }
      });

      // Edge from Workspace to Project
      if (p.workspaceId) {
        edges.push({
          id: `e-ws-${p.workspaceId}-${pId}`,
          source: `ws-${p.workspaceId}`,
          target: pId,
          animated: true,
          style: { stroke: '#f59e0b' }
        });
      }

      // Edge from Model to Project
      if (p.semanticModelId) {
        edges.push({
          id: `e-mod-${p.semanticModelId}-${pId}`,
          source: `mod-${p.semanticModelId}`,
          target: pId,
          animated: true,
          style: { stroke: '#3b82f6' }
        });
      }

      // Edge from Project to App
      if (p.applicationId) {
        edges.push({
          id: `e-${pId}-app-${p.applicationId}`,
          source: pId,
          target: `app-${p.applicationId}`,
          animated: true,
          style: { stroke: '#22c55e' }
        });
      }
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [projects, workspaces, models, apps, selectedWorkspaceId]);

  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <section className="projects-section" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Relaciones del Sistema</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Visualiza cómo se conectan las áreas de trabajo, modelos, proyectos y aplicaciones.</p>
        </div>
        <div>
          <select 
            value={selectedWorkspaceId} 
            onChange={(e) => setSelectedWorkspaceId(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', minWidth: '200px' }}
          >
            <option value="">Todas las Áreas</option>
            {workspaces.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div style={{ flex: 1, backgroundColor: 'var(--surface-color)', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          attributionPosition="bottom-right"
        >
          <MiniMap />
          <Controls />
          <Background color="#aaa" gap={16} />
        </ReactFlow>
      </div>
    </section>
  );
};
