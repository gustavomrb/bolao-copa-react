import { Card, Grid, IconButton, TextField, Typography, useMediaQuery } from "@mui/material";
import { useEffect, useState } from "react";
import {
  auth,
  buscaJogosCopa,
  buscarResultados,
  buscarTodosResultados,
  buscaSelecoesCopa,
  buscaUsuario,
  buscaUsuarios,
} from "./firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useTheme } from "@emotion/react";
import { CalendarMonth, SortByAlphaRounded } from "@mui/icons-material";

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
  const [jogosCopa, setJogosCopa] = useState([]);
  const [jogosShow, setJogosShow] = useState([]);
  const [sortValue, setSortValue] = useState("g");
  const [selecoesCopa, setSelecoesCopa] = useState([]);
  const [resultadosUsuarios, setResultadosUsuarios] = useState([]);
  const [todosUsuarios, setTodosUsuarios] = useState([]);

  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.only("xs"));

  const organizarPorData = () => {
    const organizadosData = [];
    const datas = [...new Set(jogosCopa.map((j) => j.data().data.toDate().toLocaleDateString("pt-BR")))];

    for (let data of datas) {
      const dataJson = { data: data, jogos: [] };
      dataJson.jogos = jogosCopa.filter((j) => j.data().data.toDate().toLocaleDateString("pt-BR") === data);
      organizadosData.push(dataJson);
    }
    setJogosShow(organizadosData);
    setSortValue("d");
  };

  const organizarPorGrupo = () => {
    const organizadosGrupo = [];
    const grupos = ["A", "B", "C", "D", "E", "F", "G", "H"];
    for (let grupo of grupos) {
      const grupoJson = { grupo: grupo, jogos: [] };
      grupoJson.jogos = jogosCopa.filter((j) => j.data().grupo === grupo);
      organizadosGrupo.push(grupoJson);
    }
    setJogosShow(organizadosGrupo);
    setSortValue("g");
  };

  const pegaMediaJogo = (idJogo) => {
    let somaPontos = 0;
    let users = 0;
    for (let resUsuario of resultadosUsuarios) {
      const res = resUsuario.data().jogos[idJogo];
      if (!isNaN(res.pontos)) {
        somaPontos += res.pontos;
        users += 1;
      }
    }
    return (somaPontos / users).toFixed(2);
  };

  useEffect(() => {
    if (jogosCopa.length === 0) {
      buscaJogosCopa().then((v) => {
        const jogos = v.docs;
        setJogosCopa(jogos);
      });
    }

    if (jogosShow.length === 0 && jogosCopa.length > 0) {
      organizarPorGrupo();
    }

    if (selecoesCopa.length === 0) {
      buscaSelecoesCopa().then((val) => {
        setSelecoesCopa(val.docs);
      });
    }

    if (todosUsuarios.length === 0) {
      buscaUsuarios().then((v) => setTodosUsuarios(v.docs));
    }

    if (todosUsuarios.length > 0 && resultadosUsuarios.length === 0) {
      const res = {};
      res[todosUsuarios[0].id] = buscarResultados({ uid: todosUsuarios[0].id });
      setResultadosUsuarios(res);
    }
  }, [jogosCopa]);

  const handleInputChange = (event, propertyName, idJogo) => {
    const newJogosCopa = JSON.parse(JSON.stringify(jogosCopa));
    const jogo = newJogosCopa.find((j) => j.id === idJogo);
    jogo.data()[propertyName] =
      event.target.value !== "" && event.target.value.match(/[0-9]/).length > 0 ? parseInt(event.target.value) : null;
    setJogosCopa(newJogosCopa);
  };

  return (
    <Grid container justifyContent={"center"} alignItems={"center"}>
      {jogosShow && selecoesCopa && resultadosUsuarios ? (
        <Grid item xs={12} sm={10} container direction={"column"}>
          <Grid item container xs={12} justifyContent={"end"} sx={{ pt: 1 }}>
            <Grid item>
              <IconButton onClick={organizarPorGrupo}>
                <SortByAlphaRounded />
              </IconButton>
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
                  <Grid item xs={2}>
                    <Typography variant="body2">Média</Typography>
                  </Grid>
                </Grid>
                <Grid item>
                  <Card elevation={3} sx={{ pt: 1.5, pb: 1, borderRadius: 4 }}>
                    <Grid container direction={"column"} spacing={2}>
                      {j.jogos.map((jo, k) => {
                        const time1 = selecoesCopa.find((s) => s.id === jo.data().times[0]);
                        const time2 = selecoesCopa.find((s) => s.id === jo.data().times[1]);
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
                                {isXs ? pegaDataCurta(jo.data().data) : pegaData(jo.data().data)}
                              </Typography>
                            </Grid>
                            <Grid item xs={3}>
                              <Typography variant="body2">{pegaHorario(jo.data().data)}</Typography>
                            </Grid>
                            <Grid item xs={1} sm={3} display={sortValue === "g" ? "none" : "block"}>
                              <Typography variant="body2">{jo.data().grupo}</Typography>
                            </Grid>
                            <Grid item xs={6.5} sm={5}>
                              <Typography variant="body2">{time1.data().nome}</Typography>
                            </Grid>
                            <Grid item xs={1}>
                              {userBanco.isAdmin ? (
                                <TextField
                                  variant="standard"
                                  size="small"
                                  margin="none"
                                  value={jo.data().gols1}
                                  inputProps={{
                                    inputMode: "numeric",
                                    pattern: "[0-9]",
                                    maxLength: 1,
                                    style: { textAlign: "center", fontSize: "0.875rem" },
                                  }}
                                  sx={{ typography: "body2" }}
                                  onChange={(e) => handleInputChange(e, "gols1", jo.id)}
                                />
                              ) : (
                                <Typography>{jo.data().gols1 ? jo.data().gols1 : "-"}</Typography>
                              )}
                            </Grid>
                            <Grid item xs={1}>
                              <Typography>x</Typography>
                            </Grid>
                            <Grid item xs={1}>
                              {userBanco.isAdmin ? (
                                <TextField
                                  variant="standard"
                                  size="small"
                                  margin="none"
                                  value={jo.data().gols2}
                                  inputProps={{
                                    inputMode: "numeric",
                                    pattern: "[0-9]",
                                    maxLength: 1,
                                    style: { textAlign: "center", fontSize: "0.875rem" },
                                  }}
                                  sx={{ typography: "body2" }}
                                  onChange={(e) => handleInputChange(e, "gols2", jo.id)}
                                />
                              ) : (
                                <Typography>{jo.data().gols2 ? jo.data().gols2 : "-"}</Typography>
                              )}
                            </Grid>
                            <Grid item xs={6.5} sm={5}>
                              <Typography variant="body2">{time2.data().nome}</Typography>
                            </Grid>
                            <Grid item xs={2}>
                              <Typography variant="body2">{pegaMediaJogo(jo.id)}</Typography>
                            </Grid>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Card>
                </Grid>
                <Grid item p={2} alignSelf={"end"}>
                  <Typography variant="body1">
                    {sortValue === "g" ? `Pontos no Grupo ${j.grupo}:` : "Pontos no Dia:"}
                  </Typography>
                </Grid>
              </Grid>
            );
          })}
          <Grid item container xs={12} sx={{ pt: 1 }} spacing={2}>
            <Grid item xs={6} sm={4}></Grid>
            <Grid item xs={6} sm={4}></Grid>
          </Grid>
        </Grid>
      ) : null}
    </Grid>
  );
}

export default Secada;
