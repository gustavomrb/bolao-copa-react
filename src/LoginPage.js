import {
  Button,
  Container,
  createTheme,
  CssBaseline,
  Grid,
  Link,
  TextField,
  ThemeProvider,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { auth, logarUsuario } from "./firebase";
import { useAuthState } from "react-firebase-hooks/auth";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

const retornaErro = (erro) => {
  if (erro.code === "auth/wrong-password") {
    return "A senha está errada. Tente novamente.";
  }

  if (erro.code === "auth/invalid-email") {
    return "E-mail inválido. Cheque e tente novamente.";
  }

  return "Erro ao tentar fazer login.";
};

function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [user] = useAuthState(auth);
  const [erro, setErro] = useState("");

  const navigate = useNavigate();
  useEffect(() => {
    if (user) {
      navigate("../home");
    }
  }, [user, navigate]);

  const handleLogin = () => {
    logarUsuario(email, senha)
      .then((userCredential) => {
        // Signed in
      })
      .catch((error) => {
        setErro(error);
      });
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Container maxWidth={"xs"}>
        <CssBaseline />
        <Grid container justifyContent={"center"} sx={{ mt: 15 }}>
          <Grid item>
            <Typography component="h1" variant="h5">
              Bolão da Copa do Leopoldina
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="E-mail"
              name="email"
              autoComplete="email"
              autoFocus
              onChange={(e) => setEmail(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Senha"
              type="password"
              autoComplete="current-password"
              onChange={(e) => setSenha(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Button variant="outlined" fullWidth onClick={handleLogin}>
              Fazer Login
            </Button>
          </Grid>
          {erro ? (
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant={"body2"} color={"error.main"}>
                {retornaErro(erro)}
              </Typography>
            </Grid>
          ) : null}
          <Grid item xs="auto" sx={{ mt: 2 }}>
            <Link component={RouterLink} to="/signup">
              <Button>
                <Typography variant={"body2"}>Criar Conta</Typography>
              </Button>
            </Link>
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
}

export default LoginPage;
