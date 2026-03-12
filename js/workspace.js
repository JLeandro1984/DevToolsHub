export function createWorkspace({
  frame,
  loader,
  empty,
  blocked,
  blockedOpenButton,
  quickOpen,
  quickOpenButton,
  titleElement,
  metaElement,
  openExternalButton,
  reloadButton,
  onRedirectToNewTab,
}) {
  const FRAME_LOAD_TIMEOUT_MS = 7000;
  const KNOWN_IFRAME_BLOCKED_HOSTS = new Set(["4devs.com.br", "www.4devs.com.br"]);
  let currentTool = null;
  let frameLoadTimeoutId = null;
  let currentLoadToken = 0;

  function getHostFromUrl(rawUrl) {
    try {
      return new URL(rawUrl).hostname.toLowerCase();
    } catch {
      return "";
    }
  }

  function isKnownBlockedHost(rawUrl) {
    const host = getHostFromUrl(rawUrl);
    if (!host) {
      return false;
    }

    return [...KNOWN_IFRAME_BLOCKED_HOSTS].some((blockedHost) => host === blockedHost || host.endsWith(`.${blockedHost}`));
  }

  function isBrowserErrorFrame() {
    try {
      const href = frame.contentWindow?.location?.href || "";
      return (
        href.startsWith("chrome-error://") ||
        href.startsWith("edge-error://") ||
        href.startsWith("about:neterror") ||
        href === "about:blank"
      );
    } catch {
      return false;
    }
  }

  function clearFrameLoadTimeout() {
    if (frameLoadTimeoutId) {
      window.clearTimeout(frameLoadTimeoutId);
      frameLoadTimeoutId = null;
    }
  }

  function setLoading(isLoading) {
    loader.classList.toggle("hidden", !isLoading);
    frame.classList.toggle("hidden", isLoading);
    blocked.classList.add("hidden");
  }

  function setEmpty(isEmpty) {
    empty.classList.toggle("hidden", !isEmpty);
    frame.classList.toggle("hidden", isEmpty);
    loader.classList.toggle("hidden", true);
    blocked.classList.add("hidden");
    quickOpen.classList.toggle("hidden", isEmpty);
    openExternalButton.disabled = isEmpty;
    reloadButton.disabled = isEmpty;
  }

  function setBlocked(isBlocked) {
    blocked.classList.toggle("hidden", !isBlocked);

    if (isBlocked) {
      empty.classList.add("hidden");
      frame.classList.add("hidden");
      loader.classList.add("hidden");
    }

    openExternalButton.disabled = false;
    reloadButton.disabled = false;
    quickOpen.classList.remove("hidden");
  }

  function openCurrentToolExternally() {
    if (!currentTool) {
      return;
    }

    onRedirectToNewTab?.(currentTool);

    window.open(currentTool.url, "_blank", "noopener,noreferrer");
  }

  function loadToolInFrame(tool) {
    clearFrameLoadTimeout();
    currentLoadToken += 1;
    const token = currentLoadToken;

    if (isKnownBlockedHost(tool.url)) {
      frame.removeAttribute("src");
      setBlocked(true);
      return;
    }

    setBlocked(false);
    setLoading(true);
    frame.dataset.toolId = tool.id;
    frame.src = tool.url;

    frameLoadTimeoutId = window.setTimeout(() => {
      if (!currentTool || currentLoadToken !== token || currentTool.id !== tool.id) {
        return;
      }

      frame.removeAttribute("src");
      setBlocked(true);
    }, FRAME_LOAD_TIMEOUT_MS);
  }

  frame.addEventListener("load", () => {
    if (currentTool) {
      clearFrameLoadTimeout();

      if (isBrowserErrorFrame()) {
        frame.removeAttribute("src");
        setBlocked(true);
        return;
      }

      setLoading(false);
    }
  });

  reloadButton.addEventListener("click", () => {
    if (!currentTool) {
      return;
    }

    loadToolInFrame(currentTool);
  });

  openExternalButton.addEventListener("click", () => {
    openCurrentToolExternally();
  });

  blockedOpenButton.addEventListener("click", () => {
    openCurrentToolExternally();
  });

  quickOpenButton.addEventListener("click", () => {
    openCurrentToolExternally();
  });

  function render(tool) {
    clearFrameLoadTimeout();
    currentTool = tool;

    if (!tool) {
      titleElement.textContent = "Workspace";
      metaElement.textContent = "Selecione uma ferramenta no menu lateral.";
      frame.removeAttribute("src");
      setEmpty(true);
      return;
    }

    titleElement.textContent = tool.title;
    metaElement.textContent = `${tool.category} • ${tool.description || "Sem descrição"}`;
    setEmpty(false);
    quickOpen.classList.remove("hidden");

    if (tool.openInNewTab) {
      frame.removeAttribute("src");
      setBlocked(true);
      return;
    }

    if (frame.dataset.toolId === tool.id && frame.src) {
      return;
    }

    loadToolInFrame(tool);
  }

  return {
    render,
  };
}
