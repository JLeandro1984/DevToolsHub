const elements = {
  fileInput: document.getElementById('fileInput'),
  dropzone: document.querySelector('.dropzone'),
  previewContainer: document.getElementById('previewContainer'),
  base64ResultPanel: document.getElementById('base64ResultPanel'),
  base64Output: document.getElementById('base64Output'),
  base64Meta: document.getElementById('base64Meta'),
  outputMode: document.getElementById('outputMode'),
  copyBase64: document.getElementById('copyBase64'),
  downloadBase64: document.getElementById('downloadBase64'),
  toggleOutputSize: document.getElementById('toggleOutputSize'),
  clearFiles: document.getElementById('clearFiles'),
  fileSummary: document.getElementById('fileSummary'),
  copyStatus: document.getElementById('copyStatus'),
  base64Input: document.getElementById('base64Input'),
  outputImage: document.getElementById('outputImage'),
  imagePlaceholder: document.getElementById('imagePlaceholder'),
  renderImage: document.getElementById('renderImage'),
  clearRender: document.getElementById('clearRender'),
  error: document.getElementById('error'),
  byteBtn: document.getElementById('byteBtn'),
  byteInput: document.getElementById('byteInput'),
  byteOutput: document.getElementById('byteOutput'),
  clearBytes: document.getElementById('clearBytes'),
  themeToggle: document.getElementById('themeToggle'),
  themeToggleIcon: document.getElementById('themeToggleIcon'),
  themeToggleLabel: document.getElementById('themeToggleLabel')
};

const state = {
  files: [],
  fileEntries: [],
  theme: localStorage.getItem('pixel64-theme') || 'dark',
  isBase64OutputExpanded: false,
  outputMode: 'raw'
};

const allowedMimeTypes = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/svg+xml',
  'application/pdf'
]);

const allowedExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.svg', '.pdf']);

const inferredMimeTypes = [
  ['iVBORw0KGgo', 'image/png'],
  ['/9j/', 'image/jpeg'],
  ['R0lGOD', 'image/gif'],
  ['UklGR', 'image/webp'],
  ['Qk', 'image/bmp'],
  ['PHN2Zy', 'image/svg+xml']
];

function formatFileSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function setTheme(theme) {
  state.theme = theme;
  document.body.dataset.theme = theme;
  localStorage.setItem('pixel64-theme', theme);
  elements.themeToggleIcon.textContent = theme === 'dark' ? '◐' : '☼';
  elements.themeToggleLabel.textContent = theme === 'dark' ? 'Tema escuro' : 'Tema claro';
}

function toggleTheme() {
  setTheme(state.theme === 'dark' ? 'light' : 'dark');
}

function resetCopyFeedback() {
  elements.copyStatus.textContent = '';
  delete elements.copyStatus.dataset.state;
}

function setCopyFeedback(message, isError = false) {
  elements.copyStatus.textContent = message;
  elements.copyStatus.dataset.state = isError ? 'error' : 'success';
}

function updateFileSummary() {
  if (!state.files.length) {
    elements.fileSummary.textContent = 'Nenhum arquivo carregado';
    return;
  }

  const totalBytes = state.files.reduce((sum, file) => sum + file.size, 0);
  elements.fileSummary.textContent = `${state.files.length} arquivo(s) carregado(s) • ${formatFileSize(totalBytes)}`;
}

function updateBase64Actions() {
  const hasContent = state.fileEntries.length > 0;
  elements.copyBase64.disabled = !hasContent;
  elements.downloadBase64.disabled = !hasContent;
  elements.toggleOutputSize.disabled = !hasContent;
  elements.outputMode.disabled = !hasContent;
}

function getOutputValues() {
  if (!state.fileEntries.length) {
    return [];
  }

  return state.fileEntries.map(entry => state.outputMode === 'raw' ? entry.rawBase64 : entry.dataUrl);
}

function updateBase64Output() {
  elements.base64Output.value = getOutputValues().join('\n\n');
}

function updateBase64Meta() {
  const outputValues = getOutputValues();

  if (!outputValues.length) {
    elements.base64Meta.textContent = 'Nenhum conteúdo gerado';
    return;
  }

  const totalChars = outputValues.reduce((sum, item) => sum + item.length, 0);
  const modeLabel = state.outputMode === 'raw' ? 'Base64 puro' : 'Data URL';
  elements.base64Meta.textContent = `${outputValues.length} item(ns) • ${totalChars.toLocaleString('pt-BR')} caracteres • ${modeLabel}`;
}

function updateBase64PanelMode() {
  elements.base64ResultPanel.classList.toggle('result-panel--expanded', state.isBase64OutputExpanded);
  elements.base64ResultPanel.classList.toggle('result-panel--compact', !state.isBase64OutputExpanded);
  elements.toggleOutputSize.textContent = state.isBase64OutputExpanded ? 'Compactar' : 'Expandir';
}

function toggleBase64OutputSize() {
  if (!state.fileEntries.length) {
    return;
  }

  state.isBase64OutputExpanded = !state.isBase64OutputExpanded;
  updateBase64PanelMode();
}

function renderPreviewCards() {
  elements.previewContainer.innerHTML = '';

  state.fileEntries.forEach(entry => {
    const { file, dataUrl } = entry;
    const card = document.createElement('article');
    card.className = 'preview-card';

    let mediaElement;

    if (file.type.startsWith('image/')) {
      const image = document.createElement('img');
      image.className = 'preview-card__image';
      image.src = dataUrl;
      image.alt = `Pré-visualização de ${file.name}`;
      mediaElement = image;
    } else {
      const fileBadge = document.createElement('div');
      fileBadge.className = 'preview-card__file-badge';
      fileBadge.textContent = getFileExtension(file.name).replace('.', '').toUpperCase() || 'FILE';
      mediaElement = fileBadge;
    }

    const content = document.createElement('div');
    content.className = 'preview-card__content';

    const title = document.createElement('strong');
    title.className = 'preview-card__title';
    title.textContent = file.name;

    const meta = document.createElement('span');
    meta.className = 'preview-card__meta';
    meta.textContent = `${file.type || 'tipo desconhecido'} • ${formatFileSize(file.size)}`;

    content.append(title, meta);
    card.append(mediaElement, content);
    elements.previewContainer.appendChild(card);
  });
}

function clearFileConversion() {
  state.files = [];
  state.fileEntries = [];
  state.isBase64OutputExpanded = false;
  state.outputMode = 'raw';
  elements.fileInput.value = '';
  elements.previewContainer.innerHTML = '';
  resetCopyFeedback();
  elements.outputMode.value = 'raw';
  updateFileSummary();
  updateBase64Output();
  updateBase64Meta();
  updateBase64Actions();
  updateBase64PanelMode();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Falha ao ler ${file.name}.`));

    reader.readAsDataURL(file);
  });
}

function getFileExtension(fileName) {
  const dotIndex = fileName.lastIndexOf('.');

  if (dotIndex === -1) {
    return '';
  }

  return fileName.slice(dotIndex).toLowerCase();
}

function isAcceptedFile(file) {
  const extension = getFileExtension(file.name);
  return allowedMimeTypes.has(file.type) || allowedExtensions.has(extension);
}

function validateSelectedFiles(files) {
  const invalidFiles = files.filter(file => !isAcceptedFile(file));

  if (!invalidFiles.length) {
    return null;
  }

  const names = invalidFiles.map(file => file.name).join(', ');
  return `Arquivo(s) não suportado(s): ${names}. Use PNG, JPG, JPEG, WEBP, GIF, BMP, SVG ou PDF.`;
}

async function handleFiles(files) {
  if (!files.length) {
    clearFileConversion();
    return;
  }

  resetCopyFeedback();

  const validationError = validateSelectedFiles(files);

  if (validationError) {
    clearFileConversion();
    setCopyFeedback(validationError, true);
    return;
  }

  try {
    const dataUrlList = await Promise.all(files.map(readFileAsDataUrl));
    state.files = files;
    state.fileEntries = files.map((file, index) => ({
      file,
      dataUrl: dataUrlList[index],
      rawBase64: extractRawBase64(dataUrlList[index])
    }));

    updateFileSummary();
    updateBase64Output();
    updateBase64Meta();
    updateBase64Actions();
    updateBase64PanelMode();
    renderPreviewCards();
  } catch (error) {
    clearFileConversion();
    setCopyFeedback(error.message, true);
  }
}

function sanitizeBase64(value) {
  return value.replace(/\s+/g, '');
}

function extractRawBase64(value) {
  const trimmed = value.trim();

  if (trimmed.startsWith('data:')) {
    const parts = trimmed.split(',');
    return parts[1] ? sanitizeBase64(parts[1]) : '';
  }

  return sanitizeBase64(trimmed);
}

function inferMimeType(base64) {
  const inferred = inferredMimeTypes.find(([signature]) => base64.startsWith(signature));
  return inferred ? inferred[1] : null;
}

function normalizeImageBase64(value) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error('Informe um Base64 para renderizar.');
  }

  if (/^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(trimmed)) {
    return trimmed;
  }

  const rawBase64 = extractRawBase64(trimmed);

  try {
    atob(rawBase64);
  } catch {
    throw new Error('O conteúdo informado não é um Base64 válido.');
  }

  const mimeType = inferMimeType(rawBase64);

  if (!mimeType) {
    throw new Error('Não foi possível identificar o tipo da imagem a partir do Base64.');
  }

  return `data:${mimeType};base64,${rawBase64}`;
}

function renderBase64Image() {
  try {
    const normalizedImage = normalizeImageBase64(elements.base64Input.value);
    elements.outputImage.src = normalizedImage;
    elements.outputImage.style.display = 'block';
    elements.imagePlaceholder.hidden = true;
    elements.error.textContent = '';
  } catch (error) {
    elements.outputImage.removeAttribute('src');
    elements.outputImage.style.display = 'none';
    elements.imagePlaceholder.hidden = false;
    elements.error.textContent = error.message;
  }
}

function clearRenderedImage() {
  elements.base64Input.value = '';
  elements.error.textContent = '';
  elements.outputImage.removeAttribute('src');
  elements.outputImage.style.display = 'none';
  elements.imagePlaceholder.hidden = false;
}

function convertToByteArray() {
  const rawBase64 = extractRawBase64(elements.byteInput.value);

  if (!rawBase64) {
    elements.byteOutput.textContent = '[]';
    return;
  }

  try {
    const binary = atob(rawBase64);
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    elements.byteOutput.textContent = JSON.stringify(Array.from(bytes), null, 2);
  } catch {
    elements.byteOutput.textContent = 'Erro ao converter: Base64 inválido.';
  }
}

function clearByteArray() {
  elements.byteInput.value = '';
  elements.byteOutput.textContent = '[]';
}

async function copyBase64Output() {
  if (!elements.base64Output.value) {
    return;
  }

  try {
    await navigator.clipboard.writeText(elements.base64Output.value);
    setCopyFeedback('Base64 copiado com sucesso.');
  } catch {
    setCopyFeedback('Não foi possível copiar automaticamente.', true);
  }
}

function downloadBase64Output() {
  if (!elements.base64Output.value) {
    return;
  }

  const blob = new Blob([elements.base64Output.value], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');

  anchor.href = url;
  anchor.download = `pixel64-export-${timestamp}.txt`;
  anchor.click();

  URL.revokeObjectURL(url);
}

function handleOutputModeChange() {
  state.outputMode = elements.outputMode.value;
  updateBase64Output();
  updateBase64Meta();
}

function bindEvents() {
  elements.fileInput.addEventListener('change', event => {
    const files = Array.from(event.target.files || []);
    handleFiles(files);
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    elements.dropzone.addEventListener(eventName, event => {
      event.preventDefault();
      elements.dropzone.classList.add('dropzone--active');
    });
  });

  ['dragleave', 'dragend', 'drop'].forEach(eventName => {
    elements.dropzone.addEventListener(eventName, event => {
      event.preventDefault();
      elements.dropzone.classList.remove('dropzone--active');
    });
  });

  elements.dropzone.addEventListener('drop', event => {
    const files = Array.from(event.dataTransfer?.files || []);

    if (!files.length) {
      return;
    }

    elements.fileInput.files = event.dataTransfer.files;
    handleFiles(files);
  });

  elements.copyBase64.addEventListener('click', copyBase64Output);
  elements.downloadBase64.addEventListener('click', downloadBase64Output);
  elements.outputMode.addEventListener('change', handleOutputModeChange);
  elements.toggleOutputSize.addEventListener('click', toggleBase64OutputSize);
  elements.clearFiles.addEventListener('click', clearFileConversion);
  elements.renderImage.addEventListener('click', renderBase64Image);
  elements.clearRender.addEventListener('click', clearRenderedImage);
  elements.byteBtn.addEventListener('click', convertToByteArray);
  elements.clearBytes.addEventListener('click', clearByteArray);
  elements.themeToggle.addEventListener('click', toggleTheme);
  elements.base64Input.addEventListener('input', () => {
    if (elements.error.textContent) {
      elements.error.textContent = '';
    }
  });
}

function initialize() {
  setTheme(state.theme);
  clearFileConversion();
  clearRenderedImage();
  clearByteArray();
  bindEvents();
}

initialize();