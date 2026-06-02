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
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
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

const salvarResultados = async (resultados, user, bolao, dataPrimeiroJogoFase) => {
  const dataAgora = new Date();

  // Se a fase já começou, não pode salvar de jeito nenhum
  if (dataAgora.getTime() >= dataPrimeiroJogoFase.getTime()) {
    return false;
  }

  await updateDoc(doc(database, "resultadosUsuariosBoloes", bolao), {
    [`usuarios.${user.uid}`]: resultados,
  });
  return true;
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

const updateArtilheiroCampeao = async (idBolao, artilheiro, campeao) => {
  await updateDoc(doc(database, "jogosBolao", idBolao), {
    artilheiro: artilheiro,
    campeao: campeao,
  });
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
  updateArtilheiroCampeao,
  atualizaPontosUsuario,
  atualizaPago,
  resetPassword,
};
