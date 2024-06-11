import { Card, Grid, Typography } from "@mui/material";

function Regras() {
  return (
    <Grid container justifyContent={"center"} alignItems={"center"} mt={5}>
      <Grid item xs={12} sm={6}>
        <Card elevation={3} sx={{ pt: 1.5, pb: 1, px: 2, borderRadius: 4 }}>
          <Grid item container direction={"column"} spacing={3}>
            <Grid item>
              <Typography variant={"h5"}>Regras do Bolão</Typography>
            </Grid>
            <Grid item>
              <Typography variant={"h6"} textAlign={"left"}>
                Pontuação
              </Typography>
            </Grid>
            <Grid item container spacing={0.5}>
              <Grid item>
                <Typography variant={"body2"} typography={{ fontWeight: "bold" }} textAlign={"left"}>
                  Acertou resultado exato:
                </Typography>
              </Grid>
              <Grid item>
                <Typography variant={"body2"} textAlign={"left"}>
                  10 pontos
                </Typography>
              </Grid>
            </Grid>
            <Grid item container spacing={0.5}>
              <Grid item>
                <Typography variant={"body2"} typography={{ fontWeight: "bold" }} textAlign={"left"}>
                  Acertou vencedor e gols de um dos times:
                </Typography>
              </Grid>
              <Grid item>
                <Typography variant={"body2"}>7 pontos</Typography>
              </Grid>
            </Grid>
            <Grid item container spacing={0.5}>
              <Grid item>
                <Typography variant={"body2"} typography={{ fontWeight: "bold" }} textAlign={"left"}>
                  Acertou vencedor e margem de gols:
                </Typography>
              </Grid>
              <Grid item>
                <Typography variant={"body2"}>7 pontos</Typography>
              </Grid>
            </Grid>
            <Grid item container spacing={0.5}>
              <Grid item>
                <Typography variant={"body2"} typography={{ fontWeight: "bold" }} textAlign={"left"}>
                  Acertou empate não-exato:
                </Typography>
              </Grid>
              <Grid item>
                <Typography variant={"body2"}>7 pontos</Typography>
              </Grid>
            </Grid>
            <Grid item container spacing={0.5}>
              <Grid item>
                <Typography variant={"body2"} typography={{ fontWeight: "bold" }} textAlign={"left"}>
                  Acertou apenas vencedor:
                </Typography>
              </Grid>
              <Grid item>
                <Typography variant={"body2"}>5 pontos</Typography>
              </Grid>
            </Grid>
            <Grid item container spacing={0.5}>
              <Grid item>
                <Typography variant={"body2"} typography={{ fontWeight: "bold" }} textAlign={"left"}>
                  Errou vencedor mas acertou gols de um dos times:
                </Typography>
              </Grid>
              <Grid item>
                <Typography variant={"body2"}>2 pontos</Typography>
              </Grid>
            </Grid>
            <Grid item container spacing={0.5}>
              <Grid item>
                <Typography variant={"body2"} typography={{ fontWeight: "bold" }} textAlign={"left"}>
                  Errou tudo:
                </Typography>
              </Grid>
              <Grid item>
                <Typography variant={"body2"}>0 pontos</Typography>
              </Grid>
            </Grid>
            <Grid item container spacing={0.5}>
              <Grid item>
                <Typography variant={"body2"} typography={{ fontWeight: "bold" }} textAlign={"left"}>
                  Acertou artilheiro:
                </Typography>
              </Grid>
              <Grid item>
                <Typography variant={"body2"}>10 pontos</Typography>
              </Grid>
            </Grid>
            <Grid item container spacing={0.5}>
              <Grid item>
                <Typography variant={"body2"} typography={{ fontWeight: "bold" }} textAlign={"left"}>
                  Acertou campeão:
                </Typography>
              </Grid>
              <Grid item>
                <Typography variant={"body2"}>10 pontos</Typography>
              </Grid>
            </Grid>
            <Grid item>
              <Typography variant={"h6"} textAlign={"left"}>
                Critérios de Desempate
              </Typography>
            </Grid>
            <Grid item container spacing={0.5}>
              <Grid item>
                <Typography variant={"body2"} typography={{ fontWeight: "bold" }} textAlign={"left"}>
                  1º:
                </Typography>
              </Grid>
              <Grid item>
                <Typography variant={"body2"}>Cravadas</Typography>
              </Grid>
            </Grid>
            <Grid item container spacing={0.5}>
              <Grid item>
                <Typography variant={"body2"} typography={{ fontWeight: "bold" }} textAlign={"left"}>
                  2º:
                </Typography>
              </Grid>
              <Grid item>
                <Typography variant={"body2"}>Acertou campeão</Typography>
              </Grid>
            </Grid>
            <Grid item container spacing={0.5}>
              <Grid item>
                <Typography variant={"body2"} typography={{ fontWeight: "bold" }} textAlign={"left"}>
                  3º:
                </Typography>
              </Grid>
              <Grid item>
                <Typography variant={"body2"}>Acertou artilheiro</Typography>
              </Grid>
            </Grid>
            <Grid item container spacing={0.5}>
              <Grid item>
                <Typography variant={"body2"} typography={{ fontWeight: "bold" }} textAlign={"left"}>
                  3º:
                </Typography>
              </Grid>
              <Grid item>
                <Typography variant={"body2"}>Pontos no mata-mata</Typography>
              </Grid>
            </Grid>
            <Grid item>
              <Typography variant={"h6"} textAlign={"left"}>
                Premiação
              </Typography>
            </Grid>
            <Grid item container spacing={0.5}>
              <Grid item>
                <Typography variant={"body2"} typography={{ fontWeight: "bold" }} textAlign={"left"}>
                  Primeiro lugar:
                </Typography>
              </Grid>
              <Grid item>
                <Typography variant={"body2"}>70% do montante</Typography>
              </Grid>
            </Grid>
            <Grid item container spacing={0.5}>
              <Grid item>
                <Typography variant={"body2"} typography={{ fontWeight: "bold" }} textAlign={"left"}>
                  Segundo lugar:
                </Typography>
              </Grid>
              <Grid item>
                <Typography variant={"body2"}>20% do montante</Typography>
              </Grid>
            </Grid>
            <Grid item container spacing={0.5}>
              <Grid item>
                <Typography variant={"body2"} typography={{ fontWeight: "bold" }} textAlign={"left"}>
                  Terceiro lugar:
                </Typography>
              </Grid>
              <Grid item>
                <Typography variant={"body2"}>10% do montante</Typography>
              </Grid>
            </Grid>
          </Grid>
        </Card>
      </Grid>
    </Grid>
  );
}

export default Regras;
