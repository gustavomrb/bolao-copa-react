# Migracao dos palpites do Firestore

## Objetivo

Migrar os dados agregados de:

```text
resultadosUsuariosBoloes/{bolaoId}.usuarios.{userId}
```

para documentos que possam ser protegidos individualmente:

```text
boloes/{bolaoId}/fases/{faseId}
boloes/{bolaoId}/fases/{faseId}/palpites/{userId}
boloes/{bolaoId}/fases/{faseId}/pontuacoes/{userId}
boloes/{bolaoId}/palpitesGerais/{userId}
boloes/{bolaoId}/participantes/{userId}
```

O documento legado nao e alterado nem removido pelo migrador.

## Mapeamento

- Cada jogo e associado a sua fase usando `jogosBolao/{bolaoId}.jogos.{jogoId}.fase`.
- `campeao` e `artilheiro` vao para `palpitesGerais/{userId}`.
- `pontos` vai para `pontuacoes/{userId}`, separado dos campos editaveis.
- `pago` vai para `participantes/{userId}`.
- Indicadores booleanos de envio por fase vao para `participantes/{userId}.envios`, sem expor placares.
- `fechaEm` e `revelaEm` sao inicialmente iguais a data do primeiro jogo da fase, preservando o comportamento atual.
- O primeiro jogo do campeonato define `palpitesGeraisFechaEm` e `palpitesGeraisRevelaEm` no documento do bolao.
- IDs de fase sao convertidos para string nos novos caminhos.

## Etapas

1. Fazer um export/backup do Firestore.
2. Autenticar o Admin SDK localmente.
3. Instalar as dependencias em `migration/`.
4. Executar o `dry-run` e corrigir qualquer erro de integridade.
5. Executar a migracao com confirmacao explicita do projeto.
6. Executar novamente o `dry-run` com `--verify-target`.
7. Migrar o frontend para leitura e escrita na estrutura nova.
8. Publicar e testar o frontend.
9. Ativar as regras definitivas.
10. Manter `resultadosUsuariosBoloes` bloqueada como rollback.

## Comandos

No diretorio `migration/`:

```powershell
npm install
npm run dry-run
```

O `dry-run` e o comportamento padrao e nao escreve dados.

Para limitar a auditoria a um bolao:

```powershell
node migrate-resultados.cjs --bolao=ID_DO_BOLAO --verify-target
```

Para executar a escrita:

```powershell
node migrate-resultados.cjs --execute --confirm-project=bolao-copa-leopoldina
```

Antes de escrever, o script compara qualquer documento de destino existente. A
migracao e bloqueada se houver conteudo divergente. Depois da escrita, todos os
documentos sao relidos e comparados automaticamente.

## Autenticacao

Use Application Default Credentials ou uma conta de servico temporaria:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\caminho\seguro\service-account.json"
```

Nunca adicione esse JSON ao repositorio.

## Criterios de bloqueio

O migrador se recusa a escrever quando encontra:

- bolao sem documento de jogos;
- jogo de um palpite sem cadastro em `jogosBolao`;
- jogo sem fase;
- fase sem nenhum jogo com data valida;
- divergencia entre o projeto selecionado e `--confirm-project`.

Uma falha nao remove nem modifica os dados legados.

## Exclusao de boloes

Excluir `boloes/{bolaoId}` pelo SDK do navegador nao remove suas subcolecoes.
As regras definitivas exigem que o documento pai exista, portanto fases,
palpites, pontuacoes e participantes orfaos ficam inacessiveis imediatamente.

A remocao fisica recursiva deve ser feita posteriormente por um processo
administrativo com o Admin SDK. Nao recrie manualmente um bolao usando o mesmo
ID antes dessa limpeza.
