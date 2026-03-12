export function setupDragAndDrop(container, onReorder) {
  let draggedItem = null;
  let dragHandleToolId = null;

  container.addEventListener("pointerdown", (event) => {
    const handle = event.target.closest(".tool-item__drag-handle");
    const toolItem = handle?.closest(".tool-item");
    dragHandleToolId = toolItem?.dataset.toolId || null;
  });

  container.addEventListener("pointerup", () => {
    dragHandleToolId = null;
  });

  container.addEventListener("pointercancel", () => {
    dragHandleToolId = null;
  });

  container.addEventListener("dragstart", (event) => {
    const toolItem = event.target.closest(".tool-item");

    if (!toolItem || toolItem.dataset.draggable === "false" || dragHandleToolId !== toolItem.dataset.toolId) {
      event.preventDefault();
      return;
    }

    draggedItem = toolItem;
    toolItem.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", toolItem.dataset.toolId || "");
  });

  container.addEventListener("dragover", (event) => {
    event.preventDefault();
    const target = event.target.closest(".tool-item");

    container.querySelectorAll(".drop-target").forEach((item) => item.classList.remove("drop-target"));

    if (target && target !== draggedItem) {
      target.classList.add("drop-target");
    }
  });

  container.addEventListener("drop", (event) => {
    event.preventDefault();

    const target = event.target.closest(".tool-item");
    if (!target || !draggedItem || target === draggedItem) {
      return;
    }

    const sourceId = draggedItem.dataset.toolId;
    const targetId = target.dataset.toolId;

    if (!sourceId || !targetId) {
      return;
    }

    onReorder(sourceId, targetId);
  });

  container.addEventListener("dragend", () => {
    draggedItem?.classList.remove("dragging");
    container.querySelectorAll(".drop-target").forEach((item) => item.classList.remove("drop-target"));
    draggedItem = null;
    dragHandleToolId = null;
  });
}
