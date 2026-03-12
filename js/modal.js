import { DEFAULT_CATEGORIES } from "./tools.js";
import { generateId } from "./utils.js";

export function createToolModal({
  modal,
  closeButton,
  cancelButton,
  form,
  titleElement,
  fields,
  categoryList,
  onSave,
}) {
  let isEditing = false;

  function fillCategories(categories) {
    const merged = Array.from(new Set([...DEFAULT_CATEGORIES, ...(categories || [])]));
    categoryList.innerHTML = merged.map((name) => `<option value="${name}"></option>`).join("");
  }

  function resetForm() {
    form.reset();
    fields.id.value = "";
    fields.icon.value = "🧰";
    fields.category.value = DEFAULT_CATEGORIES[0];
    fields.openInNewTab.checked = false;
  }

  function openForCreate(categories) {
    isEditing = false;
    titleElement.textContent = "Nova Ferramenta";
    fillCategories(categories);
    resetForm();
    modal.classList.remove("hidden");
    fields.title.focus();
  }

  function openForEdit(tool, categories) {
    isEditing = true;
    titleElement.textContent = "Editar Ferramenta";
    fillCategories(categories);

    fields.id.value = tool.id;
    fields.title.value = tool.title;
    fields.url.value = tool.url;
    fields.description.value = tool.description;
    fields.icon.value = tool.icon;
    fields.category.value = tool.category;
    fields.favorite.checked = tool.favorite;
    fields.openInNewTab.checked = Boolean(tool.openInNewTab);

    modal.classList.remove("hidden");
    fields.title.focus();
  }

  function close() {
    modal.classList.add("hidden");
  }

  closeButton.addEventListener("click", close);
  cancelButton.addEventListener("click", close);

  modal.addEventListener("click", (event) => {
    if (event.target.matches('[data-close-modal="true"]')) {
      close();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.classList.contains("hidden")) {
      close();
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    onSave(
      {
        id: fields.id.value || generateId(),
        title: fields.title.value,
        url: fields.url.value,
        description: fields.description.value,
        icon: fields.icon.value,
        category: fields.category.value,
        favorite: fields.favorite.checked,
        openInNewTab: fields.openInNewTab.checked,
        createdAt: isEditing ? undefined : new Date().toISOString(),
      },
      { isEditing }
    );

    close();
  });

  return {
    openForCreate,
    openForEdit,
    close,
  };
}
