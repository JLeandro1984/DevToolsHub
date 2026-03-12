import { byQuery } from "./utils.js";

export function setupSearch(inputElement, onChange) {
  inputElement.addEventListener("input", (event) => {
    onChange(event.target.value || "");
  });
}

export function filterTools(tools, query) {
  if (!query.trim()) {
    return tools;
  }

  return tools.filter((tool) => byQuery(tool, query));
}
