import { useTheme } from "@emotion/react";
import { Card, Grid, Typography, useMediaQuery, Switch, TextField, Tooltip, IconButton, Box } from "@mui/material";
import { useContext, useEffect, useMemo, useState } from "react";
import { GlobalContext } from "./App";
import { buscaUsuarios } from "./firebase";
import DoneIcon from "@mui/icons-material/Done";
import CloseIcon from "@mui/icons-material/Close";
import { ArrowUpward, ArrowDownward, Remove } from "@mui/icons-material";
import cloneDeep from "lodash.clonedeep";
import { calculaPontosJogo, timeStampToShortDate, timestampToTime } from "./utils";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import { styled } from "@mui/material/styles";

// Tooltip moderno
const CustomTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} arrow classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .MuiTooltip-tooltip`]: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    boxShadow: theme.shadows[3],
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    fontSize: 12
  },
  [`& .MuiTooltip-arrow`]: {
    color: theme.palette.background.paper,
  },
}));

function Classificacao() {
  const [classificacao, setClassificacao] = useState([]);
  const [classificacaoOriginal, setClassificacaoOriginal] = useState([]);
  const [simulacaoAtiva, setSimulacaoAtiva] = useState(false);
  const [jogosSimulados, setJogosSimulados] = useState({}); // { jogoId: {gols1, gols2} }

  const {
    resultadosUsuarios,
    todosUsuarios,
    setTodosUsuarios,
    jogosCopa,
    artilheiroAtual,
    campeaoAtual,
    selecoesCopa,
  } = useContext(GlobalContext);

  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.only("xs"));

  // Disponibilidade de simulação: somente se o primeiro jogo de TODAS as fases já ocorreu
  const simDisponivel = useMemo(() => {
    if (!jogosCopa.current || jogosCopa.current.length === 0) return false;
    const fases = [...new Set(jogosCopa.current.map((j) => j.data.fase))];
    const agora = new Date();
    for (let fase of fases) {
      const jogosFase = jogosCopa.current.filter((j) => j.data.fase === fase);
      if (jogosFase.length === 0) return false;
      const primeiro = jogosFase.reduce((min, j) => {
        const d = j.data.data.toDate();
        return d < min ? d : min;
      }, new Date(8640000000000000));
      if (primeiro > agora) return false;
    }
    return true;
  }, [jogosCopa.current]);

  // Se disponibilidade muda para false, garante que simulação seja desativada
  useEffect(() => {
    if (!simDisponivel && simulacaoAtiva) {
      setSimulacaoAtiva(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simDisponivel]);

  useEffect(() => {
    if (todosUsuarios.length === 0) {
      buscaUsuarios().then((v) => {
        setTodosUsuarios(v.docs.map((u) => ({ id: u.id, data: u.data() })));
      });
    }
  }, []);

  useEffect(() => {
    if (todosUsuarios.length > 0) {
      geraClassificacao();
    }
  }, [todosUsuarios]);

  // Recalcula classificação quando há alteração em resultados simulados
  useEffect(() => {
    if (simulacaoAtiva) {
      geraClassificacao(jogosSimulados);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jogosSimulados]);

  const geraClassificacao = (jogosOverride) => {
    const classificacao = [];
    for (let usuario of resultadosUsuarios) {
      let pontos = 0;
      let cravadas = 0;
      let mataMata = 0;
      let artilheiro = 0;
      let campeao = 0;
      for (let jogoId in usuario.data.jogos) {
        const jogoCopa = jogosCopa.current.find((j) => j.id === jogoId);
        // Determina placar real a ser usado (override se existir)
        const override = jogosOverride ? jogosOverride[jogoId] : null;
        const golsReal1 = override && override.gols1 !== null && override.gols2 !== null ? override.gols1 : jogoCopa.data.gols1;
        const golsReal2 = override && override.gols1 !== null && override.gols2 !== null ? override.gols2 : jogoCopa.data.gols2;

        // Se ainda não há placar definido, ignora
        if (golsReal1 === null || golsReal2 === null) continue;

        const aposta = usuario.data.jogos[jogoId];
        const pontosJogo = calculaPontosJogo(golsReal1, golsReal2, aposta.gols1, aposta.gols2);
        pontos += pontosJogo;
        if (pontosJogo === 10) {
            cravadas += 1;
          }
          if (jogoCopa.data.fase > 1) {
          mataMata += pontosJogo;
        }
      }

      if (usuario.data.artilheiro && usuario.data.artilheiro === artilheiroAtual) {
        pontos += 10;
        artilheiro = 10;
      }

      if (usuario.data.campeao && usuario.data.campeao === campeaoAtual) {
        pontos += 10;
        campeao = 10;
      }

      classificacao.push({
        nome: todosUsuarios.find((u) => u.id === usuario.id).data.nome,
        pontos: pontos,
        cravadas: cravadas,
        mataMata: mataMata,
        campeao: campeao,
        artilheiro: artilheiro,
      });
    }
    classificacao.sort((a, b) =>
      b.pontos === a.pontos
        ? b.cravadas === a.cravadas
          ? b.campeao === a.campeao
            ? b.artilheiro === a.artilheiro
              ? b.mataMata - a.mataMata
              : b.artilheiro - a.artilheiro
            : b.campeao - a.campeao
          : b.cravadas - a.cravadas
        : b.pontos - a.pontos
    );
    setClassificacao(classificacao);
  };

  const handleInputSimulacao = (event, propertyName, jogoId) => {
    const valor =
      event.target.value !== "" && event.target.value.match(/[0-9]/)?.length > 0
        ? parseInt(event.target.value)
        : null;
    setJogosSimulados((prev) => {
      const novo = cloneDeep(prev);
      if (!novo[jogoId]) novo[jogoId] = { gols1: null, gols2: null };
      novo[jogoId][propertyName] = valor;
      return novo;
    });
  };

  return (
    <Grid container justifyContent={"center"} alignItems={"flex-start"} spacing={2}>
      {classificacao ? (
        <Grid item xs={12} sm={6} container direction={"column"}>
          {/* Toggle Simulação */}
          {simDisponivel && (
            <Grid item xs={12} container justifyContent={"end"} alignItems={"center"} sx={{ pt: 1 }}>
              <Typography variant="body2" sx={{ mr: 1 }}>
                Simular
              </Typography>
              <Switch
                checked={simulacaoAtiva}
                onChange={(e) => {
                  const ativo = e.target.checked;
                  setSimulacaoAtiva(ativo);
                  setJogosSimulados({});
                  if (ativo) {
                    setClassificacaoOriginal(classificacao);
                  } else {
                    // volta classificação original
                    geraClassificacao();
                  }
                }}
                size="small"
              />
            </Grid>
          )}
          <Grid item xs={3} container sx={{ pt: 1, pb: 1, pl: 1 }} justifyContent={"space-evenly"}>
            {simulacaoAtiva ? (
              <Grid item xs={1}>
                {/* coluna seta */}
              </Grid>
            ) : null}
            <Grid item xs={1}>
              <Typography variant="body2">{isXs ? "P" : "Posição"}</Typography>
            </Grid>
            <Grid item xs={simulacaoAtiva ? 3 : 4}>
              <Typography variant="body2">{isXs ? "N" : "Nome"}</Typography>
            </Grid>
            <Grid item xs={1}>
              <Typography variant="body2">{isXs ? "Pts" : "Pontos"}</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant="body2">{isXs ? "Cvds" : "Cravadas"}</Typography>
            </Grid>
            <Grid item xs={1}>
              <Typography variant="body2">{isXs ? "C" : "Camp."}</Typography>
            </Grid>
            <Grid item xs={1}>
              <Typography variant="body2">{isXs ? "A" : "Art."}</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant="body2">{isXs ? "M-M" : "Mata-Mata"}</Typography>
            </Grid>
          </Grid>
          <Card elevation={3} sx={{ pt: 1.5, pl: 1, borderRadius: 4 }}>
            <Grid container direction={"column"} spacing={2}>
              {classificacao.map((c, i) => {
                const posOriginal = classificacaoOriginal.findIndex((o) => o.nome === c.nome);
                const delta = simulacaoAtiva && posOriginal !== -1 ? posOriginal - i : 0;
                return (
                  <Grid
                    item
                    xs={6}
                    key={i}
                    container
                    sx={i === classificacao.length - 1 ? {} : { borderBottom: 1, pb: 1 }}
                    justifyContent={"space-evenly"}
                    alignItems={"center"}
                  >
                    {simulacaoAtiva ? (
                      <Grid
                        item
                        xs={1}
                        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        {delta > 0 ? (
                          <ArrowUpward fontSize="small" color="success" />
                        ) : delta < 0 ? (
                          <ArrowDownward fontSize="small" color="error" />
                        ) : (
                          <Remove fontSize="small" />
                        )}
                        {delta !== 0 && (
                          <Typography
                            variant="caption"
                            sx={{ ml: 0.25, color: delta > 0 ? "success.main" : "error.main" }}
                          >
                            {Math.abs(delta)}
                          </Typography>
                        )}
                      </Grid>
                    ) : null}
                    <Grid item xs={1}>
                      <Typography variant="body2">
                        {!classificacao[i - 1] ||
                        classificacao[i - 1].pontos !== c.pontos ||
                        classificacao[i - 1].cravadas !== c.cravadas ||
                        classificacao[i - 1].campeao !== c.campeao ||
                        classificacao[i - 1].artilheiro !== c.artilheiro ||
                        classificacao[i - 1].mataMata !== c.mataMata
                          ? `${i + 1}º`
                          : ""}
                      </Typography>
                    </Grid>
                    <Grid item xs={simulacaoAtiva ? 3 : 4}>
                      <Typography variant="body2">{c.nome}</Typography>
                    </Grid>
                    <Grid item xs={1}>
                      <Typography variant="body2">{c.pontos}</Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Typography variant="body2">{c.cravadas}</Typography>
                    </Grid>
                    <Grid item xs={1}>
                      {c.campeao === 10 ? <DoneIcon /> : <CloseIcon />}
                    </Grid>
                    <Grid item xs={1}>
                      {c.artilheiro === 10 ? <DoneIcon /> : <CloseIcon />}
                    </Grid>
                    <Grid item xs={2}>
                      <Typography variant="body2">{c.mataMata}</Typography>
                    </Grid>
                  </Grid>
                );
              })}
            </Grid>
          </Card>
        </Grid>
      ) : null}
      {/* Painel de Simulação colocado ao lado (ou embaixo no xs) */}
      {simulacaoAtiva ? (
        <Grid item xs={12} sm={6} container direction={"column"} sx={{ mt: { xs: 3, sm: 0 } }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Jogos em aberto
          </Typography>
          {jogosCopa.current
            .filter((j) => j.data.gols1 === null || j.data.gols2 === null)
            .sort((a, b) => a.data.data.toDate() - b.data.data.toDate())
            .map((j, idx) => {
              const time1Obj = selecoesCopa.current.find((s) => s.id === j.data.times[0]);
              const time2Obj = selecoesCopa.current.find((s) => s.id === j.data.times[1]);
              return (
                <Grid key={idx} container alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Grid item xs={2}>
                    <Typography variant="body2">{
                      `${timeStampToShortDate(j.data.data)} ${timestampToTime(j.data.data)}`
                    }</Typography>
                  </Grid>
                  <Grid item xs={1}>
                    <Typography variant="body2">{j.data.grupo}</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2">{time1Obj ? time1Obj.data.nome : ""}</Typography>
                  </Grid>
                  <Grid item xs={1}>
                    <TextField
                      variant="standard"
                      size="small"
                      inputProps={{ inputMode: "numeric", pattern: "[0-9]", maxLength: 1, style: { textAlign: "center" } }}
                      value={jogosSimulados[j.id]?.gols1 ?? ""}
                      onChange={(e) => handleInputSimulacao(e, "gols1", j.id)}
                    />
                  </Grid>
                  <Grid item xs={1}>
                    <Typography variant="body2">x</Typography>
                  </Grid>
                  <Grid item xs={1}>
                    <TextField
                      variant="standard"
                      size="small"
                      inputProps={{ inputMode: "numeric", pattern: "[0-9]", maxLength: 1, style: { textAlign: "center" } }}
                      value={jogosSimulados[j.id]?.gols2 ?? ""}
                      onChange={(e) => handleInputSimulacao(e, "gols2", j.id)}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">{time2Obj ? time2Obj.data.nome : ""}</Typography>
                  </Grid>
                  <Grid item xs={1}>
                    {todosUsuarios.length > 0 && resultadosUsuarios.length > 0 && (
                      (() => {
                        const palpites = resultadosUsuarios
                          .map((res) => {
                            const jogoUser = res.data.jogos[j.id];
                            if (jogoUser && jogoUser.gols1 && jogoUser.gols2) {
                              const nome = todosUsuarios.find((u) => u.id === res.id)?.data.nome || "";
                              const palpite = `${jogoUser.gols1} x ${jogoUser.gols2}`;
                              return { nome, palpite };
                            }
                            return null;
                          })
                          .filter(Boolean).sort((a, b) => a.nome.localeCompare(b.nome));
                        if (palpites.length === 0) return null;
                        return (
                          <CustomTooltip
                            title={
                              <Box>
                                {palpites.map((p, idxP) => (
                                  <Typography key={idxP} variant="caption" display="block" sx={{ whiteSpace: 'nowrap' }}>
                                    <Box component="span" sx={{ fontWeight: 'bold' }}>{p.nome}</Box>: {p.palpite}
                                  </Typography>
                                ))}
                              </Box>
                            }
                            placement="left"
                            arrow
                          >
                            <IconButton size="small">
                              <InfoOutlined fontSize="small" />
                            </IconButton>
                          </CustomTooltip>
                        );
                      })()
                    )}
                  </Grid>
                </Grid>
              );
            })}
        </Grid>
      ) : null}
    </Grid>
  );
}

export default Classificacao;
