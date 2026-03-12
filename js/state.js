import { normalizeTool, sortTools } from "./utils.js";

const state = {
  tools: [],
  query: "",
  selectedToolId: null,
  collapsedCategories: new Set(),
  mobileSidebarOpen: false,
};

const subscribers = new Set();

function emit() {
  const snapshot = getState();
  subscribers.forEach((listener) => listener(snapshot));
}

export function subscribe(listener) {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}

export function getState() {
  return {
    ...state,
    tools: [...state.tools],
    collapsedCategories: new Set(state.collapsedCategories),
  };
}

export function initializeState({ tools, selectedToolId, collapsedCategories, mobileSidebarOpen }) {
  state.tools = sortTools((tools || []).map((tool, index) => normalizeTool(tool, index)));
  state.selectedToolId =
    state.tools.some((tool) => tool.id === selectedToolId) ? selectedToolId : state.tools[0]?.id || null;
  state.collapsedCategories = new Set(collapsedCategories || []);
  state.mobileSidebarOpen = Boolean(mobileSidebarOpen);
  emit();
}

export function setQuery(value) {
  state.query = value.trimStart();
  emit();
}

export function selectTool(toolId) {
  if (state.selectedToolId === toolId) {
    return;
  }

  state.selectedToolId = toolId;
  emit();
}

export function setMobileSidebarOpen(isOpen) {
  state.mobileSidebarOpen = Boolean(isOpen);
  emit();
}

export function toggleCategory(categoryName) {
  if (state.collapsedCategories.has(categoryName)) {
    state.collapsedCategories.delete(categoryName);
  } else {
    state.collapsedCategories.add(categoryName);
  }

  emit();
}

export function upsertTool(rawTool) {
  const tool = normalizeTool(rawTool, state.tools.length);
  const index = state.tools.findIndex((entry) => entry.id === tool.id);

  if (index >= 0) {
    const oldTool = state.tools[index];
    state.tools[index] = {
      ...oldTool,
      ...tool,
      createdAt: oldTool.createdAt,
      order: oldTool.order,
    };
  } else {
    state.tools.push({
      ...tool,
      order: state.tools.length ? Math.max(...state.tools.map((item) => item.order)) + 1 : 0,
      createdAt: new Date().toISOString(),
    });
  }

  state.tools = sortTools(state.tools);
  state.selectedToolId = tool.id;
  emit();
}

export function deleteTool(toolId) {
  state.tools = state.tools.filter((tool) => tool.id !== toolId);

  if (state.selectedToolId === toolId) {
    state.selectedToolId = state.tools[0]?.id || null;
  }

  emit();
}

export function toggleFavorite(toolId) {
  state.tools = state.tools.map((tool) => {
    if (tool.id !== toolId) {
      return tool;
    }

    return {
      ...tool,
      favorite: !tool.favorite,
    };
  });

  state.tools = sortTools(state.tools);
  emit();
}

export function reorderToolsByIds(orderedIds) {
  const orderById = new Map(orderedIds.map((id, index) => [id, index]));

  state.tools = state.tools.map((tool, index) => ({
    ...tool,
    order: orderById.has(tool.id) ? orderById.get(tool.id) : index,
  }));

  state.tools = sortTools(state.tools);
  emit();
}

export function replaceTools(tools) {
  state.tools = sortTools((tools || []).map((tool, index) => normalizeTool(tool, index)));
  state.selectedToolId = state.tools[0]?.id || null;
  emit();
}

export function getToolById(toolId) {
  return state.tools.find((tool) => tool.id === toolId) || null;
}
