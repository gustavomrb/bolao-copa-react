const assert = require("node:assert/strict");
const test = require("node:test");
const { Timestamp } = require("firebase-admin/firestore");
const {
  buildPlan,
  normalizePhaseId,
  stableJson,
} = require("./migrate-resultados.cjs");

test("normaliza IDs de fase numericos e textuais", () => {
  assert.equal(normalizePhaseId(1), "1");
  assert.equal(normalizePhaseId("oitavas"), "oitavas");
  assert.equal(normalizePhaseId(""), null);
});

test("divide os palpites por fase e preserva os demais campos", () => {
  const firstDate = Timestamp.fromDate(new Date("2026-06-11T19:00:00Z"));
  const secondDate = Timestamp.fromDate(new Date("2026-06-15T19:00:00Z"));
  const thirdDate = Timestamp.fromDate(new Date("2026-06-20T19:00:00Z"));

  const plan = buildPlan(
    {
      usuarios: {
        userA: {
          campeao: "Brasil",
          artilheiro: "Jogador A",
          pago: true,
          jogos: {
            jogo1: { gols1: 2, gols2: 0, pontos: 5 },
            jogo2: { gols1: 1, gols2: 1, pontos: 3 },
            jogo3: { gols1: 0, gols2: 1, pontos: "" },
          },
        },
      },
    },
    {
      jogos: {
        jogo1: { fase: 1, data: secondDate },
        jogo2: { fase: 1, data: firstDate },
        jogo3: { fase: "oitavas", data: thirdDate },
      },
    },
    {
      fases: [
        { id: 1, nome: "Grupos" },
        { id: "oitavas", nome: "Oitavas" },
      ],
    },
  );

  assert.deepEqual(plan.errors, []);
  assert.equal(plan.users.length, 1);
  assert.equal(plan.predictionCount, 3);
  assert.deepEqual(plan.users[0].general, {
    campeao: "Brasil",
    artilheiro: "Jogador A",
  });
  assert.deepEqual(plan.users[0].participant, {
    pago: true,
    envios: {
      fases: {
        "1": true,
        oitavas: true,
      },
      palpitesGerais: true,
    },
  });
  assert.equal(plan.users[0].phases.length, 2);
  assert.deepEqual(plan.users[0].phases[0].games.jogo1, {
    gols1: 2,
    gols2: 0,
  });
  assert.deepEqual(plan.users[0].phases[0].scores.jogo1, {
    pontos: 5,
  });
  assert.equal(
    plan.phases.find((phase) => phase.phaseId === "1").firstGameMillis,
    firstDate.toMillis(),
  );
  assert.equal(plan.generalDeadline.firstGameMillis, firstDate.toMillis());
});

test("bloqueia palpite que referencia jogo inexistente", () => {
  const plan = buildPlan(
    {
      usuarios: {
        userA: {
          jogos: {
            jogoInexistente: { gols1: 1, gols2: 0 },
          },
        },
      },
    },
    { jogos: {} },
    { fases: [] },
  );

  assert.equal(plan.errors.length, 1);
  assert.match(plan.errors[0], /jogo inexistente/);
});

test("comparacao deterministica considera objetos aninhados", () => {
  const left = { jogos: { jogo2: { gols2: 1 }, jogo1: { gols1: 2 } } };
  const right = { jogos: { jogo1: { gols1: 2 }, jogo2: { gols2: 1 } } };
  const different = { jogos: { jogo1: { gols1: 9 }, jogo2: { gols2: 1 } } };

  assert.equal(stableJson(left), stableJson(right));
  assert.notEqual(stableJson(left), stableJson(different));
});
