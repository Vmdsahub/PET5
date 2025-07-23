# Funcionalidade de Menu de Contexto

## Descrição
Implementação de menu dropdown com botão direito para exclusão de itens do catálogo (admin) e inventário (usuário).

## Funcionalidades Implementadas

### 1. Menu de Contexto para Catálogo (Apenas Admin)
- **Acesso**: Botão direito do mouse em itens do catálogo
- **Permissão**: Apenas usuários admin podem ver e usar
- **Ação**: Excluir item do catálogo
- **Proteção**: Verificação se item está em uso antes de excluir

### 2. Menu de Contexto para Inventário (Todos os Usuários)
- **Acesso**: Botão direito do mouse em itens do inventário
- **Permissão**: Todos os usuários podem usar
- **Ação**: Excluir item do inventário
- **Comportamento**: Remove automaticamente da sala se estiver posicionado

## Indicadores Visuais

### Admin (Catálogo)
- Ícone ⚙️ aparece no hover dos itens
- Indica que há opções administrativas disponíveis

### Usuário (Inventário)
- Ícone ⋯ aparece no hover dos itens
- Indica que há opções de contexto disponíveis

## Arquivos Modificados

### Novos Arquivos
- `src/components/Common/ContextMenu.tsx` - Componente do menu de contexto

### Arquivos Modificados
- `src/components/Screens/SimpleRoom3D.tsx` - Implementação dos menus
- `src/services/mockPersistenceService.ts` - Funções de exclusão
- `src/index.css` - Estilos visuais para indicadores

## Como Usar

### Como Admin
1. Acesse o catálogo de móveis
2. Clique com botão direito em qualquer item
3. Selecione "Excluir" no menu dropdown
4. Confirme a exclusão

### Como Usuário
1. Acesse o inventário da casa
2. Clique com botão direito em qualquer item
3. Selecione "Excluir" no menu dropdown
4. Confirme a exclusão

## Proteções Implementadas

### Catálogo
- Apenas admins podem excluir
- Verifica se item está sendo usado por algum usuário
- Confirmação antes da exclusão

### Inventário
- Remove automaticamente da sala se posicionado
- Confirmação antes da exclusão
- Atualiza interface automaticamente

## Experiência do Usuário

### Feedback Visual
- Ícones indicam itens com menu de contexto
- Animações suaves para o menu
- Confirmações de ação

### Responsividade
- Menu se fecha ao clicar fora
- Posicionamento automático baseado no cursor
- Suporte a tecla ESC para fechar

### Consistência
- Recarregamento automático de dados após exclusões
- Interface sempre atualizada
- Estados visuais consistentes
