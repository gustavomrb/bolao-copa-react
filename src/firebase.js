import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  setDoc,
  setDocs,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import jogosCopa from "./jogosCopa.json";

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
  let jogosCopaNovo = { jogos: {} };

  const jogosCopaSnap = await getDocs(collection(database, "jogosCopa"));
  const jogosCopaJson = jogosCopaSnap.docs;

  for (let jogoCopaJson of jogosCopaJson) {
    jogosCopaNovo.jogos[jogoCopaJson.id] = jogoCopaJson.data();
  }

  await setDoc(doc(database, "jogosBolao", "QwTr3XjKwUsWcOu6Mwmg"), jogosCopaNovo);
})();*/

/*(async () => {
  const resultadosUsuarioSnap = await getDocs(collection(database, "resultadosUsuario"));
  const resultadosUsuarioJson = resultadosUsuarioSnap.docs;

  let resultadoUsuarioNovo = {};
  resultadoUsuarioNovo.usuarios = {}

  for(let resultadoUsuarioJson of resultadosUsuarioJson) {
    resultadoUsuarioNovo.usuarios[resultadoUsuarioJson.id] = resultadoUsuarioJson.data();
  }

  await setDoc(doc(database, "resultadosUsuariosBoloes", "QwTr3XjKwUsWcOu6Mwmg"), resultadoUsuarioNovo);
})();*/

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

/*(async () => {
  const selecoesCopa = (await getDocs(collection(database, "selecoesCopa"))).docs;
  const idsJogos = [];
  for (let jogoCopa of jogosCopa) {
    const selecao1 = selecoesCopa.find((s) => s.data().nome === jogoCopa.times[0]).id;
    const selecao2 = selecoesCopa.find((s) => s.data().nome === jogoCopa.times[1]).id;
    const dia = parseInt(jogoCopa.data.split("/")[0]);
    const horarioSplit = jogoCopa.horario.split(":");
    const jogo = {
      data: Timestamp.fromDate(new Date(2022, 11, dia, parseInt(horarioSplit[0]), 0, 0, 0)),
      fase: jogoCopa.fase,
      gols1: null,
      gols2: null,
      grupo: "A",
      times: [selecao1, selecao2],
    };

    const docRef = await addDoc(collection(database, "jogosCopa"), jogo);
    idsJogos.push(docRef.id);
  }

  const usuarios = (await getDocs(collection(database, "users"))).docs;
  for (let usuario of usuarios) {
    for (let idJogo of idsJogos) {
      await updateDoc(doc(database, "resultadosUsuario", usuario.id), {
        [`jogos.${idJogo}`]: { gols1: "", gols2: "", pontos: "" },
      });
    }

    await updateDoc(doc(database, "users", usuario.id), {
      resultadosFase1: false,
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
  const dataAgora = new Date();
  const dataPrimeiroJogo = new Date(2022, 11, 17, 12, 0, 0, 0);
  if (dataAgora.getTime() < dataPrimeiroJogo.getTime()) {
    await updateDoc(doc(database, "resultadosUsuariosBoloes", "QwTr3XjKwUsWcOu6Mwmg"), {
      [user.uid]: resultados
    });
    let resultadosCompletos = true;
    for (let jogoId in resultados.jogos) {
      const jogo = resultados.jogos[jogoId];
      if (jogo.fase === 5 && (jogo.gols1 === null || jogo.gols2 === null)) {
        resultadosCompletos = false;
        break;
      }
    }
    const artilheiroCampeao = resultados.artilheiro !== "" && resultados.campeao !== "";
    const userDoc = doc(database, "users", user.uid);
    await updateDoc(userDoc, {
      artilheiroCampeao: artilheiroCampeao,
      resultadosFase1: resultadosCompletos,
    });
    return true;
  }
  return false;
  /*const dataAgora = new Date();
  const dataPrimeiroJogo = new Date(2022, 11, 17, 12, 0, 0, 0);
  if (dataAgora.getTime() < dataPrimeiroJogo.getTime()) {
    await setDoc(doc(database, "resultadosUsuario", user.uid), resultados);
    let resultadosCompletos = true;
    for (let jogoId in resultados.jogos) {
      const jogo = resultados.jogos[jogoId];
      if (jogo.fase === 5 && (jogo.gols1 === null || jogo.gols2 === null)) {
        resultadosCompletos = false;
        break;
      }
    }
    const artilheiroCampeao = resultados.artilheiro !== "" && resultados.campeao !== "";
    const userDoc = doc(database, "users", user.uid);
    await updateDoc(userDoc, {
      artilheiroCampeao: artilheiroCampeao,
      resultadosFase1: resultadosCompletos,
    });
    return true;
  }
  return false;*/
};

const atualizaPontosUsuario = async (userId, idJogo, pontos) => {
  const property = `jogos.${idJogo}.pontos`;
  await updateDoc(doc(database, "resultadosUsuario", userId), { [property]: pontos });
};

const updateJogoCopa = async (idJogo, idData) => {
  await setDoc(doc(database, "jogosCopa", idJogo), idData);
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
  buscaUsuario,
  updateJogoCopa,
  atualizaPontosUsuario,
};
