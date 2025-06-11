const timestampToDate = (timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString("pt-BR");
};

const timeStampToShortDate = (timestamp) => {
    const date = timestamp.toDate().toLocaleDateString("pt-BR").split("/");
    return `${date[0]}/${date[1]}`;
};

const timestampToTime = (timestamp) => {
    const date = timestamp.toDate().toLocaleTimeString("pt-BR").split(":");
    return `${date[0]}:${date[1]}`;
};

const getConvocados = (equipesBolao) => {
    const convocados = [];
    convocados.push({ selecao: "", jogador: "" });
    for (let e of equipesBolao) {
        for (let jogador of e.data.convocados) {
        convocados.push({ selecao: e.data.nome, jogador: jogador });
        }
    }
    return convocados;
};

const organizaJogosPorData = (fase, jogos) => {
    const organizadosData = [];
    const datas = [
      ...new Set(
        jogos
          .filter((j) => j.data.fase === fase)
          .map((j) => j.data.data.toDate().toLocaleDateString("pt-BR")).sort()
      ),
    ];

    for (let data of datas) {
      const dataJson = { data: data, jogos: [] };
      dataJson.jogos = jogos
        .filter((j) => j.data.data.toDate().toLocaleDateString("pt-BR") === data && j.data.fase === fase)
        .sort((a, b) => a.data.data - b.data.data);
      organizadosData.push(dataJson);
    }
    return organizadosData;
};

const organizaJogosPorGrupo = (fase, jogos) => {
    const organizadosGrupo = [];
    const grupos = fase === 1 ? [...new Set(jogos.map((item) => item.data.grupo))].sort() : ["A"];
    for (let grupo of grupos) {
      const grupoJson = { grupo: grupo, jogos: [] };
      grupoJson.jogos = jogos
        .filter((j) => j.data.grupo === grupo && j.data.fase === fase)
        .sort((a, b) => a.data.data.toDate() - b.data.data.toDate());
      organizadosGrupo.push(grupoJson);
    }
    return organizadosGrupo;
  };

// Adiciona função utilitária para calcular a pontuação de uma aposta em um único jogo
function calculaPontosJogo(golsReal1, golsReal2, golsAposta1, golsAposta2) {
  // Se algum placar não está definido, não há pontos
  if (golsReal1 === null || golsReal2 === null || golsAposta1 === null || golsAposta2 === null) {
    return 0;
  }

  // Regra de pontuação igual à utilizada em Resultados.js
  const cravou = golsReal1 === golsAposta1 && golsReal2 === golsAposta2;
  const acertouVencedor =
    (golsReal1 > golsReal2 && golsAposta1 > golsAposta2) ||
    (golsReal1 < golsReal2 && golsAposta1 < golsAposta2);
  const acertouMargem = golsReal1 - golsReal2 === golsAposta1 - golsAposta2;
  const acertouGols = golsReal1 === golsAposta1 || golsReal2 === golsAposta2;

  if (cravou) return 10;
  if (acertouMargem || (acertouVencedor && acertouGols)) return 7;
  if (acertouVencedor) return 5;
  if (acertouGols) return 2;
  return 0;
}

export {
    timestampToDate,
    timeStampToShortDate,
    timestampToTime,
    getConvocados,
    organizaJogosPorData,
    organizaJogosPorGrupo,
    calculaPontosJogo
}