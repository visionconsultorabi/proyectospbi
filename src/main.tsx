import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App.tsx'
import { ProjectProvider } from './context/ProjectContext.tsx'
import { UserProvider } from './context/UserContext.tsx'
import { SemanticModelProvider } from './context/SemanticModelContext.tsx'
import { ApplicationProvider } from './context/ApplicationContext.tsx'
import { WorkspaceProvider } from './context/WorkspaceContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserProvider>
      <SemanticModelProvider>
        <ApplicationProvider>
          <WorkspaceProvider>
            <ProjectProvider>
              <App />
            </ProjectProvider>
          </WorkspaceProvider>
        </ApplicationProvider>
      </SemanticModelProvider>
    </UserProvider>
  </StrictMode>,
)


