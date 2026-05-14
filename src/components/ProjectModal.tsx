import { ArrowLeft, ChevronLeft, ChevronRight, Edit3, RotateCcw, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import type { Project } from "../types";
import { useCardTilt } from "../hooks/useCardTilt";
import { MarkdownContent } from "./MarkdownContent";

type ProjectModalProps = {
  project?: Project;
  projects: Project[];
  isLoading: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onNavigateProject: (slug: string) => void;
};

export function ProjectModal({ project, projects, isLoading, isAdmin, onClose, onNavigateProject }: ProjectModalProps) {
  const [isBack, setIsBack] = useState(false);
  const tilt = useCardTilt(12);
  const currentIndex = useMemo(
    () => (project ? projects.findIndex((item) => item.slug === project.slug) : -1),
    [project, projects]
  );
  const total = projects.length;
  const canPage = total > 1 && currentIndex >= 0;
  const previousProject = canPage ? projects[(currentIndex - 1 + total) % total] : undefined;
  const nextProject = canPage ? projects[(currentIndex + 1) % total] : undefined;

  useEffect(() => {
    setIsBack(false);
  }, [project?.slug]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!canPage) {
        return;
      }
      if (event.key === "ArrowLeft" && previousProject) {
        onNavigateProject(previousProject.slug);
      }
      if (event.key === "ArrowRight" && nextProject) {
        onNavigateProject(nextProject.slug);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canPage, nextProject, onNavigateProject, previousProject]);

  if (isLoading) {
    return (
      <div className="modal-layer">
        <p className="modal-state">正在展开明信片...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="modal-layer">
        <div className="modal-state">
          <p>找不到这个作品。</p>
          <button type="button" className="text-button" onClick={onClose}>
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-layer">
      <button className="modal-close" type="button" aria-label="关闭作品" onClick={onClose}>
        <X size={28} />
      </button>
      {isAdmin && (
        <Link className="modal-edit" to={`/admin?edit=${encodeURIComponent(project.slug)}`} aria-label="编辑作品">
          <Edit3 size={20} />
        </Link>
      )}

      {previousProject && (
        <button
          className="modal-page-button modal-page-prev"
          type="button"
          aria-label="上一个作品"
          onClick={() => onNavigateProject(previousProject.slug)}
        >
          <ChevronLeft size={30} />
        </button>
      )}
      {nextProject && (
        <button
          className="modal-page-button modal-page-next"
          type="button"
          aria-label="下一个作品"
          onClick={() => onNavigateProject(nextProject.slug)}
        >
          <ChevronRight size={30} />
        </button>
      )}

      <article
        className={`postcard-stage ${tilt.isActive ? "is-active" : ""}`}
        style={tilt.style}
        {...tilt.handlers}
        aria-label={`${project.title} 明信片`}
      >
        <div className={`postcard ${isBack ? "is-flipped" : ""}`}>
          <section className="postcard-face postcard-front">
            <div className="postcard-image-frame">
              <img src={project.heroImage} alt={project.title} />
            </div>
            <div className="postcard-caption">
              <div>
                <p className="postcard-kicker">{project.category} / {project.year}</p>
                <h1>{project.title}</h1>
                <p>{project.subtitle}</p>
              </div>
              <div className="postcard-signature" aria-label="作品信息">
                <span>{project.role}</span>
                <small>{project.tags.join(" · ")}</small>
              </div>
            </div>
          </section>

          <section className="postcard-face postcard-back">
            <div className="postcard-back-head">
              <button type="button" className="ghost-icon-button" onClick={() => setIsBack(false)} aria-label="回到正面">
                <ArrowLeft size={20} />
              </button>
              <div>
                <p className="postcard-kicker">{project.role}</p>
                <h2>{project.title}</h2>
              </div>
            </div>
            <MarkdownContent markdown={project.markdown} />
          </section>
          <button
            className="postcard-flip"
            type="button"
            aria-label={isBack ? "翻到正面" : "翻到背面"}
            onClick={() => setIsBack((value) => !value)}
          >
            <RotateCcw size={24} />
          </button>
        </div>
      </article>
      {currentIndex >= 0 && (
        <div className="postcard-progress" aria-label="作品目录进度">
          {String(currentIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </div>
      )}
    </div>
  );
}
