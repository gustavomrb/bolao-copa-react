import "./App.css";
import {
  Avatar,
  Box,
  Button,
  Container,
  createTheme,
  CssBaseline,
  Drawer,
  FormControl,
  Grid,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  ThemeProvider,
  Toolbar,
  Typography,
} from "@mui/material";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { auth, database, signOutUser, buscaUsuario } from "./firebase";
import { LaptopChromebook, Toc, MenuRounded, SupervisorAccount } from "@mui/icons-material";
import { useAuthState } from "react-firebase-hooks/auth";
import React, { createContext, useEffect, useRef } from "react";
import { useState } from "react";
import { collection, onSnapshot, doc } from "firebase/firestore";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

export const GlobalContext = createContext();

function App() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);
  const [resultadosUsuarios, setResultadosUsuarios] = useState();
  const [todosUsuarios, setTodosUsuarios] = useState([]);
  const [boloes, setBoloes] = useState([]);
  const [bolaoAtual, setBolaoAtual] = useState("");
  const [campeaoAtual, setCampeaoAtual] = useState("");
  const [artilheiroAtual, setArtilheiroAtual] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const selecoesCopa = useRef([]);
  let jogosCopa = useRef([]);
  let location = useLocation();

  useEffect(() => {
    if (!user) {
      navigate("../login");
    }
  }, []);

  useEffect(() => {
    let unsubscribe;
    if (user) {
      if (boloes.length === 0) {
        unsubscribe = onSnapshot(collection(database, "boloes"), (snapshot) => {
          setBoloes(snapshot.docs.map((j) => ({ id: j.id, data: j.data() })));
        });
      }

      buscaUsuario(user.uid).then((res) => {
        const userDb = res.data();
        if (userDb && userDb.isAdmin) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    let unsubSelecoes;
    let unsubJogos;
    let unsubResultados;

    if (bolaoAtual && bolaoAtual !== "") {
      let firstLoad = true;
      if(location.pathname !== "/") {
        navigate("/");
      }
      jogosCopa.current = [];
      setResultadosUsuarios([]);
      selecoesCopa.current = [];
      setArtilheiroAtual("");
      setCampeaoAtual("");

      unsubSelecoes = onSnapshot(doc(database, "equipesBolao", bolaoAtual), (snapshot) => {
        const equipesArr = [];
        const data = snapshot.data();
        if (data && data.equipes) {
          const mapaEquipes = data.equipes;
          for (let idUser in mapaEquipes) {
            equipesArr.push({ id: idUser, data: mapaEquipes[idUser] });
          }
        }
        selecoesCopa.current = equipesArr;
      });

      unsubJogos = onSnapshot(doc(database, "jogosBolao", bolaoAtual), (snapshot) => {
        const jogosCopaArr = [];
        const data = snapshot.data();
        if (data && data.jogos) {
          const mapaJogosCopa = data.jogos;
          for (let idJogoCopa in mapaJogosCopa) {
            jogosCopaArr.push({ id: idJogoCopa, data: mapaJogosCopa[idJogoCopa] });
          }
          jogosCopa.current = jogosCopaArr;
          setArtilheiroAtual(data.artilheiro || "");
          setCampeaoAtual(data.campeao || "");
        }
      });

      unsubResultados = onSnapshot(doc(database, "resultadosUsuariosBoloes", bolaoAtual), (snapshot) => {
        const resUsuArr = [];
        const data = snapshot.data();
        if (data && data.usuarios) {
          const mapaResUsu = data.usuarios;
          for (let idUser in mapaResUsu) {
            resUsuArr.push({ id: idUser, data: mapaResUsu[idUser] });
          }
        }
        setResultadosUsuarios(resUsuArr);
        if (firstLoad) {
          navigate("../home");
          firstLoad = false;
        }
      });
    }

    return () => {
      if (unsubSelecoes) unsubSelecoes();
      if (unsubJogos) unsubJogos();
      if (unsubResultados) unsubResultados();
    };
  }, [bolaoAtual]);

  const menuLateral = (
    <React.Fragment>
      <Toolbar>
        <Typography variant="h6">Bolão da Leopoldina</Typography>
      </Toolbar>
      <FormControl fullWidth>
        <InputLabel>Bolão</InputLabel>
        <Select
          label="Bolão"
          value={bolaoAtual}
          onChange={(e) => {
            setBolaoAtual(e.target.value);
          }}
        >
          {boloes.sort((a, b) => b.data.anoTorneio - a.data.anoTorneio).map((b, i) => (
            <MenuItem key={i} value={b.id}>{`${b.data.nomeTorneio} - ${b.data.anoTorneio}`}</MenuItem>
          ))}
        </Select>
      </FormControl>
      {bolaoAtual !== "" ? (
        <List>
          <ListItem
            disablePadding
            onClick={() => {
              setMenuAberto(false);
              navigate("../home");
            }}
          >
            <ListItemButton>
              <ListItemIcon>
                <LaptopChromebook />
              </ListItemIcon>
              <ListItemText primary="Meu Bolão" />
            </ListItemButton>
          </ListItem>
          <ListItem
            disablePadding
            onClick={() => {
              setMenuAberto(false);
              navigate("../classificacao");
            }}
          >
            <ListItemButton>
              <ListItemIcon>
                <Toc />
              </ListItemIcon>
              <ListItemText primary="Classificação" />
            </ListItemButton>
          </ListItem>
          <ListItem
            disablePadding
            onClick={() => {
              setMenuAberto(false);
              navigate("../secada");
            }}
          >
            <ListItemButton>
              <ListItemIcon>
                <Toc />
              </ListItemIcon>
              <ListItemText primary="Área da Secada" />
            </ListItemButton>
          </ListItem>
          <ListItem
            disablePadding
            onClick={() => {
              setMenuAberto(false);
              navigate("../resultados");
            }}
          >
            <ListItemButton>
              <ListItemIcon>
                <Toc />
              </ListItemIcon>
              <ListItemText primary="Resultados" />
            </ListItemButton>
          </ListItem>
          <ListItem
            disablePadding
            onClick={() => {
              setMenuAberto(false);
              navigate("../situacao");
            }}
          >
            <ListItemButton>
              <ListItemIcon>
                <Toc />
              </ListItemIcon>
              <ListItemText primary="Situação" />
            </ListItemButton>
          </ListItem>
          <ListItem
            disablePadding
            onClick={() => {
              setMenuAberto(false);
              navigate("../regras");
            }}
          >
            <ListItemButton>
              <ListItemIcon>
                <Toc />
              </ListItemIcon>
              <ListItemText primary="Regras" />
            </ListItemButton>
          </ListItem>
          {isAdmin && (
            <ListItem
              disablePadding
              onClick={() => {
                setMenuAberto(false);
                navigate("../admin");
              }}
            >
              <ListItemButton>
                <ListItemIcon>
                  <SupervisorAccount />
                </ListItemIcon>
                <ListItemText primary="Admin" />
              </ListItemButton>
            </ListItem>
          )}
          <ListItem disablePadding sx={{ flexDirection: "column", justifyContent: "center", mt: 1, gap: 0.5 }}>
            <Typography variant={"body1"}>Pix para pagamento</Typography>
            <Typography variant={"body2"}>21997586852</Typography>
            <Typography variant={"body2"}>Gustavo Mendonça</Typography>
            <Typography variant={"body2"}>Valor: 50R$</Typography>
          </ListItem>
        </List>
      ) : (
        ""
      )}
    </React.Fragment>
  );

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      {user ? (
        <GlobalContext.Provider
          value={{
            user,
            jogosCopa,
            resultadosUsuarios,
            setResultadosUsuarios,
            selecoesCopa,
            todosUsuarios,
            setTodosUsuarios,
            boloes,
            bolaoAtual,
            artilheiroAtual,
            campeaoAtual,
          }}
        >
          <Grid container height={"100vh"}>
            <Grid
              item
              container
              sm={1.5}
              display={{ xs: "none", md: "flex" }}
              sx={{ backgroundColor: "rgba(255, 255, 255, 0.03)" }}
            >
              <Grid item xs={12} sx={{ py: 3 }}>
                {menuLateral}
              </Grid>
            </Grid>
            <Grid
              item
              sm={1.5}
              sx={{ backgroundColor: "rgba(255, 255, 255, 0.03)", display: { xs: "block", md: "none" } }}
            >
              <Drawer
                variant="temporary"
                open={menuAberto}
                onClose={() => setMenuAberto(false)}
                ModalProps={{
                  keepMounted: true,
                }}
                sx={{
                  display: { xs: "block", md: "none" },
                }}
              >
                {menuLateral}
              </Drawer>
            </Grid>
            <Grid item xs={12} md={10.5}>
              <header>
                <Grid container sx={{ py: 3, borderBottom: 1 }} justifyContent={"end"}>
                  <Grid
                    item
                    xs="auto"
                    sx={{ mr: "auto", ml: 2 }}
                    alignSelf={"center"}
                    display={{ sx: "block", md: "none" }}
                  >
                    <Box onClick={() => setMenuAberto(true)}>
                      <MenuRounded fontSize="large" />
                    </Box>
                  </Grid>
                  <Grid item xs="auto">
                    <Avatar>{user.displayName ? user.displayName[0] : "A"}</Avatar>
                  </Grid>
                  <Grid item xs="auto" sx={{ ml: 1, mr: 3 }} alignSelf={"center"}>
                    <Typography variant={"body2"}>{user.displayName}</Typography>
                  </Grid>
                  <Grid item xs="auto" sx={{ pr: { xs: 2, sm: 5 } }} alignSelf={"center"}>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        signOutUser().then(() => navigate("../login"));
                      }}
                    >
                      Logout
                    </Button>
                  </Grid>
                </Grid>
              </header>
              <div className="App">
                <Container maxWidth="lg">
                  <Outlet context={[user]} />
                </Container>
              </div>
            </Grid>
          </Grid>
        </GlobalContext.Provider>
      ) : null}
    </ThemeProvider>
  );
}

export default App;

