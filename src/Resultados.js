import { Autocomplete, Button, Card, Grid, IconButton, MenuItem, Select, TextField, Typography, useMediaQuery } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { atualizaPontosUsuario, updateJogoCopa, updateArtilheiroCampeao } from "./firebase";
import { useTheme } from "@emotion/react";
import { CalendarMonth, SortByAlphaRounded } from "@mui/icons-material";
import { GlobalContext } from "./App";
import cloneDeep from "lodash.clonedeep";
import { calculaPontosJogo, getConvocados, timestampToDate, timeStampToShortDate, timestampToTime } from "./utils";

function Resultados() {
  const [jogosCopaNew, setJogosCopaNew] = useState([]);
  const [jogosCopaOld, setJogosCopaOld] = useState([]);
  const [jogosShow, setJogosShow] = useState([]);
  const [sortValue, setSortValue] = useState("g");
  const [faseAtual, setFaseAtual] = useState(1);
  const [valueArtilheiro, setValueArtilheiro] = useState({ jogador: "", selecao: "" });
  const [valueCampeao, setValueCampeao] = useState("");
  const [adminArtilheiro, setAdminArtilheiro] = useState("");
  const [adminCampeao, setAdminCampeao] = useState("");
  const [convocados, setConvocados] = useState([]);

  const {
    jogosCopa,
    resultadosUsuarios,
    selecoesCopa,
    bolaoAtual,
    boloes,
    artilheiroAtual,
    campeaoAtual,
    isAdmin,
  } = useContext(GlobalContext);
  const resultadosDisponiveis = resultadosUsuarios || [];
  const bolaoSelecionado = boloes.find((b) => b.id === bolaoAtual);

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

  const organizarPorGrupo = (fase, games = jogosCopaNew) => {
    fase = fase ? fase : faseAtual;
    const organizadosGrupo = [];
    const grupos = fase === 1
      ? [...new Set(
          games
            .filter((item) => item.data.fase === fase)
            .map((item) => item.data.grupo),
        )].sort()
      : ["A"];
    for (let grupo of grupos) {
      const grupoJson = { grupo: grupo, jogos: [] };
      grupoJson.jogos = games
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
    for (let resUsuario of resultadosDisponiveis) {
      const pontos = resUsuario.data.jogos[idJogo]?.pontos;
      if (pontos !== "" && pontos !== null && pontos !== undefined && Number.isFinite(Number(pontos))) {
        somaPontos += Number(pontos);
        users += 1;
      }
    }
    return users > 0 ? (somaPontos / users).toFixed(2) : "-";
  };

  const salvaResultadosGeral = async () => {
    if (!isAdmin) return;
    const updates = [];

    for (let jogoCopaNew of jogosCopaNew) {
      const jogoCopaOld = jogosCopaOld.find((j) => j.id === jogoCopaNew.id);
      if (!jogoCopaOld) continue;
      if (
        jogoCopaNew.data.gols1 !== undefined &&
        (jogoCopaOld.data.gols1 !== jogoCopaNew.data.gols1 || jogoCopaOld.data.gols2 !== jogoCopaNew.data.gols2)
      ) {
        updates.push(updateJogoCopa(bolaoAtual, jogoCopaNew.id, jogoCopaNew.data));
        for (let resUsuario of resultadosDisponiveis) {
          if (resUsuario.data.jogos[jogoCopaNew.id]) {
            if (jogoCopaNew.data.gols1 === null) {
              updates.push(atualizaPontosUsuario(
                bolaoAtual,
                jogoCopaNew.data.fase,
                resUsuario.id,
                jogoCopaNew.id,
                "",
              ));
            } else {
              const jogoUsuario = resUsuario.data.jogos[jogoCopaNew.id];
              const pontos = calculaPontosJogo(
                jogoCopaNew.data.gols1,
                jogoCopaNew.data.gols2,
                jogoUsuario.gols1,
                jogoUsuario.gols2,
              );
              updates.push(atualizaPontosUsuario(
                bolaoAtual,
                jogoCopaNew.data.fase,
                resUsuario.id,
                jogoCopaNew.id,
                pontos,
              ));
            }
          }
        }
      }
    }
    updates.push(updateArtilheiroCampeao(bolaoAtual, adminArtilheiro, adminCampeao));
    await Promise.all(updates);
    setJogosCopaOld(cloneDeep(jogosCopaNew));
    setJogosCopaNew(cloneDeep(jogosCopaNew));
  };

  useEffect(() => {
    const jogos = cloneDeep(jogosCopa.current);
    setJogosCopaNew(jogos);
    setJogosCopaOld(cloneDeep(jogos));
    setJogosShow([]);
    const fase = bolaoSelecionado?.data.faseAtual || 1;
    setFaseAtual(fase);
  }, [bolaoAtual, bolaoSelecionado, jogosCopa]);

  useEffect(() => {
    if (jogosShow.length === 0 && jogosCopaNew.length > 0) {
      organizarPorGrupo();
    }
  }, [jogosCopaNew, jogosShow.length]);

  useEffect(() => {
    if (selecoesCopa.current && selecoesCopa.current.length > 0) {
      const convocadosJson = getConvocados(selecoesCopa.current);
      setConvocados(convocadosJson);

      const foundArtilheiro = convocadosJson.find((c) => c.jogador === artilheiroAtual);
      setValueArtilheiro(foundArtilheiro || { jogador: "", selecao: "" });
      setAdminArtilheiro(artilheiroAtual || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selecoesCopa.current, artilheiroAtual]);

  useEffect(() => {
    if (campeaoAtual) {
      setValueCampeao(campeaoAtual);
      setAdminCampeao(campeaoAtual);
    } else {
      setValueCampeao("");
      setAdminCampeao("");
    }
  }, [campeaoAtual]);

  const handleInputChange = (event, propertyName, idJogo) => {
    const parsedValue = /^\d$/.test(event.target.value)
      ? parseInt(event.target.value, 10)
      : null;
    const nextGames = jogosCopaNew.map((jogo) =>
      jogo.id === idJogo
        ? {
            ...jogo,
            data: {
              ...jogo.data,
              [propertyName]: parsedValue,
            },
          }
        : jogo
    );
    setJogosCopaNew(nextGames);
    organizarPorGrupo(faseAtual, nextGames);
  };

  return (
    <Grid container justifyContent={"center"} alignItems={"center"}>
      {bolaoSelecionado && jogosShow && selecoesCopa.current && resultadosUsuarios ? (
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
                {bolaoSelecionado.data.fases.map((f) => (
                    <MenuItem value={f.id} key={f.id}>{f.nome}</MenuItem>
                  ))}
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
                        const jogoJaComecou = Date.now() >= jo.data.data.toMillis();
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
                                {isXs ? timeStampToShortDate(jo.data.data) : timestampToDate(jo.data.data)}
                              </Typography>
                            </Grid>
                            <Grid item xs={3}>
                              <Typography variant="body2">{timestampToTime(jo.data.data)}</Typography>
                            </Grid>
                            <Grid item xs={1} sm={3} display={sortValue === "g" ? "none" : "block"}>
                              <Typography variant="body2">{jo.data.grupo}</Typography>
                            </Grid>
                            <Grid item xs={6.5} sm={5}>
                              <Typography variant="body2">{time1.data.nome}</Typography>
                            </Grid>
                            <Grid item xs={1}>
                              {isAdmin && jogoJaComecou ? (
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
                                <Typography>
                                  {jo.data.gols1 === null || jo.data.gols1 === undefined ? "-" : jo.data.gols1}
                                </Typography>
                              )}
                            </Grid>
                            <Grid item xs={1}>
                              <Typography>x</Typography>
                            </Grid>
                            <Grid item xs={1}>
                              {isAdmin && jogoJaComecou ? (
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
                                <Typography>
                                  {jo.data.gols2 === null || jo.data.gols2 === undefined ? "-" : jo.data.gols2}
                                </Typography>
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
          <Grid item container xs={12} sx={{ pt: 1, pb: 2 }} spacing={2}>
            <Grid item xs={6} sm={4}>
              <Autocomplete
                options={convocados}
                groupBy={(option) => option.selecao}
                getOptionLabel={(option) => option.jogador}
                renderInput={(params) => <TextField {...params} label="Artilheiro Oficial" />}
                value={valueArtilheiro}
                onChange={(e, nv) => {
                  setValueArtilheiro(nv ? nv : { jogador: "", selecao: "" });
                  setAdminArtilheiro(nv ? nv.jogador : "");
                }}
                inputValue={adminArtilheiro}
                onInputChange={(e, nv) => setAdminArtilheiro(nv)}
                isOptionEqualToValue={(o, v) => o.jogador === v.jogador}
                disabled={!isAdmin}
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <Autocomplete
                options={[...selecoesCopa.current.map((s) => s.data.nome), ""]}
                getOptionLabel={(option) => option}
                renderInput={(params) => <TextField {...params} label="Campeão Oficial" />}
                value={valueCampeao}
                onChange={(e, nv) => setValueCampeao(nv || "")}
                inputValue={adminCampeao}
                onInputChange={(e, nv) => setAdminCampeao(nv)}
                disabled={!isAdmin}
              />
            </Grid>
          </Grid>
          {isAdmin && (
            <Grid item xs sx={{ p: 3 }} alignSelf={"end"}>
              <Button
                variant="outlined"
                onClick={salvaResultadosGeral}
              >
                Gravar resultados
              </Button>
            </Grid>
          )}
        </Grid>
      ) : null}
    </Grid>
  );
}

export default Resultados;
