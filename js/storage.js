import { DEFAULT_TOOLS } from "./tools.js";
import { normalizeTool, sortTools } from "./utils.js";

const TEAM_CATALOG_URL = "./script.json";

const STORAGE_KEYS = {
  tools: "devtools-hub:tools",
  prefs: "devtools-hub:prefs",
};

export function loadTools() {
  const raw = localStorage.getItem(STORAGE_KEYS.tools);
  if (!raw) {
    return DEFAULT_TOOLS.map((tool, index) => normalizeTool(tool, index));
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) {
      return [];
    }

    return sortTools(parsed.map((tool, index) => normalizeTool(tool, index)));
  } catch {
    return DEFAULT_TOOLS.map((tool, index) => normalizeTool(tool, index));
  }
}

export function saveTools(tools) {
  localStorage.setItem(STORAGE_KEYS.tools, JSON.stringify(tools));
}

export function loadPrefs() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.prefs) || "{}");
    return {
      selectedToolId: parsed.selectedToolId || null,
      collapsedCategories: Array.isArray(parsed.collapsedCategories) ? parsed.collapsedCategories : [],
      mobileSidebarOpen: Boolean(parsed.mobileSidebarOpen),
    };
  } catch {
    return {
      selectedToolId: null,
      collapsedCategories: [],
      mobileSidebarOpen: false,
    };
  }
}

export function savePrefs(prefs) {
  localStorage.setItem(STORAGE_KEYS.prefs, JSON.stringify(prefs));
}

export function downloadTools(tools) {
  const blob = new Blob([JSON.stringify(tools, null, 2)], { type: "application/json" });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);

  anchor.href = href;
  anchor.download = `devtools-hub-backup-${today}.json`;
  anchor.click();

  URL.revokeObjectURL(href);
}

export function parseImportedTools(rawText) {
  const parsed = JSON.parse(rawText);
  if (!Array.isArray(parsed)) {
    throw new Error("Formato inválido: esperado um array JSON.");
  }

  return sortTools(parsed.map((tool, index) => normalizeTool(tool, index)));
}

async function loadTeamCatalog() {
  const response = await fetch(TEAM_CATALOG_URL, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Catálogo remoto indisponível.");
  }

  const parsed = await response.json();
  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (Array.isArray(parsed?.tools)) {
    return parsed.tools;
  }

  throw new Error("Formato inválido do script.json.");
}

export async function syncToolsFromScript(localTools) {
  try {
    const teamToolsRaw = await loadTeamCatalog();
    const teamTools = sortTools(teamToolsRaw.map((tool, index) => normalizeTool(tool, index)));

    if (!teamTools.length) {
      return {
        tools: localTools,
        stats: { added: 0, updated: 0, addedTitles: [], updatedTitles: [] },
      };
    }

    const localMap = new Map(localTools.map((tool) => [tool.id, tool]));
    let added = 0;
    let updated = 0;
    const addedTitles = [];
    const updatedTitles = [];

    teamTools.forEach((teamTool, index) => {
      const localTool = localMap.get(teamTool.id);

      if (!localTool) {
        localMap.set(teamTool.id, {
          ...teamTool,
          order: localTools.length + index,
        });
        added += 1;
        addedTitles.push(teamTool.title);
        return;
      }

      const merged = {
        ...teamTool,
        favorite: localTool.favorite,
        openInNewTab: localTool.openInNewTab,
        order: localTool.order,
        createdAt: localTool.createdAt || teamTool.createdAt,
      };

      const hasChanged =
        merged.title !== localTool.title ||
        merged.url !== localTool.url ||
        merged.icon !== localTool.icon ||
        merged.description !== localTool.description ||
        merged.category !== localTool.category;

      if (hasChanged) {
        updated += 1;
        updatedTitles.push(merged.title);
      }

      localMap.set(teamTool.id, merged);
    });

    return {
      tools: sortTools([...localMap.values()]),
      stats: { added, updated, addedTitles, updatedTitles },
    };
  } catch {
    return {
      tools: localTools,
      stats: { added: 0, updated: 0, addedTitles: [], updatedTitles: [] },
    };
  }
}
