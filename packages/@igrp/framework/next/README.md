# @igrp/framework.next

Framework IGRP para Next.js - Componentes de layout e hooks para carregamento de dados.

## Instalação

```bash
npm install @igrp/framework.next
```

## Configuração

### Variáveis de Ambiente

Configure as seguintes variáveis de ambiente no seu projeto Next.js:

```env
# Código da aplicação IGRP
IGRP_PUBLIC_APP_CODE=demo

# Modo de preview (para desenvolvimento com dados mock)
IGRP_PUBLIC_PREVIEW_MODE=true
```

### Inicialização

No seu arquivo `_app.tsx` ou `layout.tsx`, inicialize a configuração do IGRP:

```tsx
import { initializeIGRPConfig } from '@igrp/framework.next';

// Inicializar configuração
initializeIGRPConfig({
  appCode: 'demo',
  previewMode: process.env.IGRP_PUBLIC_PREVIEW_MODE === 'true',
  mockDataProvider: () => ({
    getHeaderData: async () => ({ /* seus dados mock */ }),
    getSidebarData: async () => ({ /* seus dados mock */ }),
  }),
});
```

## Uso

### Layout Completo

```tsx
import { Layout } from '@igrp/framework.next';

export default function MyPage() {
  return (
    <Layout>
      <h1>Minha Página</h1>
      <p>Conteúdo da página aqui...</p>
    </Layout>
  );
}
```

### Componentes Individuais

```tsx
import { Header, Sidebar, useHeaderData, useSidebarData } from '@igrp/framework.next';

export default function CustomLayout() {
  const { data: headerData, loading: headerLoading } = useHeaderData();
  const { data: sidebarData, loading: sidebarLoading } = useSidebarData();

  return (
    <div className="min-h-screen">
      <Header data={headerData} loading={headerLoading} />
      <div className="flex">
        <Sidebar data={sidebarData} loading={sidebarLoading} />
        <main className="flex-1">
          {/* Conteúdo da página */}
        </main>
      </div>
    </div>
  );
}
```

### Hooks

#### useHeaderData

```tsx
import { useHeaderData } from '@igrp/framework.next';

function MyComponent() {
  const { data, loading, error } = useHeaderData();

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div>
      <h1>Bem-vindo, {data?.user.name}</h1>
      <p>Você tem {data?.notifications.length} notificações</p>
    </div>
  );
}
```

#### useSidebarData

```tsx
import { useSidebarData } from '@igrp/framework.next';

function MyComponent() {
  const { data, loading, error } = useSidebarData();

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <nav>
      {data?.menuItems.map(item => (
        <a key={item.id} href={item.href}>
          {item.title}
        </a>
      ))}
    </nav>
  );
}
```

## Modo Preview

Quando `IGRP_PUBLIC_PREVIEW_MODE=true`, o framework usa dados mock em vez de fazer chamadas para APIs reais. Isso é útil para desenvolvimento e demonstração.

### Provider de Dados Mock

Você pode fornecer seus próprios dados mock implementando a interface `MockDataProvider`:

```tsx
const mockDataProvider = {
  getHeaderData: async () => ({
    user: {
      id: '1',
      name: 'João Silva',
      email: 'joao@exemplo.com',
      role: 'Administrador',
      permissions: ['read', 'write', 'admin']
    },
    notifications: [
      {
        id: '1',
        title: 'Sistema Atualizado',
        message: 'O sistema foi atualizado com sucesso',
        type: 'success',
        timestamp: new Date(),
        isRead: false
      }
    ],
    quickActions: [
      {
        id: '1',
        title: 'Nova Página',
        icon: 'plus',
        href: '/pages/new'
      }
    ]
  }),
  getSidebarData: async () => ({
    menuItems: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        href: '/dashboard',
        icon: 'home',
        isActive: true
      }
    ],
    collapsed: false,
    user: { /* dados do usuário */ }
  })
};

initializeIGRPConfig({
  mockDataProvider: () => mockDataProvider
});
```

## APIs

O framework espera que as seguintes APIs estejam disponíveis quando não estiver em modo preview:

- `GET /api/igrp/{appCode}/header` - Dados do header
- `GET /api/igrp/{appCode}/sidebar` - Dados da sidebar

## Tipos

```tsx
import type {
  IGRPConfig,
  MenuItem,
  User,
  HeaderData,
  SidebarData,
  MockDataProvider
} from '@igrp/framework.next';
```

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Desenvolvimento com watch
npm run dev

# Build
npm run build

# Limpar build
npm run clean
``` 