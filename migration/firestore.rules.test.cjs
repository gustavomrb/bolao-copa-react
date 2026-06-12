const fs = require("node:fs");
const path = require("node:path");
const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require("@firebase/rules-unit-testing");
const {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} = require("firebase/firestore");
const { after, before, beforeEach, test } = require("node:test");

const projectId = "demo-bolao";
const bolaoId = "copa";
const futurePhase = "1";
const revealedPhase = "2";
let testEnvironment;

const firestoreFor = (userId) =>
  testEnvironment.authenticatedContext(userId).firestore();

before(async () => {
  const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8282").split(":");
  testEnvironment = await initializeTestEnvironment({
    projectId,
    firestore: {
      host,
      port: Number(port),
      rules: fs.readFileSync(path.resolve(__dirname, "..", "firestore.rules"), "utf8"),
    },
  });
});

beforeEach(async () => {
  await testEnvironment.clearFirestore();
  const future = Timestamp.fromMillis(Date.now() + 60 * 60 * 1000);
  const past = Timestamp.fromMillis(Date.now() - 60 * 60 * 1000);

  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await setDoc(doc(db, "users", "admin"), { nome: "Admin", isAdmin: true });
    await setDoc(doc(db, "users", "user1"), { nome: "User 1" });
    await setDoc(doc(db, "users", "user2"), { nome: "User 2" });
    await setDoc(doc(db, "boloes", bolaoId), {
      palpitesGeraisFechaEm: future,
      palpitesGeraisRevelaEm: future,
    });
    await setDoc(doc(db, "boloes", bolaoId, "fases", futurePhase), {
      fechaEm: future,
      revelaEm: future,
    });
    await setDoc(doc(db, "boloes", bolaoId, "fases", revealedPhase), {
      fechaEm: past,
      revelaEm: past,
    });

    for (const phaseId of [futurePhase, revealedPhase]) {
      for (const userId of ["user1", "user2"]) {
        await setDoc(
          doc(db, "boloes", bolaoId, "fases", phaseId, "palpites", userId),
          {
            jogos: { jogo1: { gols1: 1, gols2: 0 } },
            schemaVersion: 3,
          },
        );
        await setDoc(
          doc(db, "boloes", bolaoId, "fases", phaseId, "pontuacoes", userId),
          {
            jogos: { jogo1: { pontos: 5 } },
            schemaVersion: 3,
          },
        );
      }
    }

    await setDoc(doc(db, "boloes", bolaoId, "palpitesGerais", "user1"), {
      campeao: "Brasil",
      artilheiro: "Jogador",
      schemaVersion: 3,
    });
    await setDoc(doc(db, "boloes", bolaoId, "participantes", "user1"), {
      pago: true,
      envios: { fases: { "1": true }, palpitesGerais: true },
      schemaVersion: 3,
    });
    await setDoc(doc(db, "resultadosUsuariosBoloes", bolaoId), {
      usuarios: { user1: { jogos: {} } },
    });
  });
});

after(async () => {
  if (testEnvironment) await testEnvironment.cleanup();
});

test("usuario le o proprio palpite futuro, mas nao o de outro usuario", async () => {
  const db = firestoreFor("user1");

  await assertSucceeds(
    getDoc(doc(db, "boloes", bolaoId, "fases", futurePhase, "palpites", "user1")),
  );
  await assertFails(
    getDoc(doc(db, "boloes", bolaoId, "fases", futurePhase, "palpites", "user2")),
  );
  await assertFails(
    getDocs(collection(db, "boloes", bolaoId, "fases", futurePhase, "palpites")),
  );
});

test("palpites da fase revelada podem ser listados", async () => {
  const db = firestoreFor("user1");
  await assertSucceeds(
    getDocs(collection(db, "boloes", bolaoId, "fases", revealedPhase, "palpites")),
  );
});

test("usuario grava apenas o proprio palpite antes do prazo", async () => {
  const db = firestoreFor("user1");
  const prediction = {
    jogos: { jogo1: { gols1: 2, gols2: 1 } },
    schemaVersion: 3,
  };

  await assertSucceeds(
    setDoc(doc(db, "boloes", bolaoId, "fases", futurePhase, "palpites", "user1"), prediction),
  );
  await assertFails(
    setDoc(doc(db, "boloes", bolaoId, "fases", futurePhase, "palpites", "user2"), prediction),
  );
  await assertFails(
    setDoc(doc(db, "boloes", bolaoId, "fases", revealedPhase, "palpites", "user1"), prediction),
  );
});

test("pontuacao futura e privada, e somente administrador altera", async () => {
  const userDb = firestoreFor("user1");
  const otherDb = firestoreFor("user2");
  const adminDb = firestoreFor("admin");
  const scoreRef = doc(
    userDb,
    "boloes",
    bolaoId,
    "fases",
    futurePhase,
    "pontuacoes",
    "user1",
  );

  await assertSucceeds(getDoc(scoreRef));
  await assertFails(
    getDoc(doc(otherDb, "boloes", bolaoId, "fases", futurePhase, "pontuacoes", "user1")),
  );
  await assertFails(
    getDocs(collection(otherDb, "boloes", bolaoId, "fases", futurePhase, "pontuacoes")),
  );
  await assertFails(updateDoc(scoreRef, { "jogos.jogo1.pontos": 10 }));
  await assertSucceeds(
    updateDoc(
      doc(adminDb, "boloes", bolaoId, "fases", futurePhase, "pontuacoes", "user1"),
      { "jogos.jogo1.pontos": 10 },
    ),
  );
});

test("pontuacoes da fase revelada podem ser listadas", async () => {
  const db = firestoreFor("user1");
  await assertSucceeds(
    getDocs(collection(db, "boloes", bolaoId, "fases", revealedPhase, "pontuacoes")),
  );
});

test("usuario atualiza status de envio, mas nao o pagamento", async () => {
  const db = firestoreFor("user1");
  const participantRef = doc(db, "boloes", bolaoId, "participantes", "user1");

  await assertSucceeds(
    updateDoc(participantRef, {
      envios: { fases: { "1": false }, palpitesGerais: true },
      schemaVersion: 3,
    }),
  );
  await assertFails(updateDoc(participantRef, { pago: false }));
});

test("palpites gerais futuros ficam privados", async () => {
  const userDb = firestoreFor("user1");
  const otherDb = firestoreFor("user2");

  await assertSucceeds(
    getDoc(doc(userDb, "boloes", bolaoId, "palpitesGerais", "user1")),
  );
  await assertFails(
    getDoc(doc(otherDb, "boloes", bolaoId, "palpitesGerais", "user1")),
  );
  await assertFails(
    getDocs(collection(otherDb, "boloes", bolaoId, "palpitesGerais")),
  );
});

test("colecao legada fica restrita ao administrador", async () => {
  const userDb = firestoreFor("user1");
  const adminDb = firestoreFor("admin");

  await assertFails(getDoc(doc(userDb, "resultadosUsuariosBoloes", bolaoId)));
  await assertSucceeds(getDoc(doc(adminDb, "resultadosUsuariosBoloes", bolaoId)));
});

test("subcolecoes ficam inacessiveis quando o bolao pai e excluido", async () => {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await deleteDoc(doc(context.firestore(), "boloes", bolaoId));
  });

  for (const userId of ["user1", "admin"]) {
    const db = firestoreFor(userId);

    await assertFails(
      getDoc(doc(db, "boloes", bolaoId, "fases", revealedPhase)),
    );
    await assertFails(
      getDoc(doc(db, "boloes", bolaoId, "fases", revealedPhase, "palpites", "user1")),
    );
    await assertFails(
      getDoc(doc(db, "boloes", bolaoId, "participantes", "user1")),
    );
  }
});
