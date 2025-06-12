import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD4r2ZPEVjFTQ4EdhaNaS1b8tXvT_MTsok",
  authDomain: "bolao-copa-leopoldina.firebaseapp.com",
  projectId: "bolao-copa-leopoldina",
  storageBucket: "bolao-copa-leopoldina.appspot.com",
  messagingSenderId: "65654442188",
  appId: "1:65654442188:web:168e184387083d9fcd1a69",
  measurementId: "G-0FBMGV4Y4D",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const analytics = getAnalytics(app);
const database = getFirestore(app);

const buscaJogosBolao = async (idBolao) => {
  return getDoc(query(doc(database, "jogosBolao"), idBolao));
};

const buscaEquipesBolao = async (idBolao) => {
  return await getDoc(doc(database, "equipesBolao", idBolao));
};

const buscaUsuarios = async () => {
  return await getDocs(query(collection(database, "users"), orderBy("nome", "asc")));
};

const buscaUsuario = async (id) => {
  return getDoc(doc(database, "users", id));
};

const buscarResultados = async (idBolao) => {
  return await getDoc(doc(database, "resultadosUsuario", idBolao));
};

const criarResultados = async (jogosCopa, user) => {
  const resultadosUsuario = {
    campeao: "",
    artilheiro: "",
    jogos: {},
  };
  for (let jogo of jogosCopa) {
    resultadosUsuario.jogos[jogo.id] = { gols1: "", gols2: "", pontos: "" };
  }
  await setDoc(doc(database, "resultadosUsuario", user.uid), resultadosUsuario);
  return resultadosUsuario;
};

const salvarResultados = async (resultados, user, bolao, dataPrimeiroJogo) => {
  const dataAgora = new Date();
  if (dataAgora.getTime() < dataPrimeiroJogo.getTime()) {
    await updateDoc(doc(database, "resultadosUsuariosBoloes", bolao), {
      [`usuarios.${user.uid}`]: resultados,
    });
    return true;
  }
  return false;
};

const atualizaPontosUsuario = async (idBolao, userId, idJogo, pontos) => {
  const property = `usuarios.${userId}.jogos.${idJogo}.pontos`;
  await updateDoc(doc(database, "resultadosUsuariosBoloes", idBolao), {
    [property]: pontos,
  });
};

const updateJogoCopa = async (idBolao, idJogo, idData) => {
  await updateDoc(doc(database, "jogosBolao", idBolao), { [`jogos.${idJogo}`]: idData });
};

const criarUsuario = (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

const logarUsuario = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

const criarUserBanco = async (id, email, nome) => {
  return setDoc(doc(database, "users", id), {
    email: email,
    nome: nome,
    resultadosFase1: false,
    artilheiroCampeao: false,
    pago: false,
  });
};

const signOutUser = () => {
  return signOut(auth);
};

const atualizaPago = async (idBolao, usuario) => {
  await updateDoc(doc(database, "resultadosUsuariosBoloes", idBolao), {
    [`usuarios.${usuario.id}.pago`]: !usuario.pago,
  });
};

const resetPassword = (email) => {
  return sendPasswordResetEmail(auth, email);
};

export {
  app,
  auth,
  analytics,
  criarUsuario,
  logarUsuario,
  signOutUser,
  database,
  buscaEquipesBolao,
  buscaJogosBolao,
  criarResultados,
  buscarResultados,
  salvarResultados,
  criarUserBanco,
  buscaUsuarios,
  buscaUsuario,
  updateJogoCopa,
  atualizaPontosUsuario,
  atualizaPago,
  resetPassword,
};
