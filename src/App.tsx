import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { AdminPage } from "./components/AdminPage";
import { GalleryPage } from "./components/GalleryPage";
import { ProjectModal } from "./components/ProjectModal";
import { useProjects } from "./hooks/useProjects";
import { useSession } from "./hooks/useSession";

export function App() {
  const projectsState = useProjects();
  const sessionState = useSession();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <GalleryPage
            projectsState={projectsState}
            sessionState={sessionState}
            onOpenProject={(slug) => navigate(`/project/${slug}`)}
          />
        }
      />
      <Route
        path="/project/:slug"
        element={
          <ProjectRoute
            projectsState={projectsState}
            sessionState={sessionState}
            onClose={() => navigate("/")}
            onNavigateProject={(nextSlug) => navigate(`/project/${nextSlug}`)}
          />
        }
      />
      <Route
        path="/admin"
        element={<AdminPage projectsState={projectsState} sessionState={sessionState} />}
      />
      <Route path="*" element={<Navigate to="/" replace state={{ from: location }} />} />
    </Routes>
  );
}

function ProjectRoute({
  projectsState,
  sessionState,
  onClose,
  onNavigateProject
}: {
  projectsState: ReturnType<typeof useProjects>;
  sessionState: ReturnType<typeof useSession>;
  onClose: () => void;
  onNavigateProject: (slug: string) => void;
}) {
  const { slug } = useParams();
  const project = projectsState.projects.find((item) => item.slug === slug);

  return (
    <GalleryPage
      projectsState={projectsState}
      sessionState={sessionState}
      onOpenProject={() => undefined}
      overlay={
        <ProjectModal
          project={project}
          projects={projectsState.projects}
          isLoading={projectsState.status === "loading"}
          isAdmin={Boolean(sessionState.session?.isAdmin)}
          onClose={onClose}
          onNavigateProject={onNavigateProject}
        />
      }
    />
  );
}
