export function createConfirmDialog({
  modal,
  titleElement,
  messageElement,
  confirmButton,
  cancelButton,
  closeButton,
}) {
  let resolver = null;
  let closeTimer = null;

  function resetVisibilityState() {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }

    modal.classList.add("hidden");
    modal.classList.remove("confirm-modal--open", "confirm-modal--closing");
  }

  function resolvePending(value) {
    if (!resolver) {
      return;
    }

    const resolve = resolver;
    resolver = null;
    resolve(value);
  }

  function closeWith(value) {
    if (!resolver) {
      return;
    }

    modal.classList.remove("confirm-modal--open");
    modal.classList.add("confirm-modal--closing");

    closeTimer = setTimeout(() => {
      resetVisibilityState();
      resolvePending(value);
    }, 180);
  }

  function open(options = {}) {
    if (resolver) {
      resolvePending(false);
      resetVisibilityState();
    }

    titleElement.textContent = options.title || "Confirmar ação";
    messageElement.textContent = options.message || "Deseja continuar?";
    confirmButton.textContent = options.confirmLabel || "Confirmar";
    cancelButton.textContent = options.cancelLabel || "Cancelar";

    confirmButton.classList.toggle("btn--danger", options.variant === "danger");
    confirmButton.classList.toggle("btn--primary", options.variant !== "danger");

    modal.classList.remove("hidden");
    modal.classList.remove("confirm-modal--closing");
    requestAnimationFrame(() => {
      modal.classList.add("confirm-modal--open");
    });
    cancelButton.focus();

    return new Promise((resolve) => {
      resolver = resolve;
    });
  }

  confirmButton.addEventListener("click", () => closeWith(true));
  cancelButton.addEventListener("click", () => closeWith(false));
  closeButton.addEventListener("click", () => closeWith(false));

  modal.addEventListener("click", (event) => {
    if (event.target.matches('[data-close-confirm="true"]')) {
      closeWith(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (modal.classList.contains("hidden")) {
      return;
    }

    if (event.key === "Escape") {
      closeWith(false);
      return;
    }

    if (event.key === "Enter") {
      closeWith(true);
    }
  });

  return { open };
}
