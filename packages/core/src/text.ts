import {
  TextContent,
  Policy,
  Stage,
  StageResult,
  TrimWhitespaceAction,
  RemoveStopWordsAction
} from './types';

const STOP_WORDS = {
  en: new Set(['a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'of', 'with']),
  pt: new Set(['o', 'a', 'os', 'as', 'um', 'uma', 'e', 'ou', 'mas', 'é', 'são', 'foi', 'foram', 'em', 'no', 'na', 'de', 'da', 'do', 'com', 'para', 'por'])
};

export const trimWhitespaceStage: Stage<TextContent> = {
  name: 'text:trim-whitespace',
  modality: 'text',
  actionKey: 'trimWhitespace',
  order: 10,
  contentType: 'text',

  enabled(policy: Policy): boolean {
    return (
      policy.text.enabled === true &&
      policy.text.actions.trimWhitespace?.enabled === true
    );
  },

  async process(
    content: TextContent,
    actionConfig: unknown
  ): Promise<StageResult<TextContent>> {
    const start = Date.now();
    const config = actionConfig as TrimWhitespaceAction;
    const originalText = content.text;
    const unitsBefore = originalText.length;

    let processedText = originalText;

    if (config.aggressive) {

      processedText = processedText.replace(/\s+/g, ' ').trim();
    } else {

      processedText = processedText.replace(/[ \t]+/g, ' ').trim();

      processedText = processedText.replace(/\n{3,}/g, '\n\n');
    }

    return {
      content: {
        ...content,
        text: processedText,
      },
      unitsBefore,
      unitsAfter: processedText.length,
      durationMs: Date.now() - start,
    };
  },
};

export const removeStopWordsStage: Stage<TextContent> = {
  name: 'text:remove-stop-words',
  modality: 'text',
  actionKey: 'removeStopWords',
  order: 20,
  contentType: 'text',

  enabled(policy: Policy): boolean {
    return (
      policy.text.enabled === true &&
      policy.text.actions.removeStopWords?.enabled === true
    );
  },

  async process(
    content: TextContent,
    actionConfig: unknown
  ): Promise<StageResult<TextContent>> {
    const start = Date.now();
    const config = actionConfig as RemoveStopWordsAction;
    const originalText = content.text;
    const unitsBefore = originalText.length;

    const lang = config.language || 'en';
    const stopList = STOP_WORDS[lang] || STOP_WORDS['en'];

    const words = originalText.split(/\b/);
    
    const filteredWords = words.filter(word => {
      if (!/\w/.test(word)) return true;
      return !stopList.has(word.toLowerCase());
    });

    let processedText = filteredWords.join('').replace(/\s+/g, ' ');

    return {
      content: {
        ...content,
        text: processedText,
      },
      unitsBefore,
      unitsAfter: processedText.length,
      durationMs: Date.now() - start,
    };
  },
};

export const TEXT_STAGES: Stage<TextContent>[] = [
  trimWhitespaceStage,
  removeStopWordsStage
];