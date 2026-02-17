# Playbook Curto de Decisão — Efetividade de Regras

Objetivo: decidir rápido o que manter, ajustar ou desligar com base na tela `/optimization/effectiveness`.

## Cadência
- **2x por dia** (manhã e fim do dia)
- Janela padrão: **24h**
- Janela de confirmação para decisões mais fortes: **72h**

## Semáforo de decisão

### 🟢 Verde (manter)
Critérios:
- status **útil** na tela
- volume consistente de eventos
- updates presentes sem excesso de ruído

Ação:
- manter parâmetros atuais
- apenas monitorar

### 🟡 Amarelo (ajustar)
Critérios:
- status **ruidosa**
- muitos reads/eventos com pouco update útil
- gatilhos frequentes em campanhas sem impacto

Ação:
- ajustar threshold (ex.: `minSpend`, `windowDays`, `frequencyThreshold`, `cplThreshold`)
- reavaliar em 24h

### 🔴 Vermelho (desligar temporário)
Critérios:
- status **inativa** por 72h sem valor
- regra gera ruído recorrente sem ação prática

Ação:
- desativar regra para o cliente
- registrar motivo
- revisar em 7 dias antes de remover definitivamente

## Ordem prática (5 passos)
1. Filtrar cliente e janela 24h.
2. Ordenar por maior volume.
3. Classificar cada item no semáforo.
4. Aplicar ajustes em `/optimization/settings`.
5. Registrar decisão breve (manter/ajustar/desligar + motivo).

## Critério de sucesso da operação
- Reduzir sinais ruidosos ao longo da semana.
- Manter apenas regras com utilidade clara na rotina.
- Melhorar tempo entre detecção e ação no board.
