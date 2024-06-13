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
import selecoes from "./selecoes.json";
import { update } from "firebase/database";

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
  let equipesBolaoNovo = { equipes: {} };

  for (let selecao of selecoes) {
    equipesBolaoNovo.equipes[doc(collection(database, "equipesBolao")).id] = selecao;
  }

  await setDoc(doc(database, "equipesBolao", "De1Xl4hSYBWbqHLjAjDp"), equipesBolaoNovo);
})();*/

//Novo modo de adicionar equipes.
/*(async () => {
  let equipesBolaoNovo = { equipes: {} };

  const selecoesCopaSnap = await getDocs(collection(database, "selecoesCopa"));
  const selecoesCopaJson = selecoesCopaSnap.docs;

  for (let selecaoCopaJson of selecoesCopaJson) {
    equipesBolaoNovo.equipes[selecaoCopaJson.id] = selecaoCopaJson.data();
  }

  await setDoc(doc(database, "equipesBolao", "QwTr3XjKwUsWcOu6Mwmg"), equipesBolaoNovo);
})();*/

//Migração de jogosCopa para jogosBolao
/*(async () => {
  let jogosCopaNovo = { jogos: {} };

  const jogosCopaSnap = await getDocs(collection(database, "jogosCopa"));
  const jogosCopaJson = jogosCopaSnap.docs;

  for (let jogoCopaJson of jogosCopaJson) {
    jogosCopaNovo.jogos[jogoCopaJson.id] = jogoCopaJson.data();
  }

  await setDoc(doc(database, "jogosBolao", "QwTr3XjKwUsWcOu6Mwmg"), jogosCopaNovo);
})();*/

//Migração de resultadosUsuario para resultadosUsuariosBoloes.
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

//Atualiza se pessoa mandou todos os resultados e artilheiro e campeão.
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
  let equipesBolao = await getDoc(doc(database, "equipesBolao", "De1Xl4hSYBWbqHLjAjDp"));
  equipesBolao = new Map(Object.entries(equipesBolao.data().equipes));
  console.log(jogosCopa);
  const idsJogos = [];
  for (let jogoCopa of jogosCopa) {
    let selecao1, selecao2 = null;
    for(let [id, equipe] of equipesBolao) {
      if(jogoCopa.times[0] === equipe.nome) selecao1 = id;
      if(jogoCopa.times[1] === equipe.nome) selecao2 = id;
      if(selecao1 && selecao2) break;
    }

    const dataSplit = jogoCopa.data.split("/").map(v => parseInt(v));
    const horarioSplit = jogoCopa.horario.split(":").map(v => parseInt(v));
    const jogo = {
      data: Timestamp.fromDate(new Date(dataSplit[2], dataSplit[1], dataSplit[0], horarioSplit[0], horarioSplit[1], 0, 0)),
      fase: jogoCopa.fase,
      gols1: null,
      gols2: null,
      grupo: jogoCopa.grupo,
      times: [selecao1, selecao2],
    };

    const idJogo = doc(collection(database, "equipesBolao")).id
    await updateDoc(doc(database, "jogosBolao", "De1Xl4hSYBWbqHLjAjDp"), { [`jogos.${idJogo}`] : jogo });
    console.log("fez update")
    idsJogos.push(idJogo);
  }

  const usuarios = (await getDocs(collection(database, "users"))).docs;
  for (let usuario of usuarios) {
    for (let idJogo of idsJogos) {
      await updateDoc(doc(database, "resultadosUsuariosBoloes", "De1Xl4hSYBWbqHLjAjDp"), {
        [`usuarios.${usuario.id}.jogos.${idJogo}`]: { gols1: "", gols2: "", pontos: "" },
      });
    }

    /*await updateDoc(doc(database, "users", usuario.id), {
      resultadosFase1: false,
    });
  }
})();*/

//Cria jogosCopa e resultadosUsuarios para um bolão.
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

const salvarResultados = async (resultados, user, bolao) => {
  const dataAgora = new Date();
  const dataPrimeiroJogo = new Date(2024, 6, 13, 16, 0, 0, 0);
  if (dataAgora.getTime() < dataPrimeiroJogo.getTime()) {
    await updateDoc(doc(database, "resultadosUsuariosBoloes", bolao), {
      [`usuarios.${user.uid}`]: resultados,
    });
    /*let resultadosCompletos = true;
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
    });*/
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

const atualizaPontosUsuario = async (idBolao, userId, idJogo, pontos) => {
  const property = `usuarios.${userId}.jogos.${idJogo}.pontos`;
  await updateDoc(doc(database, "resultadosUsuariosBoloes", idBolao), {
    [property]: pontos,
  });
  /*const property = `jogos.${idJogo}.pontos`;
  await updateDoc(doc(database, "resultadosUsuario", userId), { [property]: pontos });*/
};

const updateJogoCopa = async (idBolao, idJogo, idData) => {
  await updateDoc(doc(database, "jogosBolao", idBolao), {[`jogos.${idJogo}`] : idData});
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
