import { useCallback, useEffect, useState } from "react";
import type { Project, ProjectsState } from "../types";
import { validateProjects } from "../utils/projects";

export function useProjects(): ProjectsState {
  const [projects, setProjects] = useState<Project[]>([]);
  const [status, setStatus] = useState<ProjectsState["status"]>("idle");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const response = await fetch("./content/projects.json", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("无法读取作品数据。");
      }
      const payload = await response.json();
      setProjects(validateProjects(payload));
      setStatus("ready");
    } catch (unknownError) {
      setStatus("error");
      setError(unknownError instanceof Error ? unknownError.message : "作品数据读取失败。");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { projects, status, error, refresh };
}
