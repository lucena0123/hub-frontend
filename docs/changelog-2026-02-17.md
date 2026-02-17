# Changelog — 2026-02-17 (hub-frontend)

## Principais entregas

### Performance e runtime real
- Rota dedicada `/performance` criada (reexport de `app/page.tsx`)
- Dashboard principal endurecido para dados reais:
  - validação de overview mais robusta
  - proteção de divisão por zero
  - barras e série de gráfico dinâmicas com base no payload real

### Optimization board (UX + confiabilidade)
- Ajustes de RBAC visual e modo `readOnly`
- Remoção de `alert()` e feedback inline ao usuário
- Melhoria de mensagens de erro mapeadas da API
- Suporte de status `in_progress` no fluxo completo

### Auditoria operacional na UI
- Painel de auditoria no board com timeline
- Refresh manual
- Filtros por ação, tipo de evento e janela temporal (6/24/72h)
- Resumo por ação com badges
- Labels/resumos de mudança mais amigáveis

## Commits de referência
- `6ed4c6d` feat(frontend): add audit time-window filter on optimization board
- `84b9673` feat(frontend): populate audit event-type filter dynamically from summary
- `9d21923` feat(frontend): add audit summary badges and event-type filtering controls
- `580df5a` feat(frontend): add audit event-type filter and change summary on board
- `02dd5da` feat(frontend): improve optimization audit timeline readability
- `7183cc1` feat(frontend): add audit action filter on optimization board
- `fc33848` feat(frontend): enhance optimization audit panel with manual refresh
- `58c963f` feat(frontend): show optimization audit timeline on board
- `14ad923` feat(frontend): expose optimization audit API client
- `35272ba` feat(frontend): map additional optimization API error codes
- `62f76cc` feat(frontend): improve optimization feedback lifecycle and API error mapping
- `befb723` feat(frontend): support in_progress tasks and normalize API error messages
- `6a84493` feat(frontend): harden performance dashboard and optimization board UX/RBAC
