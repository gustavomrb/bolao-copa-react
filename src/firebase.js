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
  writeBatch,
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

const salvarResultados = async ({
  resultados,
  user,
  bolaoId,
  faseId,
  jogosFase,
  salvarPalpitesGerais,
}) => {
  const jogos = {};
  for (const jogo of jogosFase) {
    const resultado = resultados.jogos[jogo.id] || {};
    jogos[jogo.id] = {
      gols1: resultado.gols1 ?? "",
      gols2: resultado.gols2 ?? "",
    };
  }

  const faseCompleta = Object.values(jogos).every(
    (jogo) => jogo.gols1 !== "" && jogo.gols2 !== "",
  );
  const geraisCompletos = Boolean(resultados.campeao && resultados.artilheiro);
  const batch = writeBatch(database);

  batch.set(
    doc(database, "boloes", bolaoId, "fases", String(faseId), "palpites", user.uid),
    { jogos, schemaVersion: 3 },
  );

  if (salvarPalpitesGerais) {
    batch.set(
      doc(database, "boloes", bolaoId, "palpitesGerais", user.uid),
      {
        campeao: resultados.campeao || "",
        artilheiro: resultados.artilheiro || "",
        schemaVersion: 3,
      },
    );
  }

  batch.set(
    doc(database, "boloes", bolaoId, "participantes", user.uid),
    {
      envios: {
        fases: { [String(faseId)]: faseCompleta },
        ...(salvarPalpitesGerais ? { palpitesGerais: geraisCompletos } : {}),
      },
      schemaVersion: 3,
    },
    { merge: true },
  );

  try {
    await batch.commit();
    return true;
  } catch (error) {
    if (error && error.code === "permission-denied") return false;
    throw error;
  }
};

const atualizaPontosUsuario = async (idBolao, faseId, userId, idJogo, pontos) => {
  await setDoc(
    doc(database, "boloes", idBolao, "fases", String(faseId), "pontuacoes", userId),
    {
      jogos: {
        [idJogo]: { pontos },
      },
      schemaVersion: 3,
    },
    { merge: true },
  );
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
  await setDoc(
    doc(database, "boloes", idBolao, "participantes", usuario.id),
    {
      pago: !usuario.pago,
      schemaVersion: 3,
    },
    { merge: true },
  );
};

const sincronizaPrazosBolao = async (idBolao, jogos, fases = []) => {
  const firstGameByPhase = new Map();

  for (const jogo of jogos) {
    const phaseId = String(jogo.fase);
    const current = firstGameByPhase.get(phaseId);
    if (!current || jogo.data.toMillis() < current.toMillis()) {
      firstGameByPhase.set(phaseId, jogo.data);
    }
  }

  if (firstGameByPhase.size === 0) return;

  const phaseNames = new Map(fases.map((fase) => [String(fase.id), fase.nome || ""]));
  const firstGame = [...firstGameByPhase.values()].reduce((earliest, date) =>
    date.toMillis() < earliest.toMillis() ? date : earliest
  );
  const batch = writeBatch(database);

  batch.set(
    doc(database, "boloes", idBolao),
    {
      palpitesGeraisFechaEm: firstGame,
      palpitesGeraisRevelaEm: firstGame,
    },
    { merge: true },
  );

  for (const [phaseId, date] of firstGameByPhase.entries()) {
    batch.set(
      doc(database, "boloes", idBolao, "fases", phaseId),
      {
        nome: phaseNames.get(phaseId) || "",
        fechaEm: date,
        revelaEm: date,
        primeiroJogoEm: date,
        schemaVersion: 3,
      },
      { merge: true },
    );
  }

  await batch.commit();
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
  salvarResultados,
  criarUserBanco,
  buscaUsuarios,
  buscaUsuario,
  updateJogoCopa,
  updateArtilheiroCampeao,
  atualizaPontosUsuario,
  atualizaPago,
  sincronizaPrazosBolao,
  resetPassword,
};
