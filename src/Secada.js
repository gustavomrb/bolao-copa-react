import { Card, Grid, IconButton, MenuItem, Select, Typography, useMediaQuery } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { buscaUsuarios } from "./firebase";
import { useTheme } from "@emotion/react";
import { CalendarMonth, SortByAlphaRounded } from "@mui/icons-material";
import { GlobalContext } from "./App";

const pegaData = (timestamp) => {
  const date = timestamp.toDate();
  return date.toLocaleDateString("pt-BR");
};

const pegaDataCurta = (timestamp) => {
  const date = timestamp.toDate().toLocaleDateString("pt-BR").split("/");
  return `${date[0]}/${date[1]}`;
};

const pegaHorario = (timestamp) => {
  const date = timestamp.toDate().toLocaleTimeString("pt-BR").split(":");
  return `${date[0]}:${date[1]}`;
};

function Secada() {
  const [jogosShow, setJogosShow] = useState([]);
  const [sortValue, setSortValue] = useState("g");
  const [usuarioAtual, setUsuarioAtual] = useState("");
  const [faseAtual, setFaseAtual] = useState(1);

  const { jogosCopa, resultadosUsuarios, selecoesCopa, todosUsuarios, setTodosUsuarios } = useContext(GlobalContext);

  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.only("xs"));

  const organizarPorData = () => {
    const organizadosData = [];
    const datas = [
      ...new Set(
        jogosCopa.current
          .filter((j) => j.data.fase === faseAtual)
          .map((j) => j.data.data.toDate().toLocaleDateString("pt-BR"))
      ),
    ];

    for (let data of datas) {
      const dataJson = { data: data, jogos: [] };
      dataJson.jogos = jogosCopa.current.filter(
        (j) => j.data.data.toDate().toLocaleDateString("pt-BR") === data && j.data.fase === faseAtual
      );
      organizadosData.push(dataJson);
    }
    setJogosShow(organizadosData);
    setSortValue("d");
  };

  const organizarPorGrupo = () => {
    console.log("entrou organizar");
    const organizadosGrupo = [];
    const grupos = faseAtual === 1 ? [...new Set(jogosCopa.current.map((item) => item.data.grupo))].sort() : ["A"];
    for (let grupo of grupos) {
      const grupoJson = { grupo: grupo, jogos: [] };
      grupoJson.jogos = jogosCopa.current
        .filter((j) => j.data.grupo === grupo && j.data.fase === faseAtual)
        .sort((a, b) => a.data.data.toDate() - b.data.data.toDate());
      organizadosGrupo.push(grupoJson);
    }
    setJogosShow(organizadosGrupo);
    setSortValue("g");
  };

  useEffect(() => {
    if (jogosShow.length === 0 && jogosCopa.current.length > 0) {
      organizarPorGrupo();
    }

    if (todosUsuarios.length === 0) {
      buscaUsuarios().then((v) => {
        setTodosUsuarios(v.docs.map((u) => ({ id: u.id, data: u.data() })));
        setUsuarioAtual(v.docs[0].id);
      });
    }

    if (!usuarioAtual && todosUsuarios.length > 0) {
      setUsuarioAtual(todosUsuarios[0].id);
    }
  }, [jogosCopa.current, todosUsuarios]);

  useEffect(() => {
    organizarPorGrupo();
  }, [faseAtual]);

  const calculaPontosGrupo = (grupo) => {
    let ptsGeral = 0;
    const resultados = resultadosUsuarios.find((r) => r.id === usuarioAtual).data;
    const jogosGrupo = jogosCopa.current.filter((j) => j.data.grupo === grupo && j.data.fase === faseAtual);
    for (let jogo of jogosGrupo) {
      const ptsJogo = resultados.jogos[jogo.id].pontos;
      if (ptsJogo !== "") {
        ptsGeral += ptsJogo;
      }
    }
    return ptsGeral;
  };

  const calculaPontosData = (data) => {
    let ptsGeral = 0;
    const resultados = resultadosUsuarios.find((r) => r.id === usuarioAtual).data;
    const jogosGrupo = jogosCopa.current.filter((j) => j.data.data.toDate().toLocaleDateString("pt-BR") === data);
    for (let jogo of jogosGrupo) {
      const ptsJogo = resultados.jogos[jogo.id].pontos;
      if (ptsJogo !== "") {
        ptsGeral += ptsJogo;
      }
    }
    return ptsGeral;
  };

  return (
    <Grid container justifyContent={"center"} alignItems={"center"}>
      {jogosShow && selecoesCopa.current && resultadosUsuarios && usuarioAtual ? (
        <Grid item xs={12} sm={10} container direction={"column"}>
          <Grid item container xs={12} justifyContent={"end"} sx={{ pt: 1 }}>
            <Grid item xs={4} sm={2} pb={1}>
              <Select value={faseAtual} fullWidth onChange={(e) => setFaseAtual(e.target.value)} size={"small"}>
                <MenuItem value={1}>Primeira Fase</MenuItem>
                <MenuItem value={2}>Oitavas de Final</MenuItem>
                <MenuItem value={3}>Quartas de Final</MenuItem>
                <MenuItem value={4}>Semi-Final</MenuItem>
                <MenuItem value={5}>Final e 3 lugar</MenuItem>
              </Select>
            </Grid>
            <Grid item xs={4} sm={2} mr={"auto"} pb={1}>
              <Select value={usuarioAtual} fullWidth onChange={(e) => setUsuarioAtual(e.target.value)} size={"small"}>
                {resultadosUsuarios.map((u, i) => (
                  <MenuItem value={u.id} key={i}>
                    {todosUsuarios.find((t) => t.id === u.id).data.nome}
                  </MenuItem>
                ))}
              </Select>
            </Grid>
            <Grid item>
              <IconButton onClick={organizarPorGrupo}>
                <SortByAlphaRounded />
              </IconButton>
            </Grid>
            <Grid item>
              <IconButton onClick={organizarPorData}>
                <CalendarMonth />
              </IconButton>
            </Grid>
          </Grid>
          {jogosShow.map((j, i) => {
            return (
              <Grid container item xs={12} direction={"column"} key={i}>
                <Grid item sx={{ pb: 1 }}>
                  <Typography variant="h6">{sortValue === "g" ? `Grupo ${j.grupo}` : j.data}</Typography>
                </Grid>
                <Grid item xs={6} container columns={30} sx={{ pt: 1, pb: 1 }} justifyContent={"space-evenly"}>
                  <Grid item xs={4} sm={5} display={sortValue === "d" ? "none" : "block"}>
                    <Typography variant="body2">Data</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2">{isXs ? "Hora" : "Horário"}</Typography>
                  </Grid>
                  <Grid item xs={1} sm={3} display={sortValue === "g" ? "none" : "block"}>
                    <Typography variant="body2">{isXs ? "G" : "Grupo"}</Typography>
                  </Grid>
                  <Grid item xs={6.5} sm={5}>
                    <Typography variant="body2">1</Typography>
                  </Grid>
                  <Grid item xs={1}></Grid>
                  <Grid item xs={1}></Grid>
                  <Grid item xs={1}></Grid>
                  <Grid item xs={6.5} sm={5}>
                    <Typography variant="body2">2</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2">{isXs ? "Res" : "Resultado"}</Typography>
                  </Grid>
                  <Grid item xs={3} sm={3}>
                    <Typography variant="body2">Pts</Typography>
                  </Grid>
                </Grid>
                <Grid item>
                  <Card elevation={3} sx={{ pt: 1.5, pb: 1, borderRadius: 4 }}>
                    <Grid container direction={"column"} spacing={2}>
                      {j.jogos.map((jo, k) => {
                        const resultado = resultadosUsuarios.find((r) => r.id === usuarioAtual).data.jogos[jo.id];
                        const time1 = selecoesCopa.current.find((s) => s.id === jo.data.times[0]);
                        const time2 = selecoesCopa.current.find((s) => s.id === jo.data.times[1]);
                        return (
                          <Grid
                            item
                            xs={6}
                            key={k}
                            container
                            columns={30}
                            sx={k === j.jogos.length - 1 ? {} : { borderBottom: 1, pb: 1 }}
                            justifyContent={"space-evenly"}
                          >
                            <Grid item xs={4} sm={5} display={sortValue === "d" ? "none" : "block"}>
                              <Typography variant="body2">
                                {isXs ? pegaDataCurta(jo.data.data) : pegaData(jo.data.data)}
                              </Typography>
                            </Grid>
                            <Grid item xs={3}>
                              <Typography variant="body2">{pegaHorario(jo.data.data)}</Typography>
                            </Grid>
                            <Grid item xs={1} sm={3} display={sortValue === "g" ? "none" : "block"}>
                              <Typography variant="body2">{jo.data.grupo}</Typography>
                            </Grid>
                            <Grid item xs={6.5} sm={5}>
                              <Typography variant="body2">{time1.data.nome}</Typography>
                            </Grid>
                            <Grid item xs={1}>
                              <Typography>{resultado.gols1 !== "" ? resultado.gols1 : "-"}</Typography>
                            </Grid>
                            <Grid item xs={1}>
                              <Typography>x</Typography>
                            </Grid>
                            <Grid item xs={1}>
                              <Typography>{resultado.gols2 !== "" ? resultado.gols2 : "-"}</Typography>
                            </Grid>
                            <Grid item xs={6.5} sm={5}>
                              <Typography variant="body2">{time2.data.nome}</Typography>
                            </Grid>
                            <Grid item xs={3}>
                              <Typography variant="body2">
                                {jo.data.gols1 === null || jo.data.gols1 === undefined
                                  ? "-"
                                  : `${jo.data.gols1} x ${jo.data.gols2}`}
                              </Typography>
                            </Grid>
                            <Grid item xs={3} sm={3}>
                              <Typography variant="body2">
                                {resultado.pontos === "" ? "-" : resultado.pontos}
                              </Typography>
                            </Grid>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Card>
                </Grid>
                <Grid item p={2} alignSelf={"end"}>
                  <Typography variant="body1">
                    {sortValue === "g"
                      ? `Pontos no Grupo ${j.grupo}: ${calculaPontosGrupo(j.grupo)}`
                      : `Pontos no Dia: ${calculaPontosData(j.data)}`}
                  </Typography>
                </Grid>
              </Grid>
            );
          })}

          <Grid item container direction={"column"} xs={12} sx={{ pt: 1, pb: 2 }} spacing={2}>
            <Grid item xs={3} sm={3}>
              <Typography>{`Artilheiro: ${
                resultadosUsuarios.find((r) => r.id === usuarioAtual).data.artilheiro
              }`}</Typography>
            </Grid>
            <Grid item xs={3} sm={3}>
              <Typography>{`Campeão: ${
                resultadosUsuarios.find((r) => r.id === usuarioAtual).data.campeao
              }`}</Typography>
            </Grid>
          </Grid>
        </Grid>
      ) : null}
    </Grid>
  );
}

export default Secada;
