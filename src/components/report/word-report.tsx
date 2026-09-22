"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FrequencyBarChart } from "@/components/report/frequency-bar-chart"
import { LengthChart } from "@/components/report/length-chart"
import { RoleShareChart } from "@/components/report/role-share-chart"
import { WordTable } from "@/components/report/word-table"
import { ZipfChart } from "@/components/report/zipf-chart"
import type { WordFrequencyReport } from "@/data/types"
import { formatCount, formatExact, formatPercent, titleRole } from "@/lib/format"
import { FILE_EXTENSIONS, LANGUAGE_TOKENS } from "@/lib/language-tokens"

const ROLE_ORDER = ["system", "user", "assistant", "tool"] as const

export function WordReport({ data }: { data: WordFrequencyReport }) {
  const languageRows = data.topContent.filter((row) => LANGUAGE_TOKENS.has(row.word))
  const lexicalRows = data.topContent.filter((row) => !LANGUAGE_TOKENS.has(row.word))
  const extensionRows = data.topExtensions.filter((row) => FILE_EXTENSIONS.has(row.word))
  const languageTotal = languageRows.reduce((sum, row) => sum + row.count, 0)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Word frequency</Badge>
          <Badge variant="outline">{formatExact(data.traces)} unique traces</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl font-medium tracking-tight sm:text-4xl">
            Fable-5 Premium word breakdown
          </h1>
          <p className="max-w-3xl text-muted-foreground">
            Counted from{" "}
            <a
              className="underline underline-offset-4 hover:text-foreground"
              href="https://huggingface.co/datasets/saidutta69/fable-5-premium"
              target="_blank"
              rel="noreferrer"
            >
              saidutta69/fable-5-premium
            </a>
            . The Hugging Face card lists 12,730 rows because OpenAI Chat and Agent
            Traces are the same 6,365 conversations twice. This report uses the unique
            OpenAI Chat split only.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Stat label="Traces" value={formatExact(data.traces)} hint="unique conversations" />
        <Stat label="Words" value={formatCount(data.totals.words)} hint={formatExact(data.totals.words)} />
        <Stat label="Vocabulary" value={formatExact(data.totals.vocab)} hint="unique word types" />
        <Stat
          label="Hapax"
          value={formatPercent(data.totals.hapax / data.totals.vocab)}
          hint={`${formatExact(data.totals.hapax)} words seen once`}
        />
        <Stat
          label="Stopwords"
          value={formatPercent(data.totals.stopwordShare)}
          hint="of all alphabetic tokens"
        />
        <Stat
          label="File extensions"
          value={formatCount(data.totals.fileExtensions)}
          hint={`${formatExact(data.totals.extensionTypes)} distinct suffixes`}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Where the words live</CardTitle>
            <CardDescription>
              Tool outputs are more than half the corpus. Assistant traces are most of
              the rest. User prompts and system instructions are a small slice.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RoleShareChart data={data.roleShare} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Word length</CardTitle>
            <CardDescription>
              Four-letter tokens are the mode. One-letter tokens were dropped; they
              were mostly leftover letters from literal <code>\\n</code> / <code>\\t</code>{" "}
              escape sequences in source.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LengthChart data={data.wordLengthHistogram} />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>How the corpus was tokenized</CardTitle>
          <CardDescription>{data.method}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
          <p>
            Train {formatExact(data.splits.train.traces)} traces /{" "}
            {formatCount(data.splits.train.words)} words.
          </p>
          <p>
            Validation {formatExact(data.splits.validation.traces)} /{" "}
            {formatCount(data.splits.validation.words)}.
          </p>
          <p>
            Test {formatExact(data.splits.test.traces)} /{" "}
            {formatCount(data.splits.test.words)}.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="content" className="gap-4">
        <TabsList variant="line" className="w-full max-w-full flex-wrap justify-start">
          <TabsTrigger value="content">Content words</TabsTrigger>
          <TabsTrigger value="all">All words</TabsTrigger>
          <TabsTrigger value="languages">Languages</TabsTrigger>
          <TabsTrigger value="roles">By role</TabsTrigger>
          <TabsTrigger value="ngrams">Phrases</TabsTrigger>
          <TabsTrigger value="zipf">Zipf</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="flex flex-col gap-4">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle>Top content words</CardTitle>
                <CardDescription>
                  Stopwords removed. Language path tokens like py / go / ts still
                  dominate because traces walk <code>tasks/seeds/&lt;lang&gt;</code> trees.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FrequencyBarChart
                  data={data.topContent.slice(0, 25).map((row) => ({
                    label: row.word,
                    count: row.count,
                  }))}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>After dropping language tags</CardTitle>
                <CardDescription>
                  Same list without py, go, ts, java, bash, and other language tokens.
                  What remains is the actual task vocabulary: test, seeds, files, assert.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FrequencyBarChart
                  data={lexicalRows.slice(0, 25).map((row) => ({
                    label: row.word,
                    count: row.count,
                  }))}
                />
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Content-word table</CardTitle>
              <CardDescription>
                Share is of {formatExact(data.totals.contentWords)} non-stopword tokens.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WordTable rows={data.topContent} total={data.totals.contentWords} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Top words including stopwords</CardTitle>
              <CardDescription>
                <code>the</code> is the most common English word. Language path
                segments still outrank most function words after that.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FrequencyBarChart
                data={data.topWords.slice(0, 30).map((row) => ({
                  label: row.word,
                  count: row.count,
                }))}
                heightClass="h-[34rem]"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Full top-150</CardTitle>
            </CardHeader>
            <CardContent>
              <WordTable rows={data.topWords} total={data.totals.words} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="languages" className="flex flex-col gap-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Language / runtime tokens</CardTitle>
                <CardDescription>
                  {formatCount(languageTotal)} mentions among the top content words.
                  These are mostly directory names and language labels, not file
                  extensions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FrequencyBarChart
                  data={languageRows.slice(0, 20).map((row) => ({
                    label: row.word,
                    count: row.count,
                  }))}
                  heightClass="h-[22rem]"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>True file extensions</CardTitle>
                <CardDescription>
                  Dotted suffixes such as <code>.json</code> and <code>.py</code>,
                  counted separately from words. Method names like{" "}
                  <code>.equal</code> were filtered out.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FrequencyBarChart
                  data={extensionRows.slice(0, 20).map((row) => ({
                    label: `.${row.word}`,
                    count: row.count,
                  }))}
                  heightClass="h-[22rem]"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="roles" className="flex flex-col gap-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {ROLE_ORDER.map((role) => {
              const rows = data.topContentByRole[role] ?? []
              const total = data.roleWords[role] ?? 0
              return (
                <Card key={role}>
                  <CardHeader>
                    <CardTitle>{titleRole(role)}</CardTitle>
                    <CardDescription>
                      {formatCount(total)} words · distinctive terms below the chart
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <FrequencyBarChart
                      data={rows.slice(0, 12).map((row) => ({
                        label: row.word,
                        count: row.count,
                      }))}
                      heightClass="h-72"
                    />
                    <Separator />
                    <div className="flex flex-wrap gap-2">
                      {(data.distinctiveByRole[role] ?? []).slice(0, 12).map((item) => (
                        <Badge key={item.word} variant="outline" className="font-mono">
                          {item.word}
                          <span className="ml-1 text-muted-foreground">
                            {item.lift.toFixed(1)}×
                          </span>
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="ngrams" className="flex flex-col gap-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top bigrams</CardTitle>
                <CardDescription>
                  Adjacent content-word pairs. <code>tasks seeds</code> is the
                  dataset&apos;s spine — paths into the seed catalog.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FrequencyBarChart
                  data={data.topBigrams.slice(0, 20).map((row) => ({
                    label: row.phrase,
                    count: row.count,
                  }))}
                  heightClass="h-[26rem]"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top trigrams</CardTitle>
                <CardDescription>
                  Three-word paths such as <code>file path tasks</code> and{" "}
                  <code>check eq int</code>.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FrequencyBarChart
                  data={data.topTrigrams.slice(0, 16).map((row) => ({
                    label: row.phrase,
                    count: row.count,
                  }))}
                  heightClass="h-[26rem]"
                />
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Phrase table</CardTitle>
            </CardHeader>
            <CardContent>
              <WordTable
                label="Phrase"
                total={data.totals.contentWords}
                rows={data.topBigrams.map((row) => ({
                  word: row.phrase,
                  count: row.count,
                }))}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zipf" className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Zipf curve (log frequency vs rank)</CardTitle>
              <CardDescription>
                Top 200 words. A straight-ish decline on a log axis is the usual
                signature of natural language, even in this code-heavy mix.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ZipfChart data={data.zipf} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>How concentrated is the mass?</CardTitle>
              <CardDescription>
                The 1,000 most common words cover {formatPercent(shareAt(data.coverage, 1000))} of
                tokens. The top 5,000 cover {formatPercent(shareAt(data.coverage, 5000))}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WordTable
                label="Head size"
                total={data.totals.words}
                rows={data.coverage.map((row) => ({
                  word: `top ${row.k}`,
                  count: row.tokens,
                }))}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">{hint}</CardContent>
    </Card>
  )
}

function shareAt(
  coverage: WordFrequencyReport["coverage"],
  k: number
): number {
  return coverage.find((row) => row.k === k)?.share ?? 0
}
