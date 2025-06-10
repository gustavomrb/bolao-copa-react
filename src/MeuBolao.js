import {
  Alert,
  Autocomplete,
  Button,
  Card,
  Grid,
  IconButton,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useEffect, useState, useRef } from "react";
import { salvarResultados } from "./firebase";
import { useTheme } from "@emotion/react";
import { CalendarMonth, SortByAlphaRounded } from "@mui/icons-material";
import { useContext } from "react";
import { GlobalContext } from "./App";
import { getConvocados, organizaJogosPorData, organizaJogosPorGrupo, timeStampToShortDate, timestampToDate, timestampToTime } from "./utils";

function MeuBolao() {
  const [resultados, setResultados] = useState([]);
  const [jogosShow, setJogosShow] = useState([]);
  const [resultSalvo, setResultSalvo] = useState(false);
  const [resultNaoSalvo, setResultNaoSalvo] = useState(false);
  const [sortValue, setSortValue] = useState("g");
  const [valueArtilheiro, setValueArtilheiro] = useState("");
  const [valueCampeao, setValueCampeao] = useState("");
  const [faseAtual, setFaseAtual] = useState(1);
  const [convocados, setConvocados] = useState([]);
  const carregouInformacoesIniciais = useRef(false);

  const { user, jogosCopa, resultadosUsuarios, selecoesCopa, bolaoAtual, boloes } = useContext(GlobalContext);

  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.only("xs"));

  const organizarPorData = () => {
    setJogosShow(organizaJogosPorData(faseAtual, jogosCopa.current));
    setSortValue("d");
  };

  const organizarPorGrupo = (fase) => {
    setJogosShow(organizaJogosPorGrupo(fase ? fase : faseAtual, jogosCopa.current));
    setSortValue("g");
  };

  const criarNovoResultadoUsuario = () => {
    let novoResult = { campeao: "", artilheiro: "", jogos: {} };
    for (let jogo of jogosCopa.current) {
      novoResult.jogos[jogo.id] = {};
      novoResult.jogos[jogo.id].gols1 = "";
      novoResult.jogos[jogo.id].gols2 = "";
      novoResult.jogos[jogo.id].pontos = "";
    }
    return novoResult;
  };

  const checaNovosResultadosUsuario = (res) => {
    for (let jogo of jogosCopa.current) {
      if (!res.jogos[jogo.id]) {
        res.jogos[jogo.id] = {};
        res.jogos[jogo.id].gols1 = "";
        res.jogos[jogo.id].gols2 = "";
        res.jogos[jogo.id].pontos = "";
      }
    }
    return res;
  };

  useEffect(() => {
    if (resultadosUsuarios.length >= 0) {
      let res = resultadosUsuarios.find((r) => r.id === user.uid);
      if (res && res.data.jogos) {
        res = checaNovosResultadosUsuario(res.data);
      } else {
        res = criarNovoResultadoUsuario();
      }

      setResultados(res);
      setValueCampeao(res.campeao);

      if (jogosShow.length === 0 && jogosCopa.current.length > 0) {
        organizarPorGrupo();
      }

      console.log(selecoesCopa.current);
      if (selecoesCopa.current.length > 0) {
        let convocadosJson = getConvocados(selecoesCopa.current);
        setConvocados(convocadosJson);
        setValueArtilheiro(convocadosJson.find((c) => c.jogador === resultados.artilheiro) || {jogador:"", selecao:""});
      }
      carregouInformacoesIniciais.current = true;
    }
  }, [resultadosUsuarios]);

  useEffect(() => {
    setValueArtilheiro(convocados.find((c) => c.jogador === resultados.artilheiro) || {jogador:"", selecao:""});
  }, [convocados]);

  const handleInputChange = (event, propertyName, idJogo) => {
    const newResultados = JSON.parse(JSON.stringify(resultados));
    newResultados.jogos[idJogo][propertyName] =
      event.target.value !== "" && event.target.value.match(/[0-9]/).length > 0 ? parseInt(event.target.value) : null;
    setResultados(newResultados);
  };

  const handleArtilheiroCampeao = (newValue, propertyName) => {
    const newResultados = JSON.parse(JSON.stringify(resultados));
    newResultados[propertyName] = newValue;
    setResultados(newResultados);
  };

  const calculaPontosGrupo = (grupo) => {
    let ptsGeral = 0;
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
      {carregouInformacoesIniciais.current ? (
        <Grid item xs={12} sm={10} container direction={"column"}>
          <Grid item container xs={12} justifyContent={"end"} sx={{ pt: 1 }}>
            <Grid item xs={4} sm={2} pb={1}>
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
                {boloes
                  .find((b) => b.id === bolaoAtual)
                  .data.fases.map((f) => (
                    <MenuItem value={f.id}>{f.nome}</MenuItem>
                  ))}
              </Select>
            </Grid>
            <Grid item ml={4} mr={"auto"} alignSelf={"center"} visibility={faseAtual === 1 ? "hidden" : "visible"}>
              <Typography color={"red"}>{isXs ? "Apenas os 90 minutos!" : "Contam apenas os 90 minutos!"}</Typography>
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
                        const resultado = resultados.jogos[jo.id];
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
                              <TextField
                                variant="standard"
                                size="small"
                                margin="none"
                                value={resultado.gols1 !== null ? resultado.gols1 : ""}
                                inputProps={{
                                  inputMode: "numeric",
                                  pattern: "[0-9]",
                                  maxLength: 1,
                                  style: { textAlign: "center", fontSize: "0.875rem" },
                                }}
                                sx={{ typography: "body2" }}
                                onChange={(e) => handleInputChange(e, "gols1", jo.id)}
                                //disabled={jo.data.fase === 6 ? false : true}
                                disabled={new Date() > jogosShow[0].jogos[0].data.data.toDate()}
                              />
                            </Grid>
                            <Grid item xs={1}>
                              <Typography variant="body2">x</Typography>
                            </Grid>
                            <Grid item xs={1}>
                              <TextField
                                variant="standard"
                                size="small"
                                margin="none"
                                value={resultado.gols2 !== null ? resultado.gols2 : ""}
                                inputProps={{
                                  inputMode: "numeric",
                                  pattern: "[0-9]*",
                                  maxLength: 1,
                                  style: { textAlign: "center", fontSize: "0.875rem" },
                                }}
                                onChange={(e) => handleInputChange(e, "gols2", jo.id)}
                                //disabled={jo.data.fase === 6 ? false : true}
                                disabled={new Date() > jogosShow[0].jogos[0].data.data.toDate()}
                              />
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
          <Grid item container xs={12} sx={{ pt: 1 }} spacing={2}>
            <Grid item xs={6} sm={4}>
              <Autocomplete
                options={convocados}
                groupBy={(option) => option.selecao}
                getOptionLabel={(option) => option.jogador}
                renderInput={(params) => <TextField {...params} label="Artilheiro" />}
                value={valueArtilheiro}
                onChange={(e, nv) => setValueArtilheiro(nv ? nv : { jogador: "", selecao: "" })}
                inputValue={resultados.artilheiro}
                onInputChange={(e, nv) => handleArtilheiroCampeao(nv, "artilheiro")}
                isOptionEqualToValue={(o, v) => {
                  return o.jogador === v.jogador;
                }}
                defaultValue={{ jogador: "", selecao: "" }}
                disabled={new Date() > jogosShow[0].jogos[0].data.data.toDate()}
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <Autocomplete
                options={[...selecoesCopa.current.map((s) => s.data.nome), ""]}
                getOptionLabel={(option) => option}
                renderInput={(params) => <TextField {...params} label="Campeão" />}
                value={valueCampeao}
                onChange={(e, nv) => setValueCampeao(nv)}
                inputValue={resultados.campeao}
                onInputChange={(e, nv) => handleArtilheiroCampeao(nv, "campeao")}
                disabled={new Date() > jogosShow[0].jogos[0].data.data.toDate()}
              />
            </Grid>
          </Grid>
          <Grid item xs sx={{ p: 3 }} alignSelf={"end"}>
            <Button
              variant="outlined"
              onClick={() => {
                salvarResultados(resultados, user, bolaoAtual, jogosShow[0].jogos[0].data.data.toDate()).then(
                  (salvou) => {
                    if (salvou) {
                      setResultSalvo(true);
                    } else {
                      setResultNaoSalvo(true);
                    }
                  }
                );
                organizarPorGrupo();
              }}
              disabled={new Date() > jogosShow[0].jogos[0].data.data.toDate()}
            >
              Enviar Palpites
            </Button>
          </Grid>
          <Snackbar open={resultSalvo} autoHideDuration={6000} onClose={() => setResultSalvo(false)}>
            <Alert variant="outlined" severity="success" sx={{ mb: 2 }} onClick={() => setResultSalvo(false)}>
              Resultados salvos com sucesso!
            </Alert>
          </Snackbar>
          <Snackbar open={resultNaoSalvo} autoHideDuration={6000} onClose={() => setResultNaoSalvo(false)}>
            <Alert variant="outlined" severity="error" sx={{ mb: 2 }} onClick={() => setResultNaoSalvo(false)}>
              Passou do horário arrombado!
            </Alert>
          </Snackbar>
        </Grid>
      ) : null}
    </Grid>
  );
}

export default MeuBolao;
