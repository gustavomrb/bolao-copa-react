import { Button, Card, Grid, Typography } from "@mui/material";
import { useContext, useEffect, useMemo } from "react";
import { buscaUsuarios, atualizaPago } from "./firebase";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";
import { GlobalContext } from "./App";

const EMPTY_PARTICIPANTS = [];

function Situacao() {
  const { user, todosUsuarios, setTodosUsuarios, resultadosUsuarios, boloes, bolaoAtual } =
    useContext(GlobalContext);
  const participantes = resultadosUsuarios || EMPTY_PARTICIPANTS;
  const userBanco = todosUsuarios.find((u) => u.id === user.uid)?.data;
  const faseAtual = boloes.find((b) => b.id === bolaoAtual)?.data.faseAtual;

  useEffect(() => {
    if (todosUsuarios.length === 0) {
      buscaUsuarios().then((v) => {
        setTodosUsuarios(v.docs.map((u) => ({ id: u.id, data: u.data() })));
      });
    }
  }, []);

  const situacoes = useMemo(() => {
    return participantes.map((usuario) => {
      const envios = usuario.data.envios || { fases: {}, palpitesGerais: false };
      const nome = todosUsuarios.find((u) => u.id === usuario.id)?.data.nome || usuario.id;

      return {
        id: usuario.id,
        nome,
        resultados: envios.fases && envios.fases[String(faseAtual)] === true,
        artilheiroCampeao: envios.palpitesGerais === true,
        pago: usuario.data.pago === undefined ? false : usuario.data.pago,
      };
    });
  }, [faseAtual, participantes, todosUsuarios]);

  const atualizarPagamento = async (usuario) => {
    await atualizaPago(bolaoAtual, usuario);
  };

  return (
    <Grid container justifyContent={"center"} alignItems={"center"} mt={5}>
      {todosUsuarios.length > 0 && userBanco ? (
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
                  {userBanco.isAdmin ? (
                  <Button onClick={() => atualizarPagamento(u)}>
                  {u.pago && u.pago === true ? <CheckCircleRoundedIcon/> : <HighlightOffRoundedIcon />}
                  </Button>
                  ) : (u.pago && u.pago === true ? <CheckCircleRoundedIcon/> : <HighlightOffRoundedIcon />)}
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
