import { Card, Grid, Typography } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { buscaUsuarios } from "./firebase";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";
import { GlobalContext } from "./App";

function Situacao() {
  const { todosUsuarios, setTodosUsuarios, resultadosUsuarios, jogosCopa, boloes, bolaoAtual } =
    useContext(GlobalContext);
  const [situacoes, setSituacoes] = useState([]);

  useEffect(() => {
    if (todosUsuarios.length === 0) {
      buscaUsuarios().then((v) => {
        setTodosUsuarios(v.docs.map((u) => ({ id: u.id, data: u.data() })));
      });
    }
  }, []);

  useEffect(() => {
    if (todosUsuarios.length > 0) {
      geraSituacao();
    }
  }, [todosUsuarios]);

  const geraSituacao = () => {
    const situacoes = [];
    for (let usuario of resultadosUsuarios) {
      let resultados = true;
      let artilheiroCampeao = true;
      let faseAtual = boloes.find((b) => b.id === bolaoAtual).data.faseAtual;
      let jogosFaseAtual = jogosCopa.current.filter((j) => j.data.fase === faseAtual);

      for (let jogoFaseAtual of jogosFaseAtual) {
        if (
          !usuario.data.jogos[jogoFaseAtual.id] ||
          usuario.data.jogos[jogoFaseAtual.id].gols1 === null ||
          usuario.data.jogos[jogoFaseAtual.id].gols1 === "" ||
          usuario.data.jogos[jogoFaseAtual.id].gols2 === null ||
          usuario.data.jogos[jogoFaseAtual.id].gols2 === ""
        ) {
          resultados = false;
          break;
        }
      }

      if (
        !usuario.data.artilheiro === null ||
        usuario.data.artilheiro === "" ||
        !usuario.data.campeao === null ||
        usuario.data.campeao === ""
      ) {
        artilheiroCampeao = false;
      }

      situacoes.push({
        nome: todosUsuarios.find((u) => u.id === usuario.id).data.nome,
        resultados: resultados,
        artilheiroCampeao: artilheiroCampeao,
        pago: false,
      });
    }

    setSituacoes(situacoes);
  };

  return (
    <Grid container justifyContent={"center"} alignItems={"center"} mt={5}>
      {todosUsuarios ? (
        <Grid item xs={12} sm={6} container direction={"column"}>
          <Grid item xs={3} container sx={{ pt: 1, pb: 1 }} justifyContent={"space-evenly"}>
            <Grid item xs={3}>
              <Typography variant={"body2"}>Nome</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant={"body2"}>Pago</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant={"body2"}>Resultados</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant={"body2"}>Artilheiro/ Campeão</Typography>
            </Grid>
          </Grid>
          <Card elevation={3} sx={{ pt: 1.5, pb: 1, borderRadius: 4 }}>
            {situacoes.map((u, i) => (
              <Grid item xs={12} container sx={{ pt: 1, pb: 1 }} justifyContent={"space-evenly"} key={i}>
                <Grid item xs={3}>
                  <Typography variant="body2">{u.nome}</Typography>
                </Grid>
                <Grid item xs={2}>
                  {u.pago ? <CheckCircleRoundedIcon /> : <HighlightOffRoundedIcon />}
                </Grid>
                <Grid item xs={2}>
                  {u.resultados ? <CheckCircleRoundedIcon /> : <HighlightOffRoundedIcon />}
                </Grid>
                <Grid item xs={2}>
                  {u.artilheiroCampeao ? <CheckCircleRoundedIcon /> : <HighlightOffRoundedIcon />}
                </Grid>
              </Grid>
            ))}
          </Card>
        </Grid>
      ) : null}
    </Grid>
  );
}

export default Situacao;
