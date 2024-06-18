import { Button, Card, Grid, IconButton, MenuItem, Select, TextField, Typography, useMediaQuery } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { atualizaPontosUsuario, buscaUsuarios, updateJogoCopa } from "./firebase";
import { useTheme } from "@emotion/react";
import { CalendarMonth, SortByAlphaRounded } from "@mui/icons-material";
import { GlobalContext } from "./App";
import cloneDeep from "lodash.clonedeep";

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

function Resultados() {
  const [jogosCopaNew, setJogosCopaNew] = useState([]);
  const [jogosCopaOld, setJogosCopaOld] = useState([]);
  const [jogosShow, setJogosShow] = useState([]);
  const [sortValue, setSortValue] = useState("g");
  const [userBanco, setUserBanco] = useState(null);
  const [faseAtual, setFaseAtual] = useState(1);

  const { user, jogosCopa, resultadosUsuarios, selecoesCopa, todosUsuarios, setTodosUsuarios, bolaoAtual } =
    useContext(GlobalContext);

  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.only("xs"));

  const organizarPorData = (fase) => {
    fase = fase ? fase : faseAtual;
    const organizadosData = [];
    const datas = [
      ...new Set(
        jogosCopaNew.filter((j) => j.data.fase === fase).map((j) => j.data.data.toDate().toLocaleDateString("pt-BR"))
      ),
    ].sort();

    for (let data of datas) {
      const dataJson = { data: data, jogos: [] };
      dataJson.jogos = jogosCopaNew
        .filter((j) => j.data.data.toDate().toLocaleDateString("pt-BR") === data && j.data.fase === fase)
        .sort((a, b) => a.data.data - b.data.data);
      organizadosData.push(dataJson);
    }
    setJogosShow(organizadosData);
    setSortValue("d");
  };

  const organizarPorGrupo = (fase) => {
    fase = fase ? fase : faseAtual;
    const organizadosGrupo = [];
    const grupos = fase === 1 ? [...new Set(jogosCopaNew.map((item) => item.data.grupo))].sort() : ["A"];
    for (let grupo of grupos) {
      const grupoJson = { grupo: grupo, jogos: [] };
      grupoJson.jogos = jogosCopaNew
        .filter((j) => j.data.grupo === grupo && j.data.fase === fase)
        .sort((a, b) => a.data.data.toDate() - b.data.data.toDate());
      organizadosGrupo.push(grupoJson);
    }
    setJogosShow(organizadosGrupo);
    setSortValue("g");
  };

  const pegaMediaJogo = (idJogo) => {
    let somaPontos = 0;
    let users = 0;
    for (let resUsuario of resultadosUsuarios) {
      const res = resUsuario.data.jogos[idJogo];
      if (!isNaN(res.pontos)) {
        somaPontos += res.pontos;
        users += 1;
      }
    }
    return (somaPontos / users).toFixed(2);
  };

  const salvaResultadosGeral = () => {
    for (let jogoCopaNew of jogosCopaNew) {
      const jogoCopaOld = jogosCopaOld.find((j) => j.id === jogoCopaNew.id);
      if (
        jogoCopaNew.data.gols1 !== undefined &&
        (jogoCopaOld.data.gols1 !== jogoCopaNew.data.gols1 || jogoCopaOld.data.gols2 !== jogoCopaNew.data.gols2)
      ) {
        console.log("entrou");
        updateJogoCopa(bolaoAtual, jogoCopaNew.id, jogoCopaNew.data);
        for (let resUsuario of resultadosUsuarios) {
          if (jogoCopaNew.data.gols1 === null) {
            const jogoUsuario = resUsuario.data.jogos[jogoCopaNew.id];
            jogoUsuario.pontos = "";
            atualizaPontosUsuario(bolaoAtual, resUsuario.id, jogoCopaNew.id, "");
          } else {
            let pontos = 0;
            const jogoUsuario = resUsuario.data.jogos[jogoCopaNew.id];
            const cravou = jogoCopaNew.data.gols1 === jogoUsuario.gols1 && jogoCopaNew.data.gols2 === jogoUsuario.gols2;
            const acertouVencedor =
              (jogoCopaNew.data.gols1 > jogoCopaNew.data.gols2 && jogoUsuario.gols1 > jogoUsuario.gols2) ||
              (jogoCopaNew.data.gols1 < jogoCopaNew.data.gols2 && jogoUsuario.gols1 < jogoUsuario.gols2);
            const acertouMargem =
              jogoCopaNew.data.gols1 - jogoCopaNew.data.gols2 === jogoUsuario.gols1 - jogoUsuario.gols2;
            const acertouGols =
              jogoCopaNew.data.gols1 === jogoUsuario.gols1 || jogoCopaNew.data.gols2 === jogoUsuario.gols2;

            if (cravou) {
              pontos = 10;
            } else if (acertouMargem || (acertouVencedor && acertouGols)) {
              pontos = 7;
            } else if (acertouVencedor) {
              pontos = 5;
            } else if (acertouGols) {
              pontos = 2;
            }
            jogoUsuario.pontos = pontos;
            atualizaPontosUsuario(bolaoAtual, resUsuario.id, jogoCopaNew.id, pontos);
          }
        }
      }
    }
    setJogosCopaOld(jogosCopaNew);
    setJogosCopaNew(cloneDeep(jogosCopaNew));
  };

  useEffect(() => {
    if (jogosCopaNew.length === 0) {
      setJogosCopaNew(cloneDeep(jogosCopa.current));
      setJogosCopaOld(cloneDeep(jogosCopa.current));
    }

    if (jogosShow.length === 0 && jogosCopaNew.length > 0) {
      organizarPorGrupo();
    }
    if (todosUsuarios.length === 0) {
      buscaUsuarios().then((v) => {
        setTodosUsuarios(v.docs.map((u) => ({ id: u.id, data: u.data() })));
      });
    }

    if (user && !userBanco && todosUsuarios.length > 0) {
      setUserBanco(todosUsuarios.find((u) => u.id === user.uid).data);
    }
  }, [jogosCopaNew, user, todosUsuarios]);

  const handleInputChange = (event, propertyName, idJogo) => {
    const jogo = jogosCopaNew.find((j) => {
      return j.id === idJogo;
    });
    jogo.data[propertyName] =
      event.target.value !== "" && event.target.value.match(/[0-9]/).length > 0 ? parseInt(event.target.value) : null;
    setJogosCopaNew(jogosCopaNew);
    organizarPorGrupo();
  };

  return (
    <Grid container justifyContent={"center"} alignItems={"center"}>
      {jogosShow && selecoesCopa.current && resultadosUsuarios && userBanco ? (
        <Grid item xs={12} sm={10} container direction={"column"}>
          <Grid item container xs={12} justifyContent={"end"} sx={{ pt: 1 }}>
            <Grid item xs={4} sm={2} mr={"auto"} pb={1}>
              <Select
                value={faseAtual}
                fullWidth
                onChange={(e) => {
                  const fase = parseInt(e.target.value);
                  setFaseAtual(fase);
                  organizarPorGrupo(fase);
                }}
                size={"small"}
              >
                <MenuItem value={1}>Primeira Fase</MenuItem>
                <MenuItem value={2}>Oitavas de Final</MenuItem>
                <MenuItem value={3}>Quartas de Final</MenuItem>
                <MenuItem value={4}>Semi-Final</MenuItem>
                <MenuItem value={5}>Final e 3 lugar</MenuItem>
              </Select>
            </Grid>
            <Grid item>
              <IconButton onClick={() => organizarPorGrupo()}>
                <SortByAlphaRounded />
              </IconButton>
            </Grid>
            <Grid>
              <IconButton onClick={() => organizarPorData()}>
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
                  <Grid item xs={6} sm={2}>
                    <Typography variant="body2">Média</Typography>
                  </Grid>
                </Grid>
                <Grid item>
                  <Card elevation={3} sx={{ pt: 1.5, pb: 1, borderRadius: 4 }}>
                    <Grid container direction={"column"} spacing={2}>
                      {j.jogos.map((jo, k) => {
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
                              {userBanco.isAdmin ? (
                                <TextField
                                  variant="standard"
                                  size="small"
                                  margin="none"
                                  value={jo.data.gols1 === null ? "" : jo.data.gols1}
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
                                <Typography>{jo.data.gols1 !== "" ? jo.data.gols1 : "-"}</Typography>
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
                                  value={jo.data.gols2 === null ? "" : jo.data.gols2}
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
                                <Typography>{jo.data.gols2 !== "" ? jo.data.gols2 : "-"}</Typography>
                              )}
                            </Grid>
                            <Grid item xs={6.5} sm={5}>
                              <Typography variant="body2">{time2.data.nome}</Typography>
                            </Grid>
                            <Grid item xs={6} sm={2}>
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
          <Grid item xs sx={{ p: 3 }} alignSelf={"end"} display={userBanco.isAdmin}>
            <Button
              variant="outlined"
              onClick={() => {
                salvaResultadosGeral();
              }}
            >
              Gravar resultados
            </Button>
          </Grid>
        </Grid>
      ) : null}
    </Grid>
  );
}

export default Resultados;
