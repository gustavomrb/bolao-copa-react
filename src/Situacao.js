import { Card, Grid, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { buscaUsuarios } from "./firebase";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";

function Situacao() {
  const [users, setUsers] = useState();

  useEffect(() => {
    if (!users) {
      buscaUsuarios().then((u) => {
        setUsers(u.docs);
      });
    }
  }, [users]);

  return (
    <Grid container justifyContent={"center"} alignItems={"center"} mt={5}>
      {users ? (
        <Grid item xs={12} sm={6} container direction={"column"}>
          <Grid item xs={3} container sx={{ pt: 1, pb: 1 }} justifyContent={"space-evenly"}>
            <Grid item xs={3}>
              <Typography variant={"body2"}>Nome</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant={"body2"}>Pago</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant={"body2"}>Grupos</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant={"body2"}>Artilheiro/ Campeão</Typography>
            </Grid>
          </Grid>
          <Card elevation={3} sx={{ pt: 1.5, pb: 1, borderRadius: 4 }}>
            {users.map((u, i) => (
              <Grid item xs={12} container sx={{ pt: 1, pb: 1 }} justifyContent={"space-evenly"} key={i}>
                <Grid item xs={3}>
                  <Typography variant="body2">{u.data().nome}</Typography>
                </Grid>
                <Grid item xs={2}>
                  {u.data().pago ? <CheckCircleRoundedIcon /> : <HighlightOffRoundedIcon />}
                </Grid>
                <Grid item xs={2}>
                  {u.data().resultadosFase1 ? <CheckCircleRoundedIcon /> : <HighlightOffRoundedIcon />}
                </Grid>
                <Grid item xs={2}>
                  {u.data().artilheiroCampeao ? <CheckCircleRoundedIcon /> : <HighlightOffRoundedIcon />}
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
