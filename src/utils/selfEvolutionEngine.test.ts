import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyBenchmarkEvaluationToState,
  applyCustomTrainingRule,
  boostIndividualModel,
  buildEvolutionDashboardSummary,
  calibrateAllEcosystems,
  createInitialEvolutionState,
  deleteEvolutionRule,
  EVOLUTION_BENCHMARK_SUITE,
  getActiveDirectivesForCategory,
  getActiveDirectivesForModel,
  ingestConsentedChatSignal,
  processModelFeedbackSignal,
  recordModelUsageInState,
  redactSensitivePii,
  runDeterministicEvolutionCycle,
  scoreBenchmarkOutput,
  toggleEvolutionRule,
} from './selfEvolutionEngine.ts';
import {
  buildModelPrecisionSignature,
  buildSystemPrompt,
  cleanAssistantResponse,
  evaluateSafeMathExpression,
  LUXO_MODELS,
  resolveAutoRoutedModel,
  verifyAndRepairModelOutput,
} from './luxoLogic.ts';

test('redactSensitivePii masks email, phone, card, and secret API keys', () => {
  const input =
    'Bana test.user@ornek.com adresinden veya +90 532 123 45 67 numarasından ulaşın. Anahtar: sk-1234567890abcdefghijkl';
  const cleaned = redactSensitivePii(input);
  assert.ok(!cleaned.includes('test.user@ornek.com'));
  assert.ok(!cleaned.includes('532 123 45 67'));
  assert.ok(!cleaned.includes('sk-1234567890abcdefghijkl'));
  assert.ok(cleaned.includes('[EPOSTA_KORUNDU]'));
  assert.ok(cleaned.includes('[ANAHTAR_KORUNDU]'));
});

test('ingestConsentedChatSignal strictly blocks chat ingestion unless consent is granted', () => {
  const initial = createInitialEvolutionState(1_700_000_000_000);

  const deniedRes = ingestConsentedChatSignal(initial, {
    userPrompt: 'TypeScript ile hızlı önbellek kodu yaz',
    assistantReply: 'İşte temiz kod örneği.',
    modelId: 'claude-4-5-sonnet',
    signalType: 'liked',
    consentStatus: 'denied',
  });
  assert.equal(deniedRes.updated, false);
  assert.equal(deniedRes.state.consentedSignalsProcessed, 0);

  const unsetRes = ingestConsentedChatSignal(initial, {
    userPrompt: 'TypeScript ile hızlı önbellek kodu yaz',
    assistantReply: 'İşte temiz kod örneği.',
    modelId: 'claude-4-5-sonnet',
    signalType: 'regenerated',
    consentStatus: 'unset',
  });
  assert.equal(unsetRes.updated, false);
  assert.equal(unsetRes.state.consentedSignalsProcessed, 0);

  const grantedRes = ingestConsentedChatSignal(initial, {
    userPrompt: 'TypeScript ile hızlı önbellek kodu yaz',
    assistantReply: 'İşte temiz kod örneği.',
    modelId: 'claude-4-5-sonnet',
    signalType: 'regenerated',
    consentStatus: 'granted',
    now: 1_700_000_050_000,
  });
  assert.equal(grantedRes.updated, true);
  assert.equal(grantedRes.state.consentedSignalsProcessed, 1);
  assert.equal(grantedRes.state.generation, initial.generation + 1);
});

test('runDeterministicEvolutionCycle and calibrateAllEcosystems upgrade rules and accuracy', () => {
  const base = createInitialEvolutionState(1_700_000_000_000);
  const evolved = runDeterministicEvolutionCycle(base, {
    focusCategory: 'Anthropic Claude',
    trigger: 'manual',
    now: 1_700_000_010_000,
  });
  assert.equal(evolved.generation, base.generation + 1);
  assert.ok(evolved.totalBugsPatched > base.totalBugsPatched);

  const directives = getActiveDirectivesForCategory(
    evolved,
    'Anthropic Claude'
  );
  assert.ok(directives.length >= 2);

  const promptText = buildSystemPrompt('claude-4-5-sonnet', {
    learnedDirectives: directives,
    evolutionGeneration: evolved.generation,
  });
  assert.ok(
    promptText.includes(`Öz-Gelişim Nesil v${evolved.generation}`)
  );
  assert.ok(promptText.includes('Model Çekirdek Disiplini'));

  const toggled = toggleEvolutionRule(evolved, evolved.learnedRules[0].id);
  assert.equal(
    toggled.learnedRules[0].enabled,
    !evolved.learnedRules[0].enabled
  );

  const calibrated = calibrateAllEcosystems(toggled, 1_700_000_020_000);
  assert.equal(calibrated.ecosystems.length, 9);
  assert.equal(
    calibrated.ecosystems.reduce((sum, e) => sum + e.modelCount, 0),
    115
  );
  assert.ok((calibrated.modelUsageCounts?.['gemini-4-hydrogen'] || 0) >= 100);
});

test('custom training, individual 115-model boosts, rule deletion, and evolution-aware Auto-Router work end-to-end', () => {
  const base = createInitialEvolutionState(1_700_000_000_000);
  const customTrained = applyCustomTrainingRule(base, {
    goalText: 'SQL sorgularında indeks kullanımını zorunlu tut',
    category: 'Mistral & Qwen',
    targetModelId: 'codestral-25',
    now: 1_700_000_010_000,
  });
  assert.equal(customTrained.generation, base.generation + 1);
  assert.equal(customTrained.learnedRules[0].source, 'custom-training');
  assert.equal(customTrained.learnedRules[0].targetModelId, 'codestral-25');

  const modelDirs = getActiveDirectivesForModel(
    customTrained,
    'codestral-25',
    'Mistral & Qwen'
  );
  assert.ok(modelDirs.some((d) => d.includes('SQL')));

  const boosted = boostIndividualModel(customTrained, {
    modelId: 'claude-4-6-opus',
    modelName: 'Claude 4.6 Opus Ultra',
    category: 'Anthropic Claude',
    now: 1_700_000_020_000,
  });
  assert.ok((boosted.modelBoosts?.['claude-4-6-opus']?.accuracyDelta || 0) > 0);

  // Auto-Router promotes boosted model in Anthropic Claude category for code tasks
  const routeDecision = resolveAutoRoutedModel(
    'TypeScript ile bellek güvenli bir önbellek sınıfı yaz',
    boosted
  );
  assert.equal(routeDecision.targetModelId, 'claude-4-6-opus');

  const afterDelete = deleteEvolutionRule(
    boosted,
    boosted.learnedRules[0].id,
    1_700_000_030_000
  );
  assert.equal(afterDelete.learnedRules.length, boosted.learnedRules.length - 1);
});

test('scoreBenchmarkOutput and applyBenchmarkEvaluationToState evaluate invariants and synthesize gate rules', () => {
  const base = createInitialEvolutionState(1_700_000_000_000);
  const mathSpec = EVOLUTION_BENCHMARK_SUITE[0];
  const passCase = scoreBenchmarkOutput(
    mathSpec,
    'Yeni yanıt süresi 312 ms olur.',
    420
  );
  assert.equal(passCase.passed, true);
  assert.ok(passCase.score >= 95);

  const weakCodeCase = scoreBenchmarkOutput(
    EVOLUTION_BENCHMARK_SUITE[1],
    'Tabii ki, kısa açıklama ama kod bloğu eksik.',
    900
  );
  assert.equal(weakCodeCase.passed, false);

  const updatedState = applyBenchmarkEvaluationToState(
    base,
    [passCase, weakCodeCase],
    1_700_000_040_000
  );
  assert.equal(updatedState.generation, base.generation + 1);
  assert.ok(
    updatedState.learnedRules.some((r) => r.source === 'benchmark-gate')
  );
});

test('cleanAssistantResponse and verifyAndRepairModelOutput repair fences, filler, and missing math proof', () => {
  const brokenCode =
    'Bir yapay zeka modeli olarak, Tabii ki! İşte çözüm:\n```typescript\nexport const sum = (a: number, b: number) => a + b;';
  const repaired = cleanAssistantResponse(brokenCode, true);
  assert.ok(!repaired.toLowerCase().includes('yapay zeka modeli olarak'));
  const fences = repaired.match(/```/g) || [];
  assert.equal(fences.length, 2);
  assert.ok(repaired.includes('export const sum'));

  const verifiedMath = verifyAndRepairModelOutput(
    'Yanıt süresi belirgin ölçüde düşer.',
    {
      exactMathProof: { expression: '480 - %35', result: '312' },
    }
  );
  assert.ok(verifiedMath.includes('312'));
  assert.ok(buildModelPrecisionSignature('deepseek-math-v2').includes('Sembolik mantık'));
});

test('evaluateSafeMathExpression handles sqrt, factorial, powers, pct deltas, GCD/LCM, combinations, and averages', () => {
  assert.deepEqual(evaluateSafeMathExpression('karekök 144 kaçtır?'), {
    expression: '√144',
    result: '12',
  });
  assert.deepEqual(evaluateSafeMathExpression('6 faktöriyel kaç eder?'), {
    expression: '6!',
    result: '720',
  });
  assert.deepEqual(evaluateSafeMathExpression('2 üzeri 10 kaçtır?'), {
    expression: '2^10',
    result: '1024',
  });
  assert.deepEqual(
    evaluateSafeMathExpression(
      '480ms değerinden %35 iyileştirilirse kaç ms olur?'
    ),
    {
      expression: '480 - %35',
      result: '312',
    }
  );
  assert.deepEqual(
    evaluateSafeMathExpression('12 ve 18 sayılarının ekoku kaçtır?'),
    {
      expression: 'EKOK(12, 18)',
      result: '36',
    }
  );
  assert.deepEqual(evaluateSafeMathExpression('C(10, 3) kaç eder?'), {
    expression: 'C(10, 3)',
    result: '120',
  });
  assert.deepEqual(
    evaluateSafeMathExpression('10, 20, 30 ve 40 sayılarının ortalaması kaçtır?'),
    {
      expression: 'Ortalama(10, 20, 30, 40)',
      result: '25',
    }
  );
  assert.deepEqual(
    evaluateSafeMathExpression(
      '12 ve 18 sayılarının ekoku ile C(10, 3) kombinasyonunun toplamı kaçtır?'
    ),
    {
      expression: 'EKOK(12, 18) + C(10, 3)',
      result: '156',
    }
  );
});

test('processModelFeedbackSignal handles thumbs_up and thumbs_down real-time model tuning', () => {
  const base = createInitialEvolutionState(1_700_000_000_000);

  // Thumbs up boosts model and ecosystem
  const afterUp = processModelFeedbackSignal(base, {
    modelId: 'gemini-3-1-pro',
    rating: 'thumbs_up',
    timestamp: 1_700_000_010_000,
  });
  assert.equal(afterUp.generation, base.generation + 1);
  assert.ok((afterUp.modelBoosts?.['gemini-3-1-pro']?.accuracyDelta || 0) > 0);
  assert.equal(afterUp.recentLogs[0].trigger, 'chat-signal');
  assert.ok(afterUp.recentLogs[0].appliedPatch.includes('gemini-3-1-pro'));

  // Thumbs down triggers autonomous repair rule and increments bugs patched
  const afterDown = processModelFeedbackSignal(afterUp, {
    modelId: 'deepseek-r1',
    rating: 'thumbs_down',
    comment: 'Matematik sonucunda birim hatası vardı',
    promptSample: '500 metrelik pistte hız hesabı',
    timestamp: 1_700_000_020_000,
  });
  assert.equal(afterDown.generation, afterUp.generation + 1);
  assert.ok(afterDown.totalBugsPatched > afterUp.totalBugsPatched);
  const repairRule = afterDown.learnedRules.find((r) => r.targetModelId === 'deepseek-r1');
  assert.ok(repairRule);
  assert.equal(repairRule.source, 'chat-feedback');
});

test('recordModelUsageInState and buildEvolutionDashboardSummary aggregate metrics and cycleHistory', () => {
  const base = createInitialEvolutionState(1_700_000_000_000);
  const initialSummary = buildEvolutionDashboardSummary(base, LUXO_MODELS);
  assert.ok(initialSummary.totalCalls > 0);
  assert.ok(initialSummary.cycleSeries.length >= 3);
  assert.ok(initialSummary.topModels.length >= 5);

  const afterUsage = recordModelUsageInState(base, 'gemini-4-argon', 1_700_000_005_000);
  const afterCycle = runDeterministicEvolutionCycle(afterUsage, {
    focusCategory: 'Google Gemini',
    now: 1_700_000_010_000,
  });

  const updatedSummary = buildEvolutionDashboardSummary(afterCycle, LUXO_MODELS);
  assert.equal(updatedSummary.totalCalls, initialSummary.totalCalls + 1);
  assert.equal(updatedSummary.cycleSeries.length, initialSummary.cycleSeries.length + 1);
  assert.equal(updatedSummary.cycleSeries[updatedSummary.cycleSeries.length - 1].generation, afterCycle.generation);
});

