let toastRoot = null;

export function initializeNotifications(rootElement) {
  toastRoot = rootElement;
}

export function notify(message, variant = "success") {
  if (!toastRoot) {
    return;
  }

  const toast = document.createElement("article");
  toast.className = `toast toast--${variant}`;
  toast.textContent = message;

  toastRoot.appendChild(toast);

  window.setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "0.2s ease";
  }, 2400);

  window.setTimeout(() => {
    toast.remove();
  }, 2700);
}
