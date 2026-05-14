import { LogIn, LogOut, Plus, RefreshCcw, Settings, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import type { Project, ProjectsState, SessionState } from "../types";
import { SITE_TITLE } from "../config";
import { useMemo, useState } from "react";

type GalleryPageProps = {
  projectsState: ProjectsState;
  sessionState: SessionState;
  onOpenProject: (slug: string) => void;
  overlay?: React.ReactNode;
};

export function GalleryPage({ projectsState, sessionState, onOpenProject, overlay }: GalleryPageProps) {
  const [category, setCategory] = useState("全部分类");
  const [tag, setTag] = useState("全部标签");

  const categories = useMemo(
    () => ["全部分类", ...Array.from(new Set(projectsState.projects.map((project) => project.category))).sort()],
    [projectsState.projects]
  );
  const tags = useMemo(
    () => ["全部标签", ...Array.from(new Set(projectsState.projects.flatMap((project) => project.tags))).sort()],
    [projectsState.projects]
  );
  const filteredProjects = projectsState.projects.filter((project) => {
    const categoryMatch = category === "全部分类" || project.category === category;
    const tagMatch = tag === "全部标签" || project.tags.includes(tag);
    return categoryMatch && tagMatch;
  });

  return (
    <main className="app-shell">
      <header className="gallery-toolbar" aria-label="作品集工具栏">
        <div className="toolbar-title">
          <small>PROJECT ARCHIVE</small>
          <span>{SITE_TITLE}</span>
          <em>作品卡册</em>
        </div>

        <div className="toolbar-actions toolbar-actions-left">
          <label className="select-control">
            <SlidersHorizontal size={17} />
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="select-control">
            <select value={tag} onChange={(event) => setTag(event.target.value)}>
              {tags.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="toolbar-actions toolbar-actions-right">
          <button className="tool-button" type="button" aria-label="刷新作品" onClick={() => void projectsState.refresh()}>
            <RefreshCcw size={20} />
          </button>
          {sessionState.session?.isAdmin ? (
            <>
              <Link className="tool-button tool-button-link is-primary" to="/admin" aria-label="新增作品">
                <Plus size={24} />
              </Link>
              <button className="tool-button" type="button" aria-label="退出管理员" onClick={() => void sessionState.logout()}>
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <button className="tool-button" type="button" aria-label="管理员登录" onClick={sessionState.login}>
              <LogIn size={20} />
            </button>
          )}
          <Link className="tool-button tool-button-link" to="/admin" aria-label="设置">
            <Settings size={23} />
          </Link>
        </div>
      </header>

      <section className="gallery-grid" aria-live="polite">
        {projectsState.status === "loading" && <p className="state-text">作品载入中...</p>}
        {projectsState.status === "error" && <p className="state-text state-text-error">{projectsState.error}</p>}
        {projectsState.status === "ready" && filteredProjects.length === 0 && <p className="state-text">没有匹配的作品。</p>}
        {filteredProjects.map((project) => (
          <ProjectTile key={project.id} project={project} onOpen={() => onOpenProject(project.slug)} />
        ))}
      </section>
      {overlay}
    </main>
  );
}

function ProjectTile({ project, onOpen }: { project: Project; onOpen: () => void }) {
  return (
    <button className="project-tile" type="button" onClick={onOpen}>
      <span className="project-tile-media">
        <img src={project.coverImage} alt="" loading="lazy" />
      </span>
      <span className="project-tile-category">{project.category}</span>
      <span className="project-tile-meta">
        <strong>{project.title}</strong>
        <small>{project.role} / {project.year}</small>
      </span>
    </button>
  );
}
