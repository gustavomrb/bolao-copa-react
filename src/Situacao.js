import { Card, Grid, Typography } from "@mui/material";
import { useContext, useEffect } from "react";
import { buscaUsuarios } from "./firebase";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";
import { GlobalContext } from "./App";

function Situacao() {
  const { todosUsuarios, setTodosUsuarios } = useContext(GlobalContext);

  useEffect(() => {
    if (todosUsuarios.length === 0) {
      buscaUsuarios().then((v) => {
        setTodosUsuarios(v.docs.map((u) => ({ id: u.id, data: u.data() })));
      });
    }
  }, [todosUsuarios]);

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
            {todosUsuarios.map((u, i) => (
              <Grid item xs={12} container sx={{ pt: 1, pb: 1 }} justifyContent={"space-evenly"} key={i}>
                <Grid item xs={3}>
                  <Typography variant="body2">{u.data.nome}</Typography>
                </Grid>
                <Grid item xs={2}>
                  {u.data.pago ? <CheckCircleRoundedIcon /> : <HighlightOffRoundedIcon />}
                </Grid>
                <Grid item xs={2}>
                  {u.data.resultadosFase1 ? <CheckCircleRoundedIcon /> : <HighlightOffRoundedIcon />}
                </Grid>
                <Grid item xs={2}>
                  {u.data.artilheiroCampeao ? <CheckCircleRoundedIcon /> : <HighlightOffRoundedIcon />}
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
