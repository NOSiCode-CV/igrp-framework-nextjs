# IGRP Page Detector Monorepo

Este monorepo contém a biblioteca **IGRP Page Detector** e uma aplicação Next.js de demonstração para detectar e gerenciar controle de acesso em páginas Next.js, seguindo o **modelo híbrido baseado no Google Zanzibar**.

## ✨ Funcionalidades

### 1. **Detecção automática de páginas Next.js**
- Analisa todos os arquivos de página em `app/`, `src/app/`, `pages/` e `src/pages/`.
- Suporta rotas estáticas, dinâmicas (`[id]`), catch-all (`[...slug]`), catch-all opcional (`[[...slug]]`), múltiplos parâmetros, route groups e mais.
- Exclui automaticamente rotas de API (`api/` ou `route.ts`).

### 2. **Extração de configuração de acesso (Modelo Zanzibar)**
- Procura por `export const accessConfig = { ... }` ou `export const routeConfig = { ... }` em cada página.
- Suporta os campos:
  - `protected`: booleano obrigatório (define se a rota é protegida)
  - `permissions`: array de permissões granulares (padrão `resource:action`)
  - `description`: descrição da rota
  - `version`: versão da rota para controle de versionamento
  - `metadata`: objeto livre para metadados customizados, incluindo tuplas Zanzibar
- **Sem roles**: Trabalha apenas com permissões granulares seguindo o modelo Zanzibar

### 3. **Validação de permissões**
- Validação automática de permissões com padrões reconhecidos (CRUD, Resource, Action, Custom)
- Detecção de permissões inválidas (comprimento, caracteres, duplicatas)
- Sugestões automáticas para melhorar permissões
- Score de qualidade baseado em múltiplos critérios

### 4. **Versionamento**
- Controle de versão por rota
- Detecção de versões desatualizadas
- Changelog automático
- Score de qualidade baseado na versão

### 5. **Geração de JSON estruturado**
- Gera um arquivo JSON com:
  - Nome do app
  - Timestamp
  - Tipo de roteador (App/Pages)
  - Lista de rotas detectadas, com:
    - Caminho, URL, arquivo, config de acesso, parâmetros, metadados
    - Dados de validação e versionamento
  - Resumo: rotas públicas/protegidas, por permissão, por profundidade, permissões únicas
  - Score geral de qualidade

### 6. **Exclusão automática de rotas de API**
- Ignora arquivos em `app/api/`, `src/app/api/`, `pages/api/`, `src/pages/api/`.
- Apenas páginas de interface são indexadas.

### 7. **Integração com API externa (opcional)**
- Permite enviar o JSON gerado para uma API de gerenciamento de acesso.
- Configurável via variáveis de ambiente ou argumentos CLI:
  - `ACCESS_MANAGEMENT_API_URL`
  - `ACCESS_MANAGEMENT_API_KEY`
- Pode ser desativado com `--no-api`.

### 8. **Customização e CLI flexível**
- Permite definir:
  - Raiz do projeto (`--project-root`)
  - Nome do app (`--app-name`)
  - Endpoint e chave de API
  - Arquivo de saída (`--output`)
  - Verbosidade (`--verbose`)
  - Validação de permissões (`--validate`)
  - Verificação de versionamento (`--check-versioning`)
- Exibe árvore de rotas e resumo no terminal.

### 9. **Uso como biblioteca TypeScript**
- Pode ser importado e usado em código próprio:
```ts
import NextJSAccessConfigDetector from 'igrp-page-detector';
const detector = new NextJSAccessConfigDetector({ projectRoot: './my-app' });
const result = await detector.run({ verbose: true, validate: true });
```

### 10. **Extensibilidade**
- Código modular e orientado a classes.
- Fácil de adaptar para outros padrões de export, outros campos, ou integração com outros sistemas.

## 🏗️ Estrutura do Monorepo

```
igrp-nextjs-page-detector-demo/
├── packages/
│   └── igrp-page-detector/     # Biblioteca principal
│       ├── src/
│       │   ├── detector.ts     # Lógica principal do detector
│       │   ├── cli.ts          # Interface de linha de comando
│       │   ├── types.ts        # Definições de tipos TypeScript
│       │   └── index.ts        # Ponto de entrada da biblioteca
│       ├── package.json
│       └── tsconfig.json
├── apps/
│   └── demo/                   # Aplicação Next.js de demonstração
│       ├── src/app/            # Páginas de exemplo
│       ├── package.json
│       └── tsconfig.json
├── package.json               # Configuração do monorepo
└── tsconfig.json             # Configuração TypeScript raiz
```

## 🚀 Uso Rápido

### Instalação Global (Recomendado)
```bash
npm install -g igrp-page-detector
# ou
yarn global add igrp-page-detector
# ou
pnpm add -g igrp-page-detector
```

### Comandos Principais
```bash
# Validação completa
igrp detect

# Gerar relatório detalhado
igrp detect:report

# Apenas validação de permissões
igrp detect:permissions

# Validação básica
igrp detect:basic

# Para deploy
igrp detect:deployment
```

### Uso Local (Monorepo)
```bash
# Instalar dependências
yarn install

# Build do detector
yarn workspace igrp-page-detector build

# Executar na demo
cd apps/demo
yarn detect
```

## 📋 Comandos Disponíveis

### Detector (`packages/igrp-page-detector`)
```bash
yarn workspace igrp-page-detector run build      # Compilar TypeScript
yarn workspace igrp-page-detector run dev        # Desenvolvimento com watch
yarn workspace igrp-page-detector run detect     # Executar detector
yarn workspace igrp-page-detector run clean      # Limpar build
yarn workspace igrp-page-detector run lint       # Executar ESLint
```

### Demo (`apps/demo`)
```bash
yarn workspace demo run dev                      # Servidor de desenvolvimento
yarn workspace demo run build                    # Build de produção
yarn workspace demo run start                    # Servidor de produção
yarn workspace demo run detect                   # Validação completa
yarn workspace demo run detect:report            # Relatório detalhado
yarn workspace demo run detect:permissions       # Apenas validação de permissões
yarn workspace demo run detect:basic             # Validação básica
yarn workspace demo run detect:verbose           # Validação com saída detalhada
yarn workspace demo run detect:no-validation     # Sem validação
yarn workspace demo run detect:deployment        # Configuração para deploy
yarn workspace demo run detect:build             # Build + detecção
```

## 🔧 Configurar Controle de Acesso (Modelo Zanzibar)

Adicione um `accessConfig` nas suas páginas Next.js seguindo o modelo híbrido Zanzibar:

```typescript
export const accessConfig = {
  protected: true,                                // Obrigatório: Rota protegida?
  permissions: [                                 // Obrigatório: Permissões granulares
    'dashboard:read',
    'dashboard:write',
    'metrics:view'
  ],
  description: 'User dashboard',                 // Opcional: Descrição da rota
  version: '1.0.0',                             // Opcional: Versão da rota
  metadata: {                                    // Opcional: Metadados customizados
    category: 'protected',
    priority: 'high',
    zanzibar_tuples: [                          // Tuplas Zanzibar automáticas
      'user:${user_id} dashboard:read',
      'user:${user_id} dashboard:write',
      'user:${user_id} metrics:view'
    ]
  }
};
```

### Padrões de Permissões Reconhecidos

#### 🔄 Padrão CRUD
```typescript
permissions: ['user:create', 'user:read', 'user:update', 'user:delete']
```

#### 📦 Padrão Resource
```typescript
permissions: ['user:manage', 'settings:configure', 'system:admin']
```

#### ⚡ Padrão Action
```typescript
permissions: ['admin:panel_access', 'dashboard:view', 'reports:generate']
```

#### 🎨 Padrão Custom
```typescript
permissions: ['system:configure', 'custom:permission']
```

### Nome Alternativo
Você também pode usar `routeConfig`:

```typescript
export const routeConfig = {
  protected: false,
  permissions: ['docs:read'],
  description: 'Public documentation page',
  version: '1.0.0'
};
```

## 🔍 Validação e Versionamento

### Validação de Permissões
O detector valida automaticamente as permissões seguindo regras rigorosas:

- **Comprimento**: Mínimo 3, máximo 50 caracteres
- **Caracteres**: Apenas letras, números e underscores
- **Padrões**: Reconhece CRUD, Resource, Action, Custom
- **Duplicatas**: Detecta permissões duplicadas (case-insensitive)
- **Sugestões**: Oferece melhorias automáticas

### Versionamento
- **Controle por rota**: Cada página pode ter sua versão
- **Detecção de atualizações**: Compara versões semânticas
- **Changelog**: Informações sobre mudanças
- **Score de qualidade**: Baseado na versão atual

### Score de Qualidade
O detector calcula um score de 0-100 baseado em:
- **Proteção** (20 pontos): Campo `protected` presente
- **Permissões** (20 pontos): Permissões válidas e bem definidas
- **Descrição** (20 pontos): Descrição informativa presente
- **Versão** (20 pontos): Versão atual e atualizada
- **Metadados** (20 pontos): Metadados bem estruturados

## 🛣️ Tipos de Rotas Suportados

### App Router (`app/` ou `src/app/`)
- ✅ **Rotas estáticas**: `/about`, `/dashboard`
- ✅ **Rotas dinâmicas**: `/users/[id]` → `/users/:id`
- ✅ **Rotas catch-all**: `/blog/[...slug]` → `/blog/*slug`
- ✅ **Catch-all opcional**: `/docs/[[...slug]]` → `/docs/?*slug`
- ✅ **Route groups**: `/admin/(dashboard)/analytics` → `/admin/analytics`
- ✅ **Múltiplos parâmetros**: `/products/[category]/[id]` → `/products/:category/:id`

### Pages Router (`pages/` ou `src/pages/`)
- ✅ **Rotas estáticas**: `pages/about.tsx` → `/about`
- ✅ **Rotas dinâmicas**: `pages/users/[id].tsx` → `/users/:id`
- ✅ **Rotas catch-all**: `pages/blog/[...slug].tsx` → `/blog/*slug`
- ✅ **Catch-all opcional**: `pages/docs/[[...slug]].tsx` → `/docs/?*slug`

## 📊 Exemplo de Saída

O detector gera um JSON estruturado com:

```json
{
  "app": "igrp-page-detector-demo",
  "timestamp": "2025-06-09T17:01:07.860Z",
  "deployment": {
    "router_type": "app",
    "total_routes": 12,
    "max_depth": 3
  },
  "routes": [
    {
      "path": "/dashboard",
      "url": "/dashboard",
      "file": "src/app/dashboard/page.tsx",
      "access_control": {
        "protected": true,
        "roles": ["user"],
        "description": "User dashboard"
      },
      "parameters": {
        "path_params": [],
        "query_params": [],
        "dynamic_segments": []
      },
      "metadata": {
        "last_modified": "2025-06-09T15:06:13.054Z",
        "file_size": 248,
        "depth": 1
      }
    }
  ],
  "summary": {
    "protected_routes": ["/dashboard", "/users/:id"],
    "public_routes": ["/", "/about"],
    "routes_by_role": {
      "user": ["/dashboard"],
      "admin": ["/admin/users"]
    },
    "total_unique_roles": ["user", "admin"],
    "total_unique_permissions": ["read", "write", "delete"]
  }
}
```

## 🔌 Opções do CLI

```bash
# Opções básicas
--output, -o <file>       # Salvar JSON em arquivo
--no-api                  # Não enviar para API
--verbose, -v             # Saída detalhada
--project-root <path>     # Diretório raiz do projeto

# Configuração de API
--api-endpoint <url>      # URL da API
--api-key <key>          # Chave da API
--app-name <name>        # Nome da aplicação

# Ajuda
--help, -h               # Mostrar ajuda
```

## 🌍 Variáveis de Ambiente

```bash
ACCESS_MANAGEMENT_API_URL    # URL da API de gerenciamento
ACCESS_MANAGEMENT_API_KEY    # Chave de autenticação da API
```

## 📦 Páginas de Exemplo

O projeto demo inclui exemplos de todos os tipos de rotas:

- `src/app/page.tsx` - Página inicial pública
- `src/app/dashboard/page.tsx` - Dashboard protegido
- `src/app/users/[id]/page.tsx` - Perfil de usuário dinâmico
- `src/app/blog/[...slug]/page.tsx` - Blog com catch-all
- `src/app/docs/[[...slug]]/page.tsx` - Documentação com catch-all opcional
- `src/app/admin/(dashboard)/analytics/page.tsx` - Analytics com route group
- `src/app/products/[category]/[id]/page.tsx` - Produto com múltiplos parâmetros

## 🛠️ Tecnologias

- **TypeScript** - Tipagem estática
- **Next.js** - Framework React
- **Yarn Workspaces** - Gerenciamento de monorepo
- **ts-node** - Execução de TypeScript
- **glob** - Busca de arquivos
- **node-fetch** - Requisições HTTP

## 📄 Licença

MIT

## 🧪 Testes Unitários

O pacote `igrp-page-detector` possui testes unitários utilizando **Jest**.

### Executar todos os testes
```bash
yarn workspace igrp-page-detector run test
```

### Modo watch (testes automáticos ao salvar)
```bash
yarn workspace igrp-page-detector run test:watch
```

### Cobertura de testes
```bash
yarn workspace igrp-page-detector run test:coverage
```

Os testes estão localizados em `packages/igrp-page-detector/__tests__` e cobrem as principais funções do detector e do CLI.
