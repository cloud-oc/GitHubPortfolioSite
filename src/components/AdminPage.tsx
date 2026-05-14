import { ArrowLeft, Github, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Project, ProjectInput, ProjectsState, SessionState } from "../types";
import { deleteProject, saveProject } from "../api/admin";
import { createEmptyInput, imageToObjectUrl, splitTags } from "../utils/projects";
import { MarkdownContent } from "./MarkdownContent";

type AdminPageProps = {
  projectsState: ProjectsState;
  sessionState: SessionState;
};

export function AdminPage({ projectsState, sessionState }: AdminPageProps) {
  const [params, setParams] = useSearchParams();
  const editSlug = params.get("edit") ?? "";
  const selectedProject = projectsState.projects.find((project) => project.slug === editSlug);
  const [draft, setDraft] = useState<ProjectInput>(createEmptyInput);
  const [tagText, setTagText] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "deleting">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!selectedProject) {
      setDraft(createEmptyInput());
      setTagText("");
      return;
    }
    setDraft(projectToInput(selectedProject));
    setTagText(selectedProject.tags.join(", "));
  }, [selectedProject]);

  const coverPreview = useMemo(() => imageToObjectUrl(draft.coverImage) || selectedProject?.coverImage || "", [draft.coverImage, selectedProject]);
  const heroPreview = useMemo(() => imageToObjectUrl(draft.heroImage) || selectedProject?.heroImage || "", [draft.heroImage, selectedProject]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");
    try {
      await saveProject({ ...draft, tags: splitTags(tagText) }, selectedProject?.slug);
      setMessage("作品已提交到 GitHub。Pages 重新部署后会显示最新内容。");
      await projectsState.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败。");
    } finally {
      setStatus("idle");
    }
  }

  async function handleDelete() {
    if (!selectedProject || !window.confirm(`确认删除「${selectedProject.title}」？`)) {
      return;
    }
    setStatus("deleting");
    setMessage("");
    try {
      await deleteProject(selectedProject.slug);
      setParams({});
      setMessage("作品已删除并提交到 GitHub。");
      await projectsState.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "删除失败。");
    } finally {
      setStatus("idle");
    }
  }

  const isBusy = status !== "idle";

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <Link className="text-button" to="/">
          <ArrowLeft size={18} />
          返回作品集
        </Link>
        <h1>作品管理</h1>
        <p>新增、编辑或删除作品。保存后由 Cloudflare Worker 写入 GitHub 仓库。</p>
      </header>

      {!sessionState.session?.isAdmin ? (
        <section className="admin-login-panel">
          <Github size={34} />
          <h2>管理员登录</h2>
          <p>使用 GitHub OAuth 验证管理员身份；仓库写入密钥只保存在 Worker 中。</p>
          <button className="primary-button" type="button" onClick={sessionState.login}>
            <Github size={19} />
            使用 GitHub 登录
          </button>
        </section>
      ) : (
        <section className="admin-layout">
          <aside className="project-list-panel" aria-label="作品列表">
            <button className="primary-button full-width" type="button" onClick={() => setParams({})}>
              <Plus size={18} />
              新增作品
            </button>
            <div className="admin-project-list">
              {projectsState.projects.map((project) => (
                <button
                  type="button"
                  key={project.id}
                  className={project.slug === selectedProject?.slug ? "is-selected" : ""}
                  onClick={() => setParams({ edit: project.slug })}
                >
                  <img src={project.coverImage} alt="" />
                  <span>
                    <strong>{project.title}</strong>
                    <small>{project.category} / {project.year}</small>
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <form className="project-form" onSubmit={(event) => void handleSubmit(event)}>
            <div className="form-grid">
              <label>
                作品名称
                <input required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
              </label>
              <label>
                副标题
                <input required value={draft.subtitle} onChange={(event) => setDraft({ ...draft, subtitle: event.target.value })} />
              </label>
              <label>
                角色 / 职责
                <input required value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value })} />
              </label>
              <label>
                年份
                <input required value={draft.year} onChange={(event) => setDraft({ ...draft, year: event.target.value })} />
              </label>
              <label>
                分类
                <input required value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} />
              </label>
              <label>
                标签
                <input value={tagText} placeholder="用英文逗号分隔" onChange={(event) => setTagText(event.target.value)} />
              </label>
            </div>

            <label>
              简介
              <textarea required rows={3} value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} />
            </label>

            <div className="asset-grid">
              <ImagePicker
                label="封面图"
                preview={coverPreview}
                required={!selectedProject}
                onChange={(file) => setDraft({ ...draft, coverImage: file })}
              />
              <ImagePicker
                label="明信片主图"
                preview={heroPreview}
                required={!selectedProject}
                onChange={(file) => setDraft({ ...draft, heroImage: file })}
              />
              <label className="file-card">
                <span>Markdown 插图</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => setDraft({ ...draft, galleryImages: Array.from(event.target.files ?? []) })}
                />
                <small>{draft.galleryImages.length ? `${draft.galleryImages.length} 张待上传` : "可选，多张图片"}</small>
              </label>
            </div>

            <div className="markdown-editor-grid">
              <label>
                背面 Markdown
                <textarea
                  required
                  rows={18}
                  value={draft.markdown}
                  onChange={(event) => setDraft({ ...draft, markdown: event.target.value })}
                />
              </label>
              <section className="markdown-preview" aria-label="Markdown 预览">
                <MarkdownContent markdown={draft.markdown || "## Markdown 预览\n\n保存前可以在这里检查排版。"} />
              </section>
            </div>

            {message && <p className="admin-message">{message}</p>}
            <div className="form-actions">
              {selectedProject && (
                <button className="danger-button" type="button" disabled={isBusy} onClick={() => void handleDelete()}>
                  {status === "deleting" ? <Loader2 className="spin" size={18} /> : <Trash2 size={18} />}
                  删除
                </button>
              )}
              <button className="primary-button" type="submit" disabled={isBusy}>
                {status === "saving" ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
                保存到 GitHub
              </button>
            </div>
          </form>
        </section>
      )}
    </main>
  );
}

function ImagePicker({
  label,
  preview,
  required,
  onChange
}: {
  label: string;
  preview: string;
  required: boolean;
  onChange: (file?: File) => void;
}) {
  return (
    <label className="file-card">
      <span>{label}</span>
      {preview ? <img src={preview} alt="" /> : <strong>选择图片</strong>}
      <input type="file" accept="image/*" required={required} onChange={(event) => onChange(event.target.files?.[0])} />
    </label>
  );
}

function projectToInput(project: Project): ProjectInput {
  return {
    title: project.title,
    subtitle: project.subtitle,
    role: project.role,
    year: project.year,
    category: project.category,
    tags: project.tags,
    summary: project.summary,
    markdown: project.markdown,
    galleryImages: []
  };
}
