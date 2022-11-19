import { Button, Container, createTheme, CssBaseline, Grid, TextField, ThemeProvider, Typography } from "@mui/material";
import { auth, criarUserBanco, criarUsuario } from "./firebase";
import { useState } from "react";
import { updateProfile } from "firebase/auth";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

const retornaErro = (erro) => {
  if (erro.code === "auth/email-already-in-use") {
    return "Este e-mail já foi cadastrado! Tente um diferente.";
  }

  if (erro.code === "senhas-nao-coincidem") {
    return "As senhas não coincidem. Tente novamente.";
  }

  if (erro.code === "auth/weak-password") {
    return "A senha deve ter no mínimo 6 caracteres.";
  }

  if (erro.code === "auth/invalid-email") {
    return "E-mail inválido. Cheque e tente novamente.";
  }

  if (erro.code === "faltou-nome") {
    return "Nome deve ser informado!";
  }

  return "Erro ao tentar criar um usuário.";
};

function SignUpPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [senhaConfirm, setSenhaConfirm] = useState("");
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState("");
  const [user] = useAuthState(auth);

  const handleCadastro = () => {
    if (senha !== senhaConfirm) {
      setErro({ code: "senhas-nao-coincidem" });
      return;
    }
    if (nome.length === 0) {
      setErro({ code: "faltou-nome" });
      return;
    }
    criarUsuario(email, senha)
      .then((userCredential) => {
        const userReturn = userCredential.user;
        updateProfile(userReturn, { displayName: nome.trim() });
        criarUserBanco(userReturn.uid, userReturn.email, nome.trim());
      })
      .catch((error) => {
        setErro(error);
      });
  };

  const navigate = useNavigate();
  useEffect(() => {
    if (user) {
      navigate("../home");
    }
  }, [user, navigate]);

  return (
    <ThemeProvider theme={darkTheme}>
      <Container maxWidth={"xs"}>
        <CssBaseline />
        <Grid container justifyContent={"center"} sx={{ mt: 15 }}>
          <Grid item>
            <Typography component="h1" variant="h5">
              Cadastro no Bolão
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
              error={senha.length > 0 && senha.length < 6}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant={"subtitle2"}>A senha deve ter no mínimo 6 caracteres.</Typography>
          </Grid>
          <Grid item xs={12}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirmar Senha"
              type="password"
              autoComplete="current-password"
              onChange={(e) => setSenhaConfirm(e.target.value)}
              error={senhaConfirm.length > 0 && senhaConfirm !== senha}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Nome no Bolão"
              name="displayName"
              autoComplete="displayName"
              onChange={(e) => setNome(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Button variant="outlined" fullWidth onClick={handleCadastro}>
              Criar Conta
            </Button>
          </Grid>
          {erro ? (
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant={"body2"} color={"error.main"}>
                {retornaErro(erro)}
              </Typography>
            </Grid>
          ) : null}
        </Grid>
      </Container>
    </ThemeProvider>
  );
}

export default SignUpPage;
