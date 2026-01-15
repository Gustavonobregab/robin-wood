export interface StealConfig {
  apiKey: string | null
  apiUrl: string | undefined
  validated: boolean
}

let config: StealConfig = {
  apiKey: null,
  apiUrl: process.env.ROBIN_WOOD_API_URL,
  validated: false,
}

export function getConfig(): StealConfig {
  return config
}

export function setConfig(newConfig: Partial<StealConfig>): void {
  config = { ...config, ...newConfig }
}

export function isInitialized(): boolean {
  return config.validated
}

export function resetConfig(): void {
  config = {
    apiKey: null,
    apiUrl: process.env.ROBIN_WOOD_API_URL,
    validated: false,
  }
}
