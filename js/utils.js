export const DEFAULT_ICON = "🧰";

export function generateId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `tool_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function normalizeUrl(rawUrl) {
  const value = `${rawUrl || ""}`.trim();
  if (!value) {
    return "";
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `https://${value}`;
}

export function sortTools(tools) {
  return [...tools].sort((left, right) => {
    if (left.favorite !== right.favorite) {
      return left.favorite ? -1 : 1;
    }

    if (left.order !== right.order) {
      return left.order - right.order;
    }

    return left.title.localeCompare(right.title, "pt-BR");
  });
}

export function normalizeTool(rawTool, fallbackOrder = 0) {
  return {
    id: rawTool.id || generateId(),
    title: `${rawTool.title || "Sem título"}`.trim(),
    url: normalizeUrl(rawTool.url),
    icon: `${rawTool.icon || DEFAULT_ICON}`.trim() || DEFAULT_ICON,
    description: `${rawTool.description || ""}`.trim(),
    category: `${rawTool.category || "Dev Tools"}`.trim(),
    favorite: Boolean(rawTool.favorite),
    openInNewTab: Boolean(rawTool.openInNewTab),
    createdAt: rawTool.createdAt || new Date().toISOString(),
    order: Number.isFinite(rawTool.order) ? rawTool.order : fallbackOrder,
  };
}

export function uniqueCategories(tools) {
  const values = new Set(tools.map((tool) => tool.category).filter(Boolean));
  return [...values].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function byQuery(tool, query) {
  const text = `${tool.title} ${tool.category} ${tool.description}`.toLowerCase();
  return text.includes(query.trim().toLowerCase());
}
