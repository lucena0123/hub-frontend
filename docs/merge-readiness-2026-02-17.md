# Merge Readiness — hub-frontend (2026-02-17)

## Branch
- Atual: `codex-work`
- HEAD: `df81ed3`

## Estado
- Working tree limpo
- Push remoto atualizado
- Runtime validado contra backend local

## Entregas no pacote
- Rota `/performance` e ajustes de dashboard para dados reais
- Board com melhorias de UX/RBAC/readOnly
- Tratamento de erros mais consistente
- Suporte completo a `in_progress`
- Painel de auditoria (timeline, filtros, resumo, janela temporal)
- Changelog consolidado em `docs/changelog-2026-02-17.md`

## Pós-merge (rápido)
1. `npm run dev`
2. Validar `/performance` e `/optimization/board`
3. Confirmar filtros/resumo da auditoria no board
4. Checar feedback inline e estados de erro
