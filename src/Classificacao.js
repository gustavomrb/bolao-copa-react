import { useTheme } from "@emotion/react";
import { Card, Grid, Typography, useMediaQuery } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { GlobalContext } from "./App";
import { buscaUsuarios } from "./firebase";
import DoneIcon from "@mui/icons-material/Done";
import CloseIcon from "@mui/icons-material/Close";

function Classificacao() {
  const [classificacao, setClassificacao] = useState([]);

  const { resultadosUsuarios, todosUsuarios, setTodosUsuarios, jogosCopa, artilheiroAtual, campeaoAtual } =
    useContext(GlobalContext);

  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.only("xs"));

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

  const geraClassificacao = () => {
    const classificacao = [];
    for (let usuario of resultadosUsuarios) {
      let pontos = 0;
      let cravadas = 0;
      let mataMata = 0;
      let artilheiro = 0;
      let campeao = 0;
      for (let jogoId in usuario.data.jogos) {
        const jogoCopa = jogosCopa.current.find((j) => j.id === jogoId);
        if (usuario.data.jogos[jogoId].pontos !== "") {
          pontos += usuario.data.jogos[jogoId].pontos;
          if (usuario.data.jogos[jogoId].pontos === 10) {
            cravadas += 1;
          }
          if (jogoCopa.data.fase > 1) {
            mataMata += usuario.data.jogos[jogoId].pontos;
          }
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

  return (
    <Grid container justifyContent={"center"} alignItems={"center"}>
      {classificacao ? (
        <Grid item xs={12} sm={7} container direction={"column"}>
          <Grid item xs={3} container sx={{ pt: 1, pb: 1, pl: 1 }} justifyContent={"space-evenly"}>
            <Grid item xs={1}>
              <Typography variant="body2">{isXs ? "P" : "Posição"}</Typography>
            </Grid>
            <Grid item xs={4}>
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
                return (
                  <Grid
                    item
                    xs={6}
                    key={i}
                    container
                    sx={i === classificacao.length - 1 ? {} : { borderBottom: 1, pb: 1 }}
                    justifyContent={"space-evenly"}
                  >
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
                    <Grid item xs={4}>
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
    </Grid>
  );
}

export default Classificacao;
