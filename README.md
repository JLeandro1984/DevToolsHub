# DevTools Hub

Portal centralizado para cadastro, organização e acesso de ferramentas internas de desenvolvimento.

## Visão Geral

O DevTools Hub foi criado para funcionar como um diretório único de apps web úteis para engenharia, com experiência moderna em dark mode e foco em produtividade.

Principais objetivos:
- Centralizar ferramentas do time em uma única interface
- Facilitar descoberta com busca e categorias
- Priorizar ferramentas importantes com favoritos
- Manter dados persistidos localmente com backup/importação

## Stack

- HTML5
- CSS3 (modular: layout, componentes e estilos globais)
- JavaScript ES6+ (arquitetura modular)
- LocalStorage para persistência
- Sem frameworks pesados

## Estrutura do Projeto

```text
/devtools-hub
  index.html
  app.js
  README.md

  /css
    styles.css
    layout.css
    components.css

  /js
    state.js
    storage.js
    router.js
    sidebar.js
    workspace.js
    modal.js
    tools.js
    search.js
    dragdrop.js
    notifications.js
    utils.js
```

## Como Rodar

Como é uma aplicação estática, existem duas formas:

1) Abrir diretamente o arquivo `index.html` no navegador.
2) (Recomendado) Servir localmente com um servidor HTTP simples para comportamento mais consistente de navegação:

Exemplo com Node:

```bash
npx serve .
```

Depois, acessar a URL exibida no terminal.

## Funcionalidades Implementadas

### Sidebar dinâmica
- Busca em tempo real por título, categoria e descrição
- Ferramentas favoritas no topo
- Organização por categorias
- Expandir/recolher categorias
- Menu de ações por item (editar, excluir, favoritar, abrir em nova aba)
- Reordenação com Drag and Drop

### Workspace
- Exibição da ferramenta via iframe em 100% da área
- Loader/skeleton enquanto a página carrega
- Ações de recarregar e abrir em nova aba

### Cadastro e edição
- Modal com campos: título, URL, descrição, ícone, categoria e favorito
- Salvamento em LocalStorage
- Atualização instantânea da sidebar
- Abertura automática da ferramenta após salvar

### Estado vazio
- Mensagem elegante para primeiro uso sem ferramentas cadastradas

### Notificações
- Toasts animados para feedback de ações importantes

### Backup e restauração
- Exportação da lista completa para JSON
- Importação de JSON para restaurar ou migrar ferramentas

## Modelo de Dados

Cada ferramenta segue o formato:

```json
{
  "id": "uuid",
  "title": "Gerador de CPF",
  "url": "https://...",
  "icon": "🧰",
  "description": "...",
  "category": "Generators",
  "favorite": true,
  "createdAt": "timestamp",
  "order": 0
}
```

## Chaves de Persistência

- `devtools-hub:tools` → lista de ferramentas
- `devtools-hub:prefs` → preferências de UI (ferramenta selecionada, categorias colapsadas, estado do menu mobile)

## Fluxo de Importação e Exportação

### Exportar
1. Clique em **Exportar** na sidebar.
2. O sistema gera automaticamente um arquivo JSON com data no nome.

### Importar
1. Clique em **Importar**.
2. Selecione um arquivo JSON válido (array de ferramentas).
3. A lista é carregada e substitui o estado atual.

## Atualização Automática via script.json

O projeto suporta um catálogo central em [script.json](script.json), carregado automaticamente ao abrir o app.

Comportamento da sincronização:
- Adiciona novas ferramentas do catálogo do time no LocalStorage
- Atualiza ferramentas de time existentes pelo `id`
- Não remove ferramentas pessoais já cadastradas por usuários
- Preserva preferências pessoais por ferramenta (ex.: favorito e abrir em nova aba)

Formato aceito:
- Array JSON direto, ou objeto com chave `tools`

Processo recomendado no time:
1. Adicionar/editar ferramentas em [script.json](script.json)
2. Publicar a nova versão do app estático
3. Na próxima abertura, os usuários recebem as novas ferramentas automaticamente

## Checklist de Operação (Time)

### Onboarding
- [ ] Abrir o DevTools Hub
- [ ] Confirmar ferramentas padrão carregadas
- [ ] Cadastrar 1 ferramenta interna do time
- [ ] Marcar como favorita se for de uso recorrente

### Rotina
- [ ] Manter descrições claras para facilitar busca
- [ ] Revisar categorias para evitar duplicidade
- [ ] Reordenar ferramentas por prioridade de uso

### Backup
- [ ] Exportar JSON periodicamente
- [ ] Armazenar backup em local compartilhado do time
- [ ] Validar importação em ambiente local quando necessário

## Convenções Recomendadas para Cadastro

- Título curto e objetivo
- URL completa com `https://`
- Categoria consistente (ex.: Dev Tools, APIs, Security, Generators)
- Descrição com contexto de uso (quando e por que usar)

## Troubleshooting

### A ferramenta não abre no iframe
Alguns sites bloqueiam carregamento em iframe por políticas de segurança (X-Frame-Options/CSP).

Ação recomendada:
- Usar **Abrir em nova aba** para acessar normalmente.

### Importação falhou
Verifique se o arquivo é um JSON válido contendo um array de objetos no formato esperado.

### Não vejo mudanças após editar
Confirme se o navegador não está com cache agressivo; recarregue a página e tente novamente.

## Próximos Passos Sugeridos

- Adicionar validação mais rígida de URL/categoria
- Criar modo de compartilhamento via API (backend opcional)
- Incluir autenticação para ambientes corporativos
