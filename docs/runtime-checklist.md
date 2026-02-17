# Runtime Checklist

Validações rápidas após subir o frontend em ambiente local/staging.

## Pré-requisitos
- Aplicação iniciada sem erro de build/runtime.
- DevTools aberto (Console + Network).
- Sessão autenticada (se aplicável).

## Rota `/performance`
- Abrir `/performance` e confirmar carregamento inicial em até 3s.
- Verificar ausência de erros no Console (`error`/`unhandled`).
- Confirmar que os principais cards/gráficos renderizam com dados.
- Validar estado vazio/fallback quando API retorna sem dados.
- Navegar para outra rota e voltar: sem tela em branco e sem duplicação de requests.

## Rota `/optimization/board`
- Abrir `/optimization/board` e validar render completo do board.
- Confirmar drag-and-drop/movimentação de itens (se habilitado).
- Testar filtro/busca e reset de filtros.
- Validar feedback de loading e erro de API.
- Recarregar a página (F5) e confirmar persistência/consistência do estado esperado.

## Sanidade final
- Network sem cascata de requests repetidos sem necessidade.
- Sem regressão visual crítica em desktop e mobile (largura reduzida).
- Registrar qualquer falha com: rota, ação, resultado atual, resultado esperado.
