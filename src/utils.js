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
          .map((j) => j.data.data.toDate()).sort().map(d => d.toLocaleDateString("pt-BR"))
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

export {
    timestampToDate,
    timeStampToShortDate,
    timestampToTime,
    getConvocados,
    organizaJogosPorData,
    organizaJogosPorGrupo
}