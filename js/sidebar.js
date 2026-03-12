import { DEFAULT_CATEGORIES } from "./tools.js";
import { filterTools } from "./search.js";
import { uniqueCategories } from "./utils.js";
import { setupDragAndDrop } from "./dragdrop.js";

function groupByCategory(tools) {
  return tools.reduce((accumulator, tool) => {
    const key = tool.category || "Dev Tools";
    if (!accumulator[key]) {
      accumulator[key] = [];
    }

    accumulator[key].push(tool);
    return accumulator;
  }, {});
}

function renderToolItem(tool, isActive, allowDrag) {
  return `
    <article class="tool-item ${isActive ? "tool-item--active" : ""} ${allowDrag ? "tool-item--draggable" : "tool-item--locked"}" draggable="${allowDrag}" data-draggable="${allowDrag}" data-tool-id="${tool.id}">
      <span class="tool-item__drag-handle" data-tooltip="Arrastar para reordenar">⋮⋮</span>
      <div class="tool-item__icon">${tool.icon || "🧰"}</div>
      <button class="tool-item__button" data-action="select" data-tool-id="${tool.id}">
        <span class="tool-item__title">${tool.title}</span>
        <span class="tool-item__meta">${tool.category}</span>
      </button>
      <div class="tool-item__actions">
        <button class="mini-btn" data-action="toggle-favorite" data-tool-id="${tool.id}" data-tooltip="Favoritar">${tool.favorite ? "⭐" : "☆"}</button>
        <button class="mini-btn" data-action="toggle-menu" data-tool-id="${tool.id}" data-tooltip="Mais ações">⋯</button>
      </div>
      <div class="item-menu" data-menu-id="${tool.id}">
        <button data-menu-action="edit" data-tool-id="${tool.id}">Editar</button>
        <button data-menu-action="favorite" data-tool-id="${tool.id}">${tool.favorite ? "Desfavoritar" : "Favoritar"}</button>
        <button data-menu-action="open" data-tool-id="${tool.id}">Abrir em nova aba</button>
        <button class="danger" data-menu-action="delete" data-tool-id="${tool.id}">Excluir</button>
      </div>
    </article>
  `;
}

function renderCategoryBlock({ name, tools, collapsed, selectedToolId, allowDrag, icon }) {
  const canToggle = name !== "Favoritas";

  return `
    <section class="category-block" data-category="${name}">
      <button class="category-block__header" ${canToggle ? `data-action="toggle-category" data-category="${name}"` : ""}>
        <strong>${icon || "📁"} ${name}</strong>
        <span>${canToggle ? (collapsed ? "▸" : "▾") : "•"}</span>
      </button>
      <div class="category-block__body ${collapsed ? "hidden" : ""}">
        ${tools.map((tool) => renderToolItem(tool, tool.id === selectedToolId, allowDrag)).join("")}
      </div>
    </section>
  `;
}

export function createSidebar({ container, onSelect, onEdit, onDelete, onToggleFavorite, onOpenExternal, onToggleCategory, onReorder }) {
  let lastState = null;

  setupDragAndDrop(container, (sourceId, targetId) => {
    if (!lastState) {
      return;
    }

    const orderedVisibleIds = [...container.querySelectorAll(".tool-item")].map((node) => node.dataset.toolId);
    const sourceIndex = orderedVisibleIds.indexOf(sourceId);
    const targetIndex = orderedVisibleIds.indexOf(targetId);

    if (sourceIndex < 0 || targetIndex < 0) {
      return;
    }

    orderedVisibleIds.splice(sourceIndex, 1);
    orderedVisibleIds.splice(targetIndex, 0, sourceId);

    onReorder(orderedVisibleIds);
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".item-menu") && !event.target.closest('[data-action="toggle-menu"]')) {
      container.querySelectorAll(".item-menu.open").forEach((menu) => menu.classList.remove("open"));
      container.querySelectorAll(".tool-item--menu-open").forEach((item) => item.classList.remove("tool-item--menu-open"));
    }
  });

  container.addEventListener("click", (event) => {
    const toolItem = event.target.closest(".tool-item");

    const selectButton = event.target.closest('[data-action="select"]');
    if (selectButton) {
      onSelect(selectButton.dataset.toolId);
      return;
    }

    const categoryButton = event.target.closest('[data-action="toggle-category"]');
    if (categoryButton) {
      onToggleCategory(categoryButton.dataset.category);
      return;
    }

    const favoriteButton = event.target.closest('[data-action="toggle-favorite"]');
    if (favoriteButton) {
      onToggleFavorite(favoriteButton.dataset.toolId);
      return;
    }

    const menuToggleButton = event.target.closest('[data-action="toggle-menu"]');
    if (menuToggleButton) {
      const menu = container.querySelector(`[data-menu-id="${menuToggleButton.dataset.toolId}"]`);
      const item = menuToggleButton.closest(".tool-item");
      container.querySelectorAll(".item-menu.open").forEach((entry) => {
        if (entry !== menu) {
          entry.classList.remove("open");
        }
      });
      container.querySelectorAll(".tool-item--menu-open").forEach((entry) => {
        if (entry !== item) {
          entry.classList.remove("tool-item--menu-open");
        }
      });
      menu?.classList.toggle("open");
      item?.classList.toggle("tool-item--menu-open", menu?.classList.contains("open"));
      return;
    }

    const menuActionButton = event.target.closest("[data-menu-action]");
    if (!menuActionButton) {
      if (
        toolItem &&
        !event.target.closest(".tool-item__actions") &&
        !event.target.closest(".item-menu") &&
        !event.target.closest(".tool-item__drag-handle")
      ) {
        onSelect(toolItem.dataset.toolId);
      }
      return;
    }

    const toolId = menuActionButton.dataset.toolId;
    const action = menuActionButton.dataset.menuAction;

    if (action === "edit") {
      onEdit(toolId);
    } else if (action === "delete") {
      onDelete(toolId);
    } else if (action === "favorite") {
      onToggleFavorite(toolId);
    } else if (action === "open") {
      onOpenExternal(toolId);
    }

    menuActionButton.closest(".item-menu")?.classList.remove("open");
    menuActionButton.closest(".tool-item")?.classList.remove("tool-item--menu-open");
  });

  function render(state) {
    lastState = state;
    const filteredTools = filterTools(state.tools, state.query);
    const allowDrag = !state.query.trim();

    if (!filteredTools.length) {
      const message = state.tools.length
        ? "Nenhum resultado para a busca atual."
        : "Nenhuma ferramenta cadastrada ainda. Adicione a primeira ferramenta do time.";

      container.innerHTML = `<div class="empty-state-card"><h3>${message}</h3></div>`;
      return;
    }

    const favorites = filteredTools.filter((tool) => tool.favorite);
    const nonFavorites = filteredTools.filter((tool) => !tool.favorite);
    const categories = groupByCategory(nonFavorites);

    const categoryNames = Array.from(new Set([...DEFAULT_CATEGORIES, ...uniqueCategories(filteredTools)]));

    const blocks = [];

    if (favorites.length) {
      blocks.push(
        renderCategoryBlock({
          name: "Favoritas",
          icon: "⭐",
          tools: favorites,
          collapsed: false,
          selectedToolId: state.selectedToolId,
          allowDrag,
        })
      );
    }

    categoryNames.forEach((categoryName) => {
      const categoryTools = categories[categoryName] || [];
      if (!categoryTools.length) {
        return;
      }

      blocks.push(
        renderCategoryBlock({
          name: categoryName,
          tools: categoryTools,
          collapsed: state.collapsedCategories.has(categoryName),
          selectedToolId: state.selectedToolId,
          allowDrag,
        })
      );
    });

    container.innerHTML = blocks.join("");
  }

  return { render };
}
