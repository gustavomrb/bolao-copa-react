const fs = require("node:fs");
const path = require("node:path");
const {
  applicationDefault,
  getApps,
  initializeApp,
} = require("firebase-admin/app");
const {
  FieldValue,
  Timestamp,
  getFirestore,
} = require("firebase-admin/firestore");

const MIGRATION_VERSION = 3;

function parseArgs(argv) {
  const options = {
    execute: false,
    verifyTarget: false,
    bolaoId: null,
    projectId: null,
    confirmedProjectId: null,
  };

  for (const arg of argv) {
    if (arg === "--execute") options.execute = true;
    else if (arg === "--verify-target") options.verifyTarget = true;
    else if (arg.startsWith("--bolao=")) options.bolaoId = arg.slice("--bolao=".length);
    else if (arg.startsWith("--project=")) options.projectId = arg.slice("--project=".length);
    else if (arg.startsWith("--confirm-project=")) {
      options.confirmedProjectId = arg.slice("--confirm-project=".length);
    } else {
      throw new Error(`Argumento desconhecido: ${arg}`);
    }
  }

  return options;
}

function readDefaultProjectId() {
  const firebaseRcPath = path.resolve(__dirname, "..", ".firebaserc");
  if (!fs.existsSync(firebaseRcPath)) return null;

  const firebaseRc = JSON.parse(fs.readFileSync(firebaseRcPath, "utf8"));
  return firebaseRc.projects && firebaseRc.projects.default;
}

function normalizePhaseId(value) {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

function timestampMillis(value) {
  if (value instanceof Timestamp) return value.toMillis();
  if (value && typeof value.toMillis === "function") return value.toMillis();
  return null;
}

function sortedObject(value) {
  return Object.fromEntries(
    Object.entries(value || {}).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

function stableJson(value) {
  return JSON.stringify(canonicalize(value));
}

function buildPlan(legacyData, gamesData, bolaoData) {
  const errors = [];
  const warnings = [];
  const phaseDefinitions = new Map();
  const gamePhaseById = new Map();
  const gameIdsByPhase = new Map();
  const games = gamesData.jogos || {};

  for (const [gameId, game] of Object.entries(games)) {
    const phaseId = normalizePhaseId(game && game.fase);
    const gameDateMillis = timestampMillis(game && game.data);

    if (!phaseId) {
      errors.push(`Jogo ${gameId} nao possui fase.`);
      continue;
    }

    if (gameDateMillis === null) {
      errors.push(`Jogo ${gameId} da fase ${phaseId} nao possui data valida.`);
      continue;
    }

    gamePhaseById.set(gameId, phaseId);
    if (!gameIdsByPhase.has(phaseId)) gameIdsByPhase.set(phaseId, []);
    gameIdsByPhase.get(phaseId).push(gameId);

    const current = phaseDefinitions.get(phaseId);
    if (!current || gameDateMillis < current.firstGameMillis) {
      phaseDefinitions.set(phaseId, {
        firstGameMillis: gameDateMillis,
        firstGameTimestamp: game.data,
      });
    }
  }

  const phaseNames = new Map(
    (bolaoData.fases || []).map((phase) => [normalizePhaseId(phase.id), phase.nome || ""]),
  );

  const users = [];
  let predictionCount = 0;

  for (const [userId, result] of Object.entries(legacyData.usuarios || {})) {
    const gamesByPhase = new Map();
    const scoresByPhase = new Map();
    const legacyGamesByPhase = new Map();

    for (const [gameId, prediction] of Object.entries(result.jogos || {})) {
      const phaseId = gamePhaseById.get(gameId);

      if (!Object.prototype.hasOwnProperty.call(games, gameId)) {
        errors.push(`Usuario ${userId}: palpite referencia jogo inexistente ${gameId}.`);
        continue;
      }

      if (!phaseId) {
        errors.push(`Usuario ${userId}: jogo ${gameId} nao pode ser associado a uma fase.`);
        continue;
      }

      if (!gamesByPhase.has(phaseId)) gamesByPhase.set(phaseId, {});
      if (!scoresByPhase.has(phaseId)) scoresByPhase.set(phaseId, {});
      if (!legacyGamesByPhase.has(phaseId)) legacyGamesByPhase.set(phaseId, {});

      const { pontos = "", ...editablePrediction } = prediction || {};
      gamesByPhase.get(phaseId)[gameId] = editablePrediction;
      scoresByPhase.get(phaseId)[gameId] = { pontos };
      legacyGamesByPhase.get(phaseId)[gameId] = prediction;
      predictionCount += 1;
    }

    users.push({
      userId,
      phases: [...gamesByPhase.entries()].map(([phaseId, phaseGames]) => ({
        phaseId,
        games: sortedObject(phaseGames),
        scores: sortedObject(scoresByPhase.get(phaseId)),
        legacyGames: sortedObject(legacyGamesByPhase.get(phaseId)),
      })),
      general: {
        campeao: result.campeao || "",
        artilheiro: result.artilheiro || "",
      },
      participant: {
        pago: result.pago === true,
        envios: {
          fases: Object.fromEntries(
            [...gameIdsByPhase.entries()].map(([phaseId, gameIds]) => [
              phaseId,
              gameIds.every((gameId) => {
                const prediction = result.jogos && result.jogos[gameId];
                return prediction
                  && prediction.gols1 !== null
                  && prediction.gols1 !== ""
                  && prediction.gols1 !== undefined
                  && prediction.gols2 !== null
                  && prediction.gols2 !== ""
                  && prediction.gols2 !== undefined;
              }),
            ]),
          ),
          palpitesGerais: Boolean(result.campeao && result.artilheiro),
        },
      },
    });
  }

  for (const phase of bolaoData.fases || []) {
    const phaseId = normalizePhaseId(phase.id);
    if (phaseId && !phaseDefinitions.has(phaseId)) {
      warnings.push(`Fase cadastrada ${phaseId} nao possui jogos.`);
    }
  }

  return {
    errors,
    warnings,
    phases: [...phaseDefinitions.entries()].map(([phaseId, definition]) => ({
      phaseId,
      name: phaseNames.get(phaseId) || "",
      ...definition,
    })),
    users,
    predictionCount,
    generalDeadline: [...phaseDefinitions.values()].reduce(
      (earliest, phase) => (
        !earliest || phase.firstGameMillis < earliest.firstGameMillis ? phase : earliest
      ),
      null,
    ),
  };
}

async function loadLegacyDocuments(db, bolaoId) {
  if (bolaoId) {
    const snapshot = await db.doc(`resultadosUsuariosBoloes/${bolaoId}`).get();
    return snapshot.exists ? [snapshot] : [];
  }

  const snapshot = await db.collection("resultadosUsuariosBoloes").get();
  return snapshot.docs;
}

async function verifyTarget(db, bolaoId, plan) {
  const errors = [];
  const bolaoSnapshot = await db.doc(`boloes/${bolaoId}`).get();
  const bolao = bolaoSnapshot.data() || {};

  if (
    !plan.generalDeadline
    || timestampMillis(bolao.palpitesGeraisFechaEm) !== plan.generalDeadline.firstGameMillis
    || timestampMillis(bolao.palpitesGeraisRevelaEm) !== plan.generalDeadline.firstGameMillis
  ) {
    errors.push("Divergencia nos prazos dos palpites gerais.");
  }

  for (const phase of plan.phases) {
    const phaseSnapshot = await db.doc(`boloes/${bolaoId}/fases/${phase.phaseId}`).get();
    if (!phaseSnapshot.exists) {
      errors.push(`Destino ausente: fase ${phase.phaseId}.`);
    } else {
      const actual = phaseSnapshot.data();
      if (
        actual.nome !== phase.name
        || timestampMillis(actual.fechaEm) !== phase.firstGameMillis
        || timestampMillis(actual.revelaEm) !== phase.firstGameMillis
      ) {
        errors.push(`Divergencia na fase ${phase.phaseId}.`);
      }
    }
  }

  for (const user of plan.users) {
    const generalSnapshot = await db.doc(`boloes/${bolaoId}/palpitesGerais/${user.userId}`).get();
    const participantSnapshot = await db.doc(`boloes/${bolaoId}/participantes/${user.userId}`).get();

    if (!generalSnapshot.exists) {
      errors.push(`Destino ausente: palpites gerais de ${user.userId}.`);
    } else {
      const actual = generalSnapshot.data();
      if (stableJson(actual) !== stableJson({ ...user.general, schemaVersion: MIGRATION_VERSION })) {
        errors.push(`Divergencia nos palpites gerais de ${user.userId}.`);
      }
    }

    if (!participantSnapshot.exists) {
      errors.push(`Destino ausente: participante ${user.userId}.`);
    } else {
      const actual = participantSnapshot.data();
      if (stableJson(actual) !== stableJson({ ...user.participant, schemaVersion: MIGRATION_VERSION })) {
        errors.push(`Divergencia no participante ${user.userId}.`);
      }
    }

    for (const phase of user.phases) {
      const predictionSnapshot = await db
        .doc(`boloes/${bolaoId}/fases/${phase.phaseId}/palpites/${user.userId}`)
        .get();
      const scoreSnapshot = await db
        .doc(`boloes/${bolaoId}/fases/${phase.phaseId}/pontuacoes/${user.userId}`)
        .get();

      if (!predictionSnapshot.exists) {
        errors.push(`Destino ausente: ${user.userId}, fase ${phase.phaseId}.`);
      } else {
        const actual = predictionSnapshot.data();
        if (stableJson(actual) !== stableJson({ jogos: phase.games, schemaVersion: MIGRATION_VERSION })) {
          errors.push(`Divergencia em ${user.userId}, fase ${phase.phaseId}.`);
        }
      }

      if (!scoreSnapshot.exists) {
        errors.push(`Pontuacao ausente: ${user.userId}, fase ${phase.phaseId}.`);
      } else {
        const actual = scoreSnapshot.data();
        if (stableJson(actual) !== stableJson({ jogos: phase.scores, schemaVersion: MIGRATION_VERSION })) {
          errors.push(`Divergencia de pontuacao em ${user.userId}, fase ${phase.phaseId}.`);
        }
      }
    }
  }

  return errors;
}

async function findTargetConflicts(db, bolaoId, plan) {
  const conflicts = [];
  const bolaoSnapshot = await db.doc(`boloes/${bolaoId}`).get();
  const bolao = bolaoSnapshot.data() || {};

  for (const field of ["palpitesGeraisFechaEm", "palpitesGeraisRevelaEm"]) {
    const actualMillis = timestampMillis(bolao[field]);
    if (
      actualMillis !== null
      && (!plan.generalDeadline || actualMillis !== plan.generalDeadline.firstGameMillis)
    ) {
      conflicts.push(`Prazo geral existente divergente: ${field}.`);
    }
  }

  for (const phase of plan.phases) {
    const phaseSnapshot = await db.doc(`boloes/${bolaoId}/fases/${phase.phaseId}`).get();
    if (phaseSnapshot.exists) {
      const actual = phaseSnapshot.data();
      const compatible =
        actual.nome === phase.name
        && timestampMillis(actual.fechaEm) === phase.firstGameMillis
        && timestampMillis(actual.revelaEm) === phase.firstGameMillis;

      if (!compatible) conflicts.push(`Fase existente divergente: ${phase.phaseId}.`);
    }
  }

  for (const user of plan.users) {
    const expectedGeneral = { ...user.general, schemaVersion: MIGRATION_VERSION };
    const expectedParticipant = { ...user.participant, schemaVersion: MIGRATION_VERSION };
    const generalSnapshot = await db.doc(`boloes/${bolaoId}/palpitesGerais/${user.userId}`).get();
    const participantSnapshot = await db.doc(`boloes/${bolaoId}/participantes/${user.userId}`).get();

    if (
      generalSnapshot.exists
      && stableJson(generalSnapshot.data()) !== stableJson(expectedGeneral)
      && stableJson(generalSnapshot.data()) !== stableJson({
        ...user.general,
        schemaVersion: 1,
      })
      && stableJson(generalSnapshot.data()) !== stableJson({
        ...user.general,
        schemaVersion: 2,
      })
    ) {
      conflicts.push(`Palpites gerais existentes divergentes: ${user.userId}.`);
    }

    if (
      participantSnapshot.exists
      && stableJson(participantSnapshot.data()) !== stableJson(expectedParticipant)
      && stableJson(participantSnapshot.data()) !== stableJson({
        pago: user.participant.pago,
        schemaVersion: 1,
      })
      && stableJson(participantSnapshot.data()) !== stableJson({
        pago: user.participant.pago,
        schemaVersion: 2,
      })
    ) {
      conflicts.push(`Participante existente divergente: ${user.userId}.`);
    }

    for (const phase of user.phases) {
      const expectedPrediction = {
        jogos: phase.games,
        schemaVersion: MIGRATION_VERSION,
      };
      const predictionSnapshot = await db
        .doc(`boloes/${bolaoId}/fases/${phase.phaseId}/palpites/${user.userId}`)
        .get();
      const scoreSnapshot = await db
        .doc(`boloes/${bolaoId}/fases/${phase.phaseId}/pontuacoes/${user.userId}`)
        .get();

      if (
        predictionSnapshot.exists
        && stableJson(predictionSnapshot.data()) !== stableJson(expectedPrediction)
        && stableJson(predictionSnapshot.data()) !== stableJson({
          jogos: phase.legacyGames,
          schemaVersion: 1,
        })
        && stableJson(predictionSnapshot.data()) !== stableJson({
          jogos: phase.games,
          schemaVersion: 2,
        })
      ) {
        conflicts.push(`Palpite existente divergente: ${user.userId}, fase ${phase.phaseId}.`);
      }

      if (
        scoreSnapshot.exists
        && stableJson(scoreSnapshot.data()) !== stableJson({
          jogos: phase.scores,
          schemaVersion: 2,
        })
      ) {
        conflicts.push(`Pontuacao existente divergente: ${user.userId}, fase ${phase.phaseId}.`);
      }
    }
  }

  return conflicts;
}

async function writePlan(db, bolaoId, plan) {
  const writer = db.bulkWriter();

  writer.onWriteError((error) => {
    console.error(`Falha ao escrever ${error.documentRef.path}: ${error.message}`);
    return error.failedAttempts < 3;
  });

  writer.set(
    db.doc(`boloes/${bolaoId}`),
    {
      palpitesGeraisFechaEm: plan.generalDeadline.firstGameTimestamp,
      palpitesGeraisRevelaEm: plan.generalDeadline.firstGameTimestamp,
    },
    { merge: true },
  );

  for (const phase of plan.phases) {
    const phaseRef = db.doc(`boloes/${bolaoId}/fases/${phase.phaseId}`);
    writer.set(
      phaseRef,
      {
        nome: phase.name,
        fechaEm: phase.firstGameTimestamp,
        revelaEm: phase.firstGameTimestamp,
        primeiroJogoEm: phase.firstGameTimestamp,
        schemaVersion: MIGRATION_VERSION,
        migradoEm: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  for (const user of plan.users) {
    for (const phase of user.phases) {
      writer.set(
        db.doc(`boloes/${bolaoId}/fases/${phase.phaseId}/palpites/${user.userId}`),
        {
          jogos: phase.games,
          schemaVersion: MIGRATION_VERSION,
        },
      );

      writer.set(
        db.doc(`boloes/${bolaoId}/fases/${phase.phaseId}/pontuacoes/${user.userId}`),
        {
          jogos: phase.scores,
          schemaVersion: MIGRATION_VERSION,
        },
      );
    }

    writer.set(
      db.doc(`boloes/${bolaoId}/palpitesGerais/${user.userId}`),
      {
        ...user.general,
        schemaVersion: MIGRATION_VERSION,
      },
    );

    writer.set(
      db.doc(`boloes/${bolaoId}/participantes/${user.userId}`),
      {
        ...user.participant,
        schemaVersion: MIGRATION_VERSION,
      },
    );
  }

  await writer.close();
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const projectId = options.projectId || readDefaultProjectId();

  if (!projectId) {
    throw new Error("Informe o projeto com --project=ID ou configure .firebaserc.");
  }

  if (options.execute && options.confirmedProjectId !== projectId) {
    throw new Error(
      `Escrita bloqueada. Use --confirm-project=${projectId} para confirmar o projeto.`,
    );
  }

  if (!getApps().length) {
    const appOptions = { projectId };
    if (!process.env.FIRESTORE_EMULATOR_HOST) {
      appOptions.credential = applicationDefault();
    }
    initializeApp(appOptions);
  }

  const db = getFirestore();
  const legacyDocuments = await loadLegacyDocuments(db, options.bolaoId);

  if (legacyDocuments.length === 0) {
    throw new Error("Nenhum documento legado encontrado.");
  }

  const summary = {
    projectId,
    mode: options.execute ? "EXECUTE" : "DRY-RUN",
    boloes: 0,
    users: 0,
    predictions: 0,
    warnings: [],
    errors: [],
  };
  const migrationPlans = [];

  for (const legacySnapshot of legacyDocuments) {
    const bolaoId = legacySnapshot.id;
    const [gamesSnapshot, bolaoSnapshot] = await Promise.all([
      db.doc(`jogosBolao/${bolaoId}`).get(),
      db.doc(`boloes/${bolaoId}`).get(),
    ]);

    if (!gamesSnapshot.exists) {
      summary.errors.push(`${bolaoId}: documento jogosBolao ausente.`);
      continue;
    }

    if (!bolaoSnapshot.exists) {
      summary.errors.push(`${bolaoId}: documento boloes ausente.`);
      continue;
    }

    const plan = buildPlan(
      legacySnapshot.data(),
      gamesSnapshot.data(),
      bolaoSnapshot.data(),
    );

    summary.boloes += 1;
    summary.users += plan.users.length;
    summary.predictions += plan.predictionCount;
    summary.warnings.push(...plan.warnings.map((message) => `${bolaoId}: ${message}`));
    summary.errors.push(...plan.errors.map((message) => `${bolaoId}: ${message}`));
    migrationPlans.push({ bolaoId, plan });

    if (options.verifyTarget) {
      const verificationErrors = await verifyTarget(db, bolaoId, plan);
      summary.errors.push(...verificationErrors.map((message) => `${bolaoId}: ${message}`));
    }
  }

  console.log(JSON.stringify(summary, null, 2));

  if (summary.errors.length > 0) {
    process.exitCode = 1;
    return;
  }

  if (options.execute) {
    for (const { bolaoId, plan } of migrationPlans) {
      const conflicts = await findTargetConflicts(db, bolaoId, plan);
      if (conflicts.length > 0) {
        console.error(JSON.stringify({
          message: "Migracao bloqueada por documentos de destino divergentes.",
          bolaoId,
          conflicts,
        }, null, 2));
        process.exitCode = 1;
        return;
      }
    }

    for (const { bolaoId, plan } of migrationPlans) {
      await writePlan(db, bolaoId, plan);
    }

    const postMigrationErrors = [];
    for (const { bolaoId, plan } of migrationPlans) {
      const verificationErrors = await verifyTarget(db, bolaoId, plan);
      postMigrationErrors.push(
        ...verificationErrors.map((message) => `${bolaoId}: ${message}`),
      );
    }

    if (postMigrationErrors.length > 0) {
      console.error(JSON.stringify({
        message: "A escrita terminou, mas a verificacao encontrou divergencias.",
        errors: postMigrationErrors,
      }, null, 2));
      process.exitCode = 1;
      return;
    }

    console.log("Migracao concluida. A colecao legada nao foi alterada.");
  } else {
    console.log("Dry-run concluido. Nenhum dado foi escrito.");
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  MIGRATION_VERSION,
  buildPlan,
  canonicalize,
  findTargetConflicts,
  normalizePhaseId,
  parseArgs,
  stableJson,
};
