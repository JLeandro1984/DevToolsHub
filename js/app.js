import {
  deleteTool,
  getState,
  getToolById,
  initializeState,
  reorderToolsByIds,
  replaceTools,
  selectTool,
  setMobileSidebarOpen,
  setQuery,
  subscribe,
  toggleCategory,
  toggleFavorite,
  upsertTool,
} from "./state.js";
import { downloadTools, loadPrefs, loadTools, parseImportedTools, savePrefs, saveTools, syncToolsFromScript } from "./storage.js";
import { setupSearch } from "./search.js";
import { createSidebar } from "./sidebar.js";
import { createWorkspace } from "./workspace.js";
import { createToolModal } from "./modal.js";
import { initializeNotifications, notify } from "./notifications.js";
import { initializeRouter, syncHash } from "./router.js";
import { uniqueCategories } from "./utils.js";

const elements = {
  appShell: document.getElementById("appShell"),
  sidebarContent: document.getElementById("sidebarContent"),
  searchInput: document.getElementById("searchInput"),
  newToolButton: document.getElementById("newToolButton"),
  importButton: document.getElementById("importButton"),
  exportButton: document.getElementById("exportButton"),
  importInput: document.getElementById("importInput"),
  sidebarToggle: document.getElementById("sidebarToggle"),
  workspaceFrame: document.getElementById("workspaceFrame"),
  workspaceLoader: document.getElementById("workspaceLoader"),
  workspaceEmpty: document.getElementById("workspaceEmpty"),
  workspaceBlocked: document.getElementById("workspaceBlocked"),
  workspaceBlockedOpenButton: document.getElementById("workspaceBlockedOpenButton"),
  workspaceQuickOpen: document.getElementById("workspaceQuickOpen"),
  workspaceQuickOpenButton: document.getElementById("workspaceQuickOpenButton"),
  activeToolTitle: document.getElementById("activeToolTitle"),
  activeToolMeta: document.getElementById("activeToolMeta"),
  openExternalButton: document.getElementById("openExternalButton"),
  reloadButton: document.getElementById("reloadButton"),
  toolModal: document.getElementById("toolModal"),
  closeModalButton: document.getElementById("closeModalButton"),
  cancelModalButton: document.getElementById("cancelModalButton"),
  toolForm: document.getElementById("toolForm"),
  toolModalTitle: document.getElementById("toolModalTitle"),
  categoryList: document.getElementById("categoryList"),
  toastStack: document.getElementById("toastStack"),
  fields: {
    id: document.getElementById("toolId"),
    title: document.getElementById("toolTitle"),
    url: document.getElementById("toolUrl"),
    description: document.getElementById("toolDescription"),
    icon: document.getElementById("toolIcon"),
    category: document.getElementById("toolCategory"),
    favorite: document.getElementById("toolFavorite"),
    openInNewTab: document.getElementById("toolOpenInNewTab"),
  },
};

initializeNotifications(elements.toastStack);

const sidebar = createSidebar({
  container: elements.sidebarContent,
  onSelect: (toolId) => {
    const tool = getToolById(toolId);
    if (!tool) {
      return;
    }

    selectTool(toolId);
    setMobileSidebarOpen(false);

    if (tool.openInNewTab) {
      window.open(tool.url, "_blank", "noopener,noreferrer");
      notify("Ferramenta configurada para abrir em nova aba", "success");
    }
  },
  onEdit: (toolId) => {
    const tool = getToolById(toolId);
    if (!tool) {
      return;
    }

    modal.openForEdit(tool, uniqueCategories(getState().tools));
  },
  onDelete: (toolId) => {
    const tool = getToolById(toolId);
    if (!tool) {
      return;
    }

    const confirmed = window.confirm(`Excluir a ferramenta "${tool.title}"?`);
    if (!confirmed) {
      return;
    }

    deleteTool(toolId);
    notify("Ferramenta removida", "warning");
  },
  onToggleFavorite: (toolId) => {
    toggleFavorite(toolId);
    notify("Alterações salvas", "success");
  },
  onOpenExternal: (toolId) => {
    const tool = getToolById(toolId);
    if (tool) {
      window.open(tool.url, "_blank", "noopener,noreferrer");
    }
  },
  onToggleCategory: (categoryName) => {
    toggleCategory(categoryName);
  },
  onReorder: (orderedVisibleIds) => {
    reorderToolsByIds(orderedVisibleIds);
    notify("Ordem das ferramentas atualizada", "success");
  },
});

const workspace = createWorkspace({
  frame: elements.workspaceFrame,
  loader: elements.workspaceLoader,
  empty: elements.workspaceEmpty,
  blocked: elements.workspaceBlocked,
  blockedOpenButton: elements.workspaceBlockedOpenButton,
  quickOpen: elements.workspaceQuickOpen,
  quickOpenButton: elements.workspaceQuickOpenButton,
  titleElement: elements.activeToolTitle,
  metaElement: elements.activeToolMeta,
  openExternalButton: elements.openExternalButton,
  reloadButton: elements.reloadButton,
  onRedirectToNewTab: (tool) => {
    if (!tool || tool.openInNewTab) {
      return;
    }

    upsertTool({
      ...tool,
      openInNewTab: true,
    });

    notify("Preferência salva: próximos acessos abrirão em nova aba", "success");
  },
});

const modal = createToolModal({
  modal: elements.toolModal,
  closeButton: elements.closeModalButton,
  cancelButton: elements.cancelModalButton,
  form: elements.toolForm,
  titleElement: elements.toolModalTitle,
  fields: elements.fields,
  categoryList: elements.categoryList,
  onSave: (toolData, context) => {
    upsertTool(toolData);
    notify(context?.isEditing ? "Alterações salvas" : "Ferramenta adicionada com sucesso", "success");
  },
});

setupSearch(elements.searchInput, (value) => {
  setQuery(value);
});

elements.newToolButton.addEventListener("click", () => {
  modal.openForCreate(uniqueCategories(getState().tools));
});

elements.exportButton.addEventListener("click", () => {
  downloadTools(getState().tools);
  notify("Backup exportado com sucesso", "success");
});

elements.importButton.addEventListener("click", () => {
  elements.importInput.click();
});

elements.importInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const importedTools = parseImportedTools(text);
    replaceTools(importedTools);
    notify("Ferramentas importadas com sucesso", "success");
  } catch (error) {
    notify(error.message || "Falha ao importar arquivo", "danger");
  } finally {
    elements.importInput.value = "";
  }
});

elements.sidebarToggle.addEventListener("click", () => {
  setMobileSidebarOpen(!getState().mobileSidebarOpen);
});

initializeRouter((toolId) => {
  if (getToolById(toolId)) {
    selectTool(toolId);
  }
});

subscribe((state) => {
  sidebar.render(state);
  workspace.render(getToolById(state.selectedToolId));

  saveTools(state.tools);
  savePrefs({
    selectedToolId: state.selectedToolId,
    collapsedCategories: [...state.collapsedCategories],
    mobileSidebarOpen: state.mobileSidebarOpen,
  });

  syncHash(state.selectedToolId);
  elements.appShell.classList.toggle("sidebar-open", state.mobileSidebarOpen);
});

async function bootstrap() {
  function summarizeTitles(titles) {
    if (!titles?.length) {
      return "";
    }

    const preview = titles.slice(0, 3).join(", ");
    const remaining = titles.length - 3;
    return remaining > 0 ? `${preview} +${remaining}` : preview;
  }

  const localTools = loadTools();
  const prefs = loadPrefs();
  const syncResult = await syncToolsFromScript(localTools);

  initializeState({
    tools: syncResult.tools,
    ...prefs,
  });

  if (syncResult.stats.added || syncResult.stats.updated) {
    const parts = [];

    if (syncResult.stats.added) {
      parts.push(`+${syncResult.stats.added}: ${summarizeTitles(syncResult.stats.addedTitles)}`);
    }

    if (syncResult.stats.updated) {
      parts.push(`~${syncResult.stats.updated}: ${summarizeTitles(syncResult.stats.updatedTitles)}`);
    }

    notify(`Catálogo atualizado (${parts.join(" | ")})`, "success");
  }
}

bootstrap();
