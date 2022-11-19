import {
  Alert,
  Autocomplete,
  Button,
  Card,
  Grid,
  IconButton,
  Snackbar,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useEffect, useState } from "react";
import {
  auth,
  buscaJogosCopa,
  buscarResultados,
  buscaSelecoesCopa,
  criarResultados,
  salvarResultados,
} from "./firebase";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { useTheme } from "@emotion/react";
import { CalendarMonth, SortByAlphaRounded } from "@mui/icons-material";
import convocadosJson from "./convocados.json";
import selecoesJson from "./selecoes.json";

const getConvocados = () => {
  const convocados = [];
  convocados.push({ selecao: "", jogador: "" });
  for (let listaSelecoes of convocadosJson) {
    for (let jogador of listaSelecoes.jogadores) {
      convocados.push({ selecao: listaSelecoes.selecao, jogador: jogador });
    }
  }
  return convocados;
};

const convocados = getConvocados();

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

function MeuBolao() {
  const [resultados, setResultados] = useState();
  const [jogosCopa, setJogosCopa] = useState([]);
  const [jogosShow, setJogosShow] = useState([]);
  const [resultSalvo, setResultSalvo] = useState(false);
  const [sortValue, setSortValue] = useState("g");
  const [selecoesCopa, setSelecoesCopa] = useState([]);
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [valueArtilheiro, setValueArtilheiro] = useState();
  const [valueCampeao, setValueCampeao] = useState();

  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.only("xs"));

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

  useEffect(() => {
    if (jogosCopa.length === 0) {
      buscaJogosCopa().then((v) => {
        setJogosCopa(v.docs);
        buscarResultados(user).then((r) => {
          if (r) {
            setResultados(r);
            setValueArtilheiro(convocados.find((c) => c.jogador === r.artilheiro));
            setValueCampeao(selecoesJson.find((s) => s.nome === r.campeao));
          } else {
            criarResultados(v, user).then((r) => {
              setResultados(r);
            });
          }
        });
      });
    }

    if (jogosShow.length === 0 && jogosCopa.length > 0) {
      organizarPorGrupo();
    }
    if (selecoesCopa.length === 0) {
      buscaSelecoesCopa().then((v) => setSelecoesCopa(v.docs));
    }
  }, [navigate, jogosCopa]);

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

  return (
    <Grid container justifyContent={"center"} alignItems={"center"}>
      {jogosShow && resultados && selecoesCopa ? (
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
                              <TextField
                                variant="standard"
                                size="small"
                                margin="none"
                                value={resultado.gols1}
                                inputProps={{
                                  inputMode: "numeric",
                                  pattern: "[0-9]",
                                  maxLength: 1,
                                  style: { textAlign: "center", fontSize: "0.875rem" },
                                }}
                                sx={{ typography: "body2" }}
                                onChange={(e) => handleInputChange(e, "gols1", jo.id)}
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
                                value={resultado.gols2}
                                inputProps={{
                                  inputMode: "numeric",
                                  pattern: "[0-9]*",
                                  maxLength: 1,
                                  style: { textAlign: "center", fontSize: "0.875rem" },
                                }}
                                onChange={(e) => handleInputChange(e, "gols2", jo.id)}
                              />
                            </Grid>
                            <Grid item xs={6.5} sm={5}>
                              <Typography variant="body2">{time2.data().nome}</Typography>
                            </Grid>
                            <Grid item xs={3}>
                              <Typography variant="body2">-</Typography>
                            </Grid>
                            <Grid item xs={3} sm={3}>
                              <Typography variant="body2">-</Typography>
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
            <Grid item xs={6} sm={4}>
              <Autocomplete
                options={convocados}
                groupBy={(option) => option.selecao}
                getOptionLabel={(option) => option.jogador}
                renderInput={(params) => <TextField {...params} label="Artilheiro" />}
                value={valueArtilheiro}
                onChange={(e, nv) => setValueArtilheiro(nv)}
                inputValue={resultados.artilheiro}
                onInputChange={(e, nv) => handleArtilheiroCampeao(nv, "artilheiro")}
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <Autocomplete
                options={selecoesJson}
                getOptionLabel={(option) => option.nome}
                renderInput={(params) => <TextField {...params} label="Campeão" />}
                value={valueCampeao}
                onChange={(e, nv) => setValueCampeao(nv)}
                inputValue={resultados.campeao}
                onInputChange={(e, nv) => handleArtilheiroCampeao(nv, "campeao")}
              />
            </Grid>
          </Grid>
          <Grid item xs sx={{ p: 3 }} alignSelf={"end"}>
            <Button
              variant="outlined"
              onClick={() => {
                salvarResultados(resultados, user).then(setResultSalvo(true));
              }}
            >
              Enviar Palpites
            </Button>
          </Grid>
          <Snackbar open={resultSalvo} autoHideDuration={6000} onClose={() => setResultSalvo(false)}>
            <Alert variant="outlined" severity="success" sx={{ mb: 2 }} onClick={() => setResultSalvo(false)}>
              Resultados salvos com sucesso!
            </Alert>
          </Snackbar>
        </Grid>
      ) : null}
    </Grid>
  );
}

export default MeuBolao;
