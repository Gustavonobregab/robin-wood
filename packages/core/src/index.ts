import { ContentPart, Policy, Stage, StealResult, AuditEvent, StageMetrics, Report, Modality, AudioContent, TextContent, ImageContent, AccelerateAction, TrimSilenceAction, AudioActions, AudioPolicy, TextPolicy, ImagePolicy, Usage, Savings, EMPTY_USAGE, EMPTY_SAVINGS } from './types';
import { AUDIO_STAGES } from './audio';
import { TEXT_STAGES } from './text';
export type { AudioContent, TextContent, ImageContent, ContentPart, Modality, AccelerateAction, TrimSilenceAction, AudioActions, AudioPolicy, TextPolicy, ImagePolicy, Policy, Usage, Savings, StageMetrics, Report, AuditEvent, StealResult };
export { EMPTY_USAGE, EMPTY_SAVINGS };

const STAGES: Stage<any>[] = [...AUDIO_STAGES, ...TEXT_STAGES];

export async function steal(
  contents: ContentPart[],
  policy: Policy
): Promise<StealResult> {
  const startTime = Date.now();
  const audit: AuditEvent[] = [];
  const stageMetrics: StageMetrics[] = [];

  const stages = getEnabledStages(policy);
  let currentContents = [...contents];

  //3 Process contents through stages
  for (const stage of stages) {
    let totalUnitsBefore = 0;
    let totalUnitsAfter = 0;
    let totalDurationMs = 0;
    let processedCount = 0;

    const newContents: ContentPart[] = [];

    for (let i = 0; i < currentContents.length; i++) {
      const content = currentContents[i];

      if (content.type !== stage.contentType) {
        newContents.push(content);
        continue;
      }

      processedCount++;
      
      const actionConfig = getActionConfig(policy, stage);

      try {
        //4 Process content through stage
        const result = await stage.process(content, actionConfig);

        totalUnitsBefore += result.unitsBefore;
        totalUnitsAfter += result.unitsAfter;
        totalDurationMs += result.durationMs;

        //5 Add processed content to new contents
        newContents.push(result.content);

        audit.push({
          stage: stage.name,
          action: 'PROCESS',
          reason: 'Processed successfully',
          contentIndex: i,
        });

      } catch (error) {
        newContents.push(content);

        audit.push({
          stage: stage.name,
          action: 'ERROR',
          reason: error instanceof Error ? error.message : 'Unknown error',
          contentIndex: i,
        });
      }
    }

    currentContents = newContents;

    if (processedCount > 0) {
      stageMetrics.push({
        name: stage.name,
        modality: stage.modality as Modality,
        actionKey: stage.actionKey,
        unitsBefore: totalUnitsBefore,
        unitsAfter: totalUnitsAfter,
        unitsSaved: totalUnitsBefore - totalUnitsAfter,
        durationMs: totalDurationMs,
      });
    }
  }

  const report: Report = {
    usageBefore: EMPTY_USAGE,
    usageAfter: EMPTY_USAGE,
    savings: EMPTY_SAVINGS,
    stages: stageMetrics,
    totalDurationMs: Date.now() - startTime,
  };

  return {
    contents: currentContents,
    audit,
    report,
  };
}

function getEnabledStages(policy: Policy): Stage<any>[] {
  return STAGES.filter((stage) => stage.enabled(policy));
}

function getActionConfig(policy: Policy, stage: Stage<any>): unknown {
  const modalityPolicy = policy[stage.modality as keyof Policy];
  return (modalityPolicy.actions as Record<string, unknown>)[stage.actionKey];
} 
