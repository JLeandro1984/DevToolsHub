export function getToolIdFromHash() {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash.startsWith("tool=")) {
    return null;
  }

  return decodeURIComponent(hash.slice(5));
}

export function initializeRouter(onToolChange) {
  window.addEventListener("hashchange", () => {
    const toolId = getToolIdFromHash();
    if (toolId) {
      onToolChange(toolId);
    }
  });

  const initialToolId = getToolIdFromHash();
  if (initialToolId) {
    onToolChange(initialToolId);
  }
}

export function syncHash(toolId) {
  const targetHash = toolId ? `#tool=${encodeURIComponent(toolId)}` : "";

  if (window.location.hash === targetHash) {
    return;
  }

  const base = `${window.location.pathname}${window.location.search}`;
  history.replaceState(null, "", `${base}${targetHash}`);
}
