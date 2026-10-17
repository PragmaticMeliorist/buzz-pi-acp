export type PiAssistantUsage = {
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
  totalTokens: number
}

export type AcpPromptUsage = {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cachedReadTokens: number
  cachedWriteTokens: number
}

function uint(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) return undefined
  return value
}

function add(left: number, right: number): number | undefined {
  const sum = left + right
  return Number.isSafeInteger(sum) ? sum : undefined
}

export function assistantUsageFromTurnEnd(event: Record<string, unknown>): PiAssistantUsage | undefined {
  const message = event.message
  if (!message || typeof message !== 'object') return undefined
  const record = message as Record<string, unknown>
  if (record.role !== 'assistant') return undefined
  const usage = record.usage
  if (!usage || typeof usage !== 'object') return undefined
  const counts = usage as Record<string, unknown>
  const input = uint(counts.input)
  const output = uint(counts.output)
  const cacheRead = uint(counts.cacheRead)
  const cacheWrite = uint(counts.cacheWrite)
  const totalTokens = uint(counts.totalTokens)
  if (
    input === undefined ||
    output === undefined ||
    cacheRead === undefined ||
    cacheWrite === undefined ||
    totalTokens === undefined
  ) {
    return undefined
  }
  return { input, output, cacheRead, cacheWrite, totalTokens }
}

export function acpUsageFromAssistantUsages(usages: readonly PiAssistantUsage[]): AcpPromptUsage | undefined {
  if (usages.length === 0) return undefined
  let input = 0
  let output = 0
  let cacheRead = 0
  let cacheWrite = 0
  let totalTokens = 0
  for (const usage of usages) {
    const nextInput = add(input, usage.input)
    const nextOutput = add(output, usage.output)
    const nextCacheRead = add(cacheRead, usage.cacheRead)
    const nextCacheWrite = add(cacheWrite, usage.cacheWrite)
    const nextTotal = add(totalTokens, usage.totalTokens)
    if (
      nextInput === undefined ||
      nextOutput === undefined ||
      nextCacheRead === undefined ||
      nextCacheWrite === undefined ||
      nextTotal === undefined
    ) {
      return undefined
    }
    input = nextInput
    output = nextOutput
    cacheRead = nextCacheRead
    cacheWrite = nextCacheWrite
    totalTokens = nextTotal
  }
  return {
    inputTokens: input,
    outputTokens: output,
    totalTokens,
    cachedReadTokens: cacheRead,
    cachedWriteTokens: cacheWrite
  }
}
