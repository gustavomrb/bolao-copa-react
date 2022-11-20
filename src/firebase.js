import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, doc, getDoc, getDocs, getFirestore, orderBy, query, setDoc, updateDoc } from "firebase/firestore";

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

/*(async () => {
  const usersSnap = await getDocs(collection(database, "users"));
  const usersJson = usersSnap.docs;
  const resultadosSnap = await getDocs(collection(database, "resultadosUsuario"));
  const resultadosJson = resultadosSnap.docs;

  for (let user of usersJson) {
    let resultadosCompletos = true;
    const resultado = resultadosJson.find((r) => r.id === user.id);
    for (let jogoId in resultado.data().jogos) {
      const jogo = resultado.data().jogos[jogoId];
      if (jogo.gols1 === "" || jogo.gols2 === "") {
        resultadosCompletos = false;
        break;
      }
    }
    const artilheiroCampeao = resultado.data().artilheiro !== "" && resultado.data().campeao !== "";
    const userDoc = doc(database, "users", user.id);
    await updateDoc(userDoc, {
      artilheiroCampeao: artilheiroCampeao,
      resultadosFase1: resultadosCompletos,
    });
  }
})();*/

const buscaJogosCopa = async () => {
  return getDocs(query(collection(database, "jogosCopa"), orderBy("data")));
};

const buscaSelecoesCopa = async () => {
  return getDocs(collection(database, "selecoesCopa"));
};

const buscaUsuarios = async () => {
  return await getDocs(query(collection(database, "users"), orderBy("nome", "asc")));
};

const buscaUsuario = async (id) => {
  return getDoc(doc(database, "users", id));
};

const buscarResultados = async (user) => {
  const resultadosSnap = await getDoc(doc(database, "resultadosUsuario", user.uid));
  if (resultadosSnap.exists()) {
    return resultadosSnap.data();
  } else {
    return null;
  }
};

const buscarTodosResultados = async () => {
  return getDocs(collection(database, "resultadosUsuario"));
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

const salvarResultados = async (resultados, user) => {
  await setDoc(doc(database, "resultadosUsuario", user.uid), resultados);
  let resultadosCompletos = true;
  for (let jogoId in resultados.jogos) {
    const jogo = resultados.jogos[jogoId];
    if (jogo.gols1 === "" || jogo.gols2 === "") {
      resultadosCompletos = false;
      break;
    }
  }
  const artilheiroCampeao = resultados.artilheiro !== "" && resultados.campeao !== "";
  const userDoc = doc(database, "users", user.uid);
  return await updateDoc(userDoc, {
    artilheiroCampeao: artilheiroCampeao,
    resultadosFase1: resultadosCompletos,
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

export {
  app,
  auth,
  analytics,
  criarUsuario,
  logarUsuario,
  signOutUser,
  database,
  buscaJogosCopa,
  buscaSelecoesCopa,
  criarResultados,
  buscarResultados,
  salvarResultados,
  criarUserBanco,
  buscaUsuarios,
  buscarTodosResultados,
  buscaUsuario,
};
