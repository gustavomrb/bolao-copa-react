import "./App.css";
import {
  Avatar,
  Box,
  Button,
  Container,
  createTheme,
  CssBaseline,
  Drawer,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ThemeProvider,
  Toolbar,
  Typography,
} from "@mui/material";
import { Outlet, useNavigate } from "react-router-dom";
import { auth, signOutUser } from "./firebase";
import { LaptopChromebook, Toc, MenuRounded } from "@mui/icons-material";
import { useAuthState } from "react-firebase-hooks/auth";
import React, { useEffect } from "react";
import { useState } from "react";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

function App() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);

  const menuLateral = (
    <React.Fragment>
      <Toolbar>
        <Typography variant="h6">Bolão da Leopoldina</Typography>
      </Toolbar>
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
        {/*<ListItem
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
        </ListItem>*/}
        <ListItem disablePadding sx={{ flexDirection: "column", justifyContent: "center", mt: 1, gap: 0.5 }}>
          <Typography variant={"body1"}>Pix para pagamento</Typography>
          <Typography variant={"body2"}>21997586852</Typography>
          <Typography variant={"body2"}>Gustavo Mendonça</Typography>
          <Typography variant={"body2"}>Valor: 50R$</Typography>
        </ListItem>
      </List>
    </React.Fragment>
  );

  useEffect(() => {
    if (!user) {
      navigate("../login");
    }
  }, [user, navigate]);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      {user ? (
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
                <Outlet />
              </Container>
            </div>
          </Grid>
        </Grid>
      ) : null}
    </ThemeProvider>
  );
}

export default App;
