export type WordCount = {
  word: string
  count: number
}

export type PhraseCount = {
  phrase: string
  count: number
}

export type DistinctiveWord = {
  word: string
  count: number
  lift: number
}

export type ZipfPoint = {
  rank: number
  word: string
  count: number
}

export type CoveragePoint = {
  k: number
  tokens: number
  share: number
}

export type LengthBucket = {
  length: string
  count: number
}

export type RoleShare = {
  role: string
  words: number
  share: number
}

export type WordFrequencyReport = {
  dataset: string
  config: string
  method: string
  traces: number
  parseErrors: number
  splits: Record<string, { traces: number; words: number }>
  totals: {
    words: number
    vocab: number
    hapax: number
    contentWords: number
    contentVocab: number
    stopwordShare: number
    fileExtensions: number
    extensionTypes: number
  }
  roleWords: Record<string, number>
  topWords: WordCount[]
  topContent: WordCount[]
  topExtensions: WordCount[]
  topWordsByRole: Record<string, WordCount[]>
  topContentByRole: Record<string, WordCount[]>
  distinctiveByRole: Record<string, DistinctiveWord[]>
  topBigrams: PhraseCount[]
  topTrigrams: PhraseCount[]
  zipf: ZipfPoint[]
  zipfContent: ZipfPoint[]
  coverage: CoveragePoint[]
  contentCoverage: CoveragePoint[]
  wordLengthHistogram: LengthBucket[]
  roleShare: RoleShare[]
}
