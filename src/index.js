import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import MeuBolao from "./MeuBolao";
import LoginPage from "./LoginPage";
import SignUpPage from "./SignUpPage";
import Situacao from "./Situacao";
import Regras from "./Regras";
import Resultados from "./Resultados";
import Secada from "./Secada";
import Classificacao from "./Classificacao";
import Admin from "./Admin";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<App />}>
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<MeuBolao />} />
          <Route path="/situacao" element={<Situacao />} />
          <Route path="/regras" element={<Regras />} />
          <Route path="/resultados" element={<Resultados />} />
          <Route path="/secada" element={<Secada />} />
          <Route path="/classificacao" element={<Classificacao />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
