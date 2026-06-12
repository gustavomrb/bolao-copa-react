import { collection, doc, onSnapshot } from "firebase/firestore";
import { database } from "./firebase";

const timestampMillis = (value) => {
  if (!value) return null;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();
  return null;
};

const snapshotToMap = (snapshot) =>
  new Map(snapshot.docs.map((item) => [item.id, item.data()]));

export const subscribeResultadosBolao = ({
  bolaoId,
  bolao,
  userId,
  scope = "current-user",
  onData,
  onReady,
  onError,
}) => {
  const listeners = new Map();
  const pending = new Set();
  const phaseMetadata = new Map();
  const predictionsByPhase = new Map();
  const scoresByPhase = new Map();
  let participants = new Map();
  let generalPredictions = new Map();
  let readyDelivered = false;
  let refreshTimer = null;
  let disposed = false;
  const loadStartedPhases = scope === "started-phases";
  const loadParticipantsOnly = scope === "participants-only";
  const loadStartedScores = scope === "started-scores";
  const loadScoring = scope === "scoring";
  const loadMultipleUsers = loadStartedPhases
    || loadParticipantsOnly
    || loadStartedScores
    || loadScoring;
  const loadParticipants = loadStartedPhases
    || loadParticipantsOnly
    || scope === "current-user";
  const loadGeneralPredictions = loadStartedPhases
    || scope === "current-user";
  const loadPhasePredictions = loadStartedPhases
    || loadScoring
    || scope === "current-user";
  const loadPhaseScores = loadStartedPhases
    || loadStartedScores
    || loadScoring
    || scope === "current-user";

  const emit = () => {
    if (disposed || !readyDelivered) return;

    const userIds = new Set([userId]);
    if (loadMultipleUsers) {
      for (const id of participants.keys()) userIds.add(id);
      for (const id of generalPredictions.keys()) userIds.add(id);
      for (const phaseScores of scoresByPhase.values()) {
        for (const id of phaseScores.keys()) userIds.add(id);
      }
      for (const phasePredictions of predictionsByPhase.values()) {
        for (const id of phasePredictions.keys()) userIds.add(id);
      }
    }

    onData(
      [...userIds]
        .sort()
        .map((id) => {
          const games = {};

          for (const phasePredictions of predictionsByPhase.values()) {
            const prediction = phasePredictions.get(id);
            for (const [gameId, gamePrediction] of Object.entries((prediction && prediction.jogos) || {})) {
              games[gameId] = {
                ...(games[gameId] || {}),
                gols1: gamePrediction?.gols1 ?? "",
                gols2: gamePrediction?.gols2 ?? "",
              };
            }
          }

          for (const phaseScores of scoresByPhase.values()) {
            const score = phaseScores.get(id);
            for (const [gameId, gameScore] of Object.entries((score && score.jogos) || {})) {
              if (gameScore && Object.prototype.hasOwnProperty.call(gameScore, "pontos")) {
                games[gameId] = {
                  ...(games[gameId] || {}),
                  pontos: gameScore.pontos,
                };
              }
            }
          }

          const participant = participants.get(id) || {};
          const general = generalPredictions.get(id) || {};

          return {
            id,
            data: {
              jogos: games,
              campeao: general.campeao || "",
              artilheiro: general.artilheiro || "",
              pago: participant.pago === true,
              envios: participant.envios || { fases: {}, palpitesGerais: false },
            },
          };
        }),
    );
  };

  const checkReady = () => {
    if (!readyDelivered && pending.size === 0) {
      readyDelivered = true;
      emit();
      onReady();
    }
  };

  const stopListener = (key) => {
    const unsubscribe = listeners.get(key);
    if (unsubscribe) unsubscribe();
    listeners.delete(key);
    pending.delete(key);
  };

  const startListener = (key, reference, applySnapshot, trackReady = true) => {
    stopListener(key);
    if (trackReady && !readyDelivered) pending.add(key);
    let firstSnapshot = true;

    const unsubscribe = onSnapshot(
      reference,
      (snapshot) => {
        applySnapshot(snapshot);
        emit();

        if (firstSnapshot) {
          firstSnapshot = false;
          pending.delete(key);
          checkReady();
        }
      },
      (error) => {
        pending.delete(key);
        onError(error);
        checkReady();
      },
    );

    listeners.set(key, unsubscribe);
  };

  const canReadAll = (revealAt) =>
    loadMultipleUsers && revealAt !== null && Date.now() >= revealAt + 5000;

  const setSingleDocumentMap = (snapshot) =>
    snapshot.exists() ? new Map([[userId, snapshot.data()]]) : new Map();

  const configurePhasePredictionListener = (phaseId, trackReady = true) => {
    const phase = phaseMetadata.get(phaseId);
    if (!phase) return;

    const revealAt = timestampMillis(phase.revelaEm);
    const basePath = ["boloes", bolaoId, "fases", phaseId, "palpites"];
    const key = `predictions:${phaseId}`;

    if (canReadAll(revealAt)) {
      startListener(
        key,
        collection(database, ...basePath),
        (snapshot) => predictionsByPhase.set(phaseId, snapshotToMap(snapshot)),
        trackReady,
      );
    } else if (!loadMultipleUsers) {
      startListener(
        key,
        doc(database, ...basePath, userId),
        (snapshot) => {
          predictionsByPhase.set(phaseId, setSingleDocumentMap(snapshot));
        },
        trackReady,
      );
    } else {
      stopListener(key);
      predictionsByPhase.delete(phaseId);
      emit();
      checkReady();
    }
  };

  const configurePhaseScoreListener = (phaseId, trackReady = true) => {
    const phase = phaseMetadata.get(phaseId);
    if (!phase) return;

    const revealAt = timestampMillis(phase.revelaEm);
    const basePath = ["boloes", bolaoId, "fases", phaseId, "pontuacoes"];
    const key = `scores:${phaseId}`;

    if (canReadAll(revealAt)) {
      startListener(
        key,
        collection(database, ...basePath),
        (snapshot) => scoresByPhase.set(phaseId, snapshotToMap(snapshot)),
        trackReady,
      );
    } else if (!loadMultipleUsers) {
      startListener(
        key,
        doc(database, ...basePath, userId),
        (snapshot) => scoresByPhase.set(phaseId, setSingleDocumentMap(snapshot)),
        trackReady,
      );
    } else {
      stopListener(key);
      scoresByPhase.delete(phaseId);
      emit();
      checkReady();
    }
  };

  const configureGeneralPredictionListener = (trackReady = true) => {
    const revealAt = timestampMillis(bolao.palpitesGeraisRevelaEm);
    const basePath = ["boloes", bolaoId, "palpitesGerais"];

    if (canReadAll(revealAt)) {
      startListener(
        "general",
        collection(database, ...basePath),
        (snapshot) => {
          generalPredictions = snapshotToMap(snapshot);
        },
        trackReady,
      );
    } else if (!loadMultipleUsers) {
      startListener(
        "general",
        doc(database, ...basePath, userId),
        (snapshot) => {
          generalPredictions = setSingleDocumentMap(snapshot);
        },
        trackReady,
      );
    } else {
      stopListener("general");
      generalPredictions = new Map();
      emit();
      checkReady();
    }
  };

  const scheduleVisibilityRefresh = () => {
    if (refreshTimer) clearTimeout(refreshTimer);

    const futureDates = [
      loadGeneralPredictions ? timestampMillis(bolao.palpitesGeraisRevelaEm) : null,
      ...[...phaseMetadata.values()].map((phase) => timestampMillis(phase.revelaEm)),
    ]
      .map((date) => date === null ? null : date + 5000)
      .filter((date) => date !== null && date > Date.now());

    if (futureDates.length === 0) return;

    const delay = Math.min(Math.min(...futureDates) - Date.now() + 1000, 2147483647);
    refreshTimer = setTimeout(() => {
      if (loadGeneralPredictions) configureGeneralPredictionListener(false);
      for (const phaseId of phaseMetadata.keys()) {
        if (loadPhasePredictions) configurePhasePredictionListener(phaseId, false);
        if (loadPhaseScores) configurePhaseScoreListener(phaseId, false);
      }
      scheduleVisibilityRefresh();
    }, delay);
  };

  if (loadParticipants) {
    if (loadMultipleUsers) {
      startListener(
        "participants",
        collection(database, "boloes", bolaoId, "participantes"),
        (snapshot) => {
          participants = snapshotToMap(snapshot);
        },
      );
    } else {
      startListener(
        "participants",
        doc(database, "boloes", bolaoId, "participantes", userId),
        (snapshot) => {
          participants = setSingleDocumentMap(snapshot);
        },
      );
    }
  }

  if (loadParticipantsOnly) {
    return () => {
      disposed = true;
      for (const unsubscribe of listeners.values()) unsubscribe();
      listeners.clear();
    };
  }

  if (loadGeneralPredictions) configureGeneralPredictionListener();

  startListener(
    "phases",
    collection(database, "boloes", bolaoId, "fases"),
    (snapshot) => {
      const activePhaseIds = new Set(snapshot.docs.map((item) => item.id));

      for (const existingPhaseId of phaseMetadata.keys()) {
        if (!activePhaseIds.has(existingPhaseId)) {
          phaseMetadata.delete(existingPhaseId);
          predictionsByPhase.delete(existingPhaseId);
          scoresByPhase.delete(existingPhaseId);
          stopListener(`predictions:${existingPhaseId}`);
          stopListener(`scores:${existingPhaseId}`);
        }
      }

      for (const phaseDocument of snapshot.docs) {
        const phaseId = phaseDocument.id;
        const previousPhase = phaseMetadata.get(phaseId);
        const nextPhase = phaseDocument.data();
        const isNewPhase = !previousPhase;
        const visibilityChanged = previousPhase
          && timestampMillis(previousPhase.revelaEm) !== timestampMillis(nextPhase.revelaEm);
        phaseMetadata.set(phaseId, nextPhase);

        if (isNewPhase) {
          if (loadPhaseScores) configurePhaseScoreListener(phaseId);
          if (loadPhasePredictions) configurePhasePredictionListener(phaseId);
        } else if (visibilityChanged) {
          if (loadPhaseScores) configurePhaseScoreListener(phaseId, false);
          if (loadPhasePredictions) configurePhasePredictionListener(phaseId, false);
        }
      }

      scheduleVisibilityRefresh();
    },
  );

  return () => {
    disposed = true;
    if (refreshTimer) clearTimeout(refreshTimer);
    for (const unsubscribe of listeners.values()) unsubscribe();
    listeners.clear();
  };
};
