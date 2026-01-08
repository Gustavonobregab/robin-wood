import { Pipeline, Operation } from './pipeline'
import { PipelineResult, TextDetails, calculateMetrics } from './types'
import { encode as toonEncode } from '@toon-format/toon'

// Importamos os dicionários do arquivo separado
import { SHORTEN_MAP_EN, SHORTEN_MAP_PT } from './dictionaries'

export type TextData = string
export type TextResult = PipelineResult<string, TextDetails>

export class TextPipeline extends Pipeline<TextData, TextResult> {
    private originalSize: number

    constructor(data: TextData, ops: Operation[] = []) {
        super('text', data, ops, (d, o) => this.exec(d, o))
        this.originalSize = data.length
    }

    /**
     * Remove espaços excessivos, quebras de linha e cola pontuações.
     * Ex: "Olá , mundo !" -> "Olá, mundo!"
     */
    trim(): TextPipeline {
        const pipeline = this.add('trim', {}) as TextPipeline
        pipeline.originalSize = this.originalSize
        return pipeline
    }

    /**
     * Substitui palavras por abreviações para economizar tokens.
     * Lang: 'EN' (Inglês) ou 'PT' (Português).
     */
    shorten(lang: 'EN' | 'PT' = 'EN'): TextPipeline {
        const pipeline = this.add('shorten', { lang }) as TextPipeline
        pipeline.originalSize = this.originalSize
        return pipeline
    }

    /**
     * Compressão agressiva: remove todas as quebras de linha e formatação.
     */
    minify(): TextPipeline {
        const pipeline = this.add('minify', {}) as TextPipeline
        pipeline.originalSize = this.originalSize
        return pipeline
    }

    compress(algo: 'gzip' | 'brotli' = 'gzip'): TextPipeline {
        const pipeline = this.add('compress', { algo }) as TextPipeline
        pipeline.originalSize = this.originalSize
        return pipeline
    }

    jsonToToon(): TextPipeline {
        const pipeline = this.add('jsonToToon', {}) as TextPipeline
        pipeline.originalSize = this.originalSize
        return pipeline
    }

    private async exec(data: TextData, ops: Operation[]): Promise<TextResult> {
        let result = data
        const appliedOps: string[] = []

        for (const { name, params } of ops) {
            result = await TextPipeline.run(result, name, params)
            appliedOps.push(name)
        }

        const finalSize = result.length

        return {
            data: result,
            metrics: calculateMetrics(this.originalSize, finalSize),
            details: {
                charCount: finalSize,
                originalCharCount: this.originalSize
            },
            operations: appliedOps
        }
    }

    private static async run(data: TextData, op: string, params: any): Promise<TextData> {
        switch (op) {
            case 'trim':
                return trim(data)
            case 'shorten':
                return shorten(data, params.lang)
            case 'minify':
                return minify(data)
            case 'compress':
                return compress(data, params.algo)
            case 'jsonToToon':
                return jsonToToon(data)
            default:
                throw new Error(`Unknown operation: ${op}`)
        }
    }
}

// ==========================================
// FUNÇÕES DE OPERAÇÃO
// ==========================================

async function trim(data: TextData): Promise<TextData> {
    return data
        // 1. Transforma quebras de linha e tabs em espaço
        .replace(/[\r\n\t]+/g, ' ')
        // 2. Remove múltiplos espaços ("  " -> " ")
        .replace(/\s+/g, ' ')
        // 3. Remove espaço ANTES de pontuação ("Ola , mundo !" -> "Ola, mundo!")
        .replace(/\s+([,.:;!?])/g, '$1')
        // 4. Remove espaços do início e fim
        .trim()
}

async function shorten(data: TextData, lang: 'EN' | 'PT'): Promise<TextData> {
    const map = lang === 'PT' ? SHORTEN_MAP_PT : SHORTEN_MAP_EN;
    let result = data;

    for (const [original, replacement] of Object.entries(map)) {
        // Regex com Word Boundary (\b) para não quebrar palavras
        const regex = new RegExp(`\\b${original}\\b`, 'gi');
        result = result.replace(regex, replacement);
    }
    return result;
}

async function minify(data: TextData): Promise<TextData> {
    // Minify faz o mesmo que trim, mas garante remoção total de quebras de linha
    // (A lógica foi unificada no trim acima para consistência, mas mantemos o minify
    // caso queira adicionar lógica extra de compressão no futuro)
    return trim(data);
}

async function compress(data: TextData, algo: string): Promise<TextData> {
    if (algo === 'gzip' || algo === 'brotli') {
        return trim(data);
    }
    return data
}

function findJsonBlocks(text: string): { start: number; end: number; json: string }[] {
    const blocks: { start: number; end: number; json: string }[] = []
    let i = 0
    while (i < text.length) {
        if (text[i] === '{' || text[i] === '[') {
            const startChar = text[i]
            const endChar = startChar === '{' ? '}' : ']'
            let depth = 1
            let j = i + 1
            let inString = false
            let escape = false
            while (j < text.length && depth > 0) {
                const char = text[j]
                if (escape) escape = false
                else if (char === '\\') escape = true
                else if (char === '"') inString = !inString
                else if (!inString) {
                    if (char === startChar) depth++
                    else if (char === endChar) depth--
                }
                j++
            }
            if (depth === 0) {
                const jsonCandidate = text.slice(i, j)
                try {
                    JSON.parse(jsonCandidate)
                    blocks.push({ start: i, end: j, json: jsonCandidate })
                    i = j
                    continue
                } catch { }
            }
        }
        i++
    }
    return blocks
}

async function jsonToToon(data: TextData): Promise<TextData> {
    const jsonBlocks = findJsonBlocks(data)
    if (jsonBlocks.length === 0) return data
    let result = data
    for (let i = jsonBlocks.length - 1; i >= 0; i--) {
        const block = jsonBlocks[i]
        try {
            const parsed = JSON.parse(block.json)
            const toon = toonEncode(parsed)
            result = result.slice(0, block.start) + toon + result.slice(block.end)
        } catch { }
    }
    return result
}