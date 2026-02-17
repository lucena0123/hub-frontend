# Base Readiness Frontend (Ambiente-Alvo)

Checklist final para validar prontidão do frontend antes de liberar no ambiente-alvo.

## 1) Runtime checks

- [ ] Build de produção executa sem erro (`build`).
- [ ] App sobe no ambiente-alvo sem crash inicial.
- [ ] Variáveis de ambiente obrigatórias estão definidas e válidas.
- [ ] Roteamento principal responde sem erro (home + rotas críticas).
- [ ] Requisições de API críticas retornam `2xx` e tratam `4xx/5xx` sem quebrar UI.
- [ ] Erros em runtime aparecem em logging/monitoramento (sem erro silencioso).

## 2) Validação de `/performance`

- [ ] Página `/performance` carrega sem erro visual/funcional.
- [ ] Métricas exibidas atualizam com dados reais (sem placeholders em produção).
- [ ] Estados de loading/empty/error estão corretos.
- [ ] Não há regressão de tempo de renderização percebida em fluxo principal.
- [ ] Não há warnings críticos no console relacionados à página.

## 3) Validação de `/optimization/board`

- [ ] Página `/optimization/board` abre e navega sem falhas.
- [ ] Tabela/cards principais carregam com paginação/filtros funcionais (se aplicável).
- [ ] Ações críticas (ex.: ordenar, filtrar, atualizar) funcionam fim a fim.
- [ ] Estado de erro de backend é exibido com mensagem acionável.
- [ ] Não há inconsistência entre dados exibidos e resposta da API.

## 4) Audit UI checks

- [ ] Layout mantém integridade em desktop e mobile (sem quebra de grid).
- [ ] Contraste e legibilidade aceitáveis em componentes críticos.
- [ ] Navegação por teclado funciona em interações principais.
- [ ] Labels/textos de ação estão claros e sem ambiguidades.
- [ ] Não há overflow, corte de conteúdo ou elementos sobrepostos em telas críticas.

## 5) Critérios explícitos de DONE

Somente marcar **DONE** quando todos os itens abaixo forem verdadeiros:

- [ ] 100% dos checks acima concluídos.
- [ ] Zero blocker/critical aberto para frontend.
- [ ] Nenhum erro crítico novo em runtime/console nas rotas validadas.
- [ ] Evidência de validação registrada (log, print ou link de execução).
- [ ] Aprovação final do responsável técnico.

**Status final:** `DONE` / `NOT DONE`
