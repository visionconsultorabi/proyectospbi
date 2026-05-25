import React, { useMemo, useState, useEffect } from 'react';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, Position } from '@xyflow/react';
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
  const [selectedModelId, setSelectedModelId] = useState<string>('');

  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: any[] = [];
    const edges: any[] = [];

    // Filter projects based on selected dropdowns
    let activeProjects = projects;
    if (selectedWorkspaceId) {
      activeProjects = activeProjects.filter(p => p.workspaceId === selectedWorkspaceId);
    }
    if (selectedModelId) {
      activeProjects = activeProjects.filter(p => p.semanticModelId === selectedModelId);
    }

    const isFiltering = selectedWorkspaceId !== '' || selectedModelId !== '';

    const workspaceIdsInUse = new Set(activeProjects.map(p => p.workspaceId));
    const modelIdsInUse = new Set(activeProjects.map(p => p.semanticModelId));
    const appIdsInUse = new Set(activeProjects.map(p => p.applicationId));

    const filteredWorkspaces = isFiltering ? workspaces.filter(w => workspaceIdsInUse.has(w.id)) : workspaces;
    const filteredModels = isFiltering ? models.filter(m => modelIdsInUse.has(m.id)) : models;
    const filteredApps = isFiltering ? apps.filter(a => appIdsInUse.has(a.id)) : apps;
    const filteredProjects = activeProjects;

    // Add Workspace Nodes (Column 1)
    filteredWorkspaces.forEach((w, index) => {
      nodes.push({
        id: `ws-${w.id}`,
        data: { label: `Área: ${w.name}` },
        position: { x: 50, y: index * 120 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        style: { background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', padding: '10px', width: 200 }
      });
    });

    // Add Semantic Model Nodes (Column 2)
    filteredModels.forEach((m, index) => {
      nodes.push({
        id: `mod-${m.id}`,
        data: { label: `Modelo: ${m.name}` },
        position: { x: 350, y: index * 120 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        style: { background: '#dbeafe', border: '1px solid #3b82f6', borderRadius: '8px', padding: '10px', width: 200 }
      });
    });

    // Add Project Nodes (Column 3)
    filteredProjects.forEach((p, index) => {
      nodes.push({
        id: `proj-${p.id}`,
        data: { label: `Proyecto: ${p.projectName}` },
        position: { x: 650, y: index * 100 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        style: { background: '#f3f4f6', border: '1px solid #6b7280', borderRadius: '8px', padding: '10px', width: 200 }
      });
    });

    // Add App Nodes (Column 4)
    filteredApps.forEach((a, index) => {
      nodes.push({
        id: `app-${a.id}`,
        data: { label: `App: ${a.name}` },
        position: { x: 950, y: index * 120 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        style: { background: '#dcfce7', border: '1px solid #22c55e', borderRadius: '8px', padding: '10px', width: 200 }
      });
    });

    // Draw Edges
    const workspaceModelPairs = new Set<string>();

    filteredProjects.forEach(p => {
      // 1. Edge: Workspace -> Model
      if (p.workspaceId && p.semanticModelId) {
        const pair = `${p.workspaceId}-${p.semanticModelId}`;
        if (!workspaceModelPairs.has(pair)) {
          workspaceModelPairs.add(pair);
          edges.push({
            id: `e-ws-mod-${pair}`,
            source: `ws-${p.workspaceId}`,
            target: `mod-${p.semanticModelId}`,
            animated: true,
            style: { stroke: '#f59e0b', strokeWidth: 2 }
          });
        }
      } else if (p.workspaceId && !p.semanticModelId) {
        // Fallback: Workspace -> Project directly if no model
        edges.push({
          id: `e-ws-proj-${p.workspaceId}-${p.id}`,
          source: `ws-${p.workspaceId}`,
          target: `proj-${p.id}`,
          animated: true,
          style: { stroke: '#f59e0b', strokeWidth: 2 }
        });
      }

      // 2. Edge: Model -> Project
      if (p.semanticModelId) {
        edges.push({
          id: `e-mod-proj-${p.semanticModelId}-${p.id}`,
          source: `mod-${p.semanticModelId}`,
          target: `proj-${p.id}`,
          animated: true,
          style: { stroke: '#3b82f6', strokeWidth: 2 }
        });
      }

      // 3. Edge: Project -> App
      if (p.applicationId) {
        edges.push({
          id: `e-proj-app-${p.id}-${p.applicationId}`,
          source: `proj-${p.id}`,
          target: `app-${p.applicationId}`,
          animated: true,
          style: { stroke: '#22c55e', strokeWidth: 2 }
        });
      }
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [projects, workspaces, models, apps, selectedWorkspaceId, selectedModelId]);

  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <section className="projects-section" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'nowrap', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Relaciones del Sistema</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Flujo de datos: Área de trabajo → Modelo Semántico → Proyecto → Aplicación.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'nowrap', alignItems: 'center' }}>
          <select 
            value={selectedWorkspaceId} 
            onChange={(e) => setSelectedWorkspaceId(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', minWidth: '180px' }}
          >
            <option value="">Todas las Áreas</option>
            {workspaces.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
          <select 
            value={selectedModelId} 
            onChange={(e) => setSelectedModelId(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', minWidth: '180px' }}
          >
            <option value="">Todos los Modelos</option>
            {models.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
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
