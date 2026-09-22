#!/usr/bin/env python3
"""Word-frequency report for saidutta69/fable-5-premium (unique openai_chat traces)."""

from __future__ import annotations

import argparse
import json
import math
import os
import re
from collections import Counter, defaultdict

import pyarrow.parquet as pq

EN_WORD = re.compile(r"[A-Za-z](?:[A-Za-z']*[A-Za-z])?")
FILE_EXT = re.compile(r"\.([A-Za-z][A-Za-z0-9]{1,4})\b")
ESCAPE = re.compile(r"\\[nrt]")

STOPWORDS = set(
    """
    a about above after again against all also am an and any are aren't as at be because been
    before being below between both but by can cannot could couldn't did didn't do does doesn't
    doing don't down during each few for from further had hadn't has hasn't have haven't having
    he he'd he'll he's her here here's hers herself him himself his how how's i i'd i'll i'm
    i've if in into is isn't it it's its itself let's me more most mustn't my myself no nor not
    of off on once only or other ought our ours ourselves out over own same shan't she she'd
    she'll she's should shouldn't so some such than that that's the their theirs them themselves
    then there there's these they they'd they'll they're they've this those through to too under
    until up very was wasn't we we'd we'll we're we've were weren't what what's when when's
    where where's which while who who's whom why why's with won't would wouldn't you you'd
    you'll you're you've your yours yourself yourselves will just like still even back well
    much many than into over
    """.split()
)

ROLES = ("system", "user", "assistant", "tool")


def extract_text_parts(messages) -> dict[str, str]:
    if isinstance(messages, str):
        messages = json.loads(messages)
    by_role: dict[str, list[str]] = defaultdict(list)
    for m in messages:
        role = m.get("role") or "unknown"
        chunks: list[str] = []
        content = m.get("content")
        if isinstance(content, str) and content:
            chunks.append(content)
        elif content is not None and not isinstance(content, str):
            chunks.append(json.dumps(content, ensure_ascii=False))
        for tc in m.get("tool_calls") or []:
            if not isinstance(tc, dict):
                continue
            fn = tc.get("function") or {}
            name = fn.get("name") or tc.get("name") or ""
            args = fn.get("arguments") or tc.get("arguments") or ""
            if name:
                chunks.append(name)
            if args:
                chunks.append(args if isinstance(args, str) else json.dumps(args, ensure_ascii=False))
        if chunks:
            by_role[role].append("\n".join(chunks))
    return {role: "\n".join(parts) for role, parts in by_role.items()}


def tokenize(blob: str) -> tuple[list[str], list[str]]:
    """Return (english-like words, file extensions)."""
    cleaned = ESCAPE.sub(" ", blob)
    exts = [e.lower() for e in FILE_EXT.findall(cleaned)]
    # Strip dotted extensions so `.py` is not counted as the word `py`.
    without_ext = FILE_EXT.sub(" ", cleaned)
    words: list[str] = []
    for raw in EN_WORD.findall(without_ext):
        token = raw.lower()
        if len(token) < 2:
            continue
        words.append(token)
    return words, exts


def top_n(counter: Counter, n: int) -> list[dict]:
    return [{"word": w, "count": int(c)} for w, c in counter.most_common(n)]


def top_ngram(counter: Counter, n: int) -> list[dict]:
    return [{"phrase": " ".join(key), "count": int(c)} for key, c in counter.most_common(n)]


def coverage(counter: Counter, total: int, ks=(10, 25, 50, 100, 250, 500, 1000, 5000)) -> list[dict]:
    running = 0
    items = counter.most_common(max(ks))
    out = []
    kset = set(ks)
    for i, (_, c) in enumerate(items, 1):
        running += c
        if i in kset:
            out.append({"k": i, "tokens": int(running), "share": running / total if total else 0})
    return out


def distinctive(role_ctr: Counter, overall: Counter, total_role: int, total_all: int, n=30, min_count=400):
    scored = []
    for w, c in role_ctr.items():
        if c < min_count or w in STOPWORDS or len(w) < 3:
            continue
        p_role = c / total_role if total_role else 0
        p_all = overall[w] / total_all if total_all else 0
        lift = p_role / p_all if p_all else 0
        scored.append((lift * math.log(c + 1), w, int(c), round(lift, 2)))
    scored.sort(reverse=True)
    return [{"word": w, "count": c, "lift": lift} for _, w, c, lift in scored[:n]]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", default="/tmp/fable5/openai_chat")
    parser.add_argument("--out", default="src/data/word-frequency.json")
    args = parser.parse_args()

    splits = {
        "train": os.path.join(args.data_dir, "train.parquet"),
        "validation": os.path.join(args.data_dir, "validation.parquet"),
        "test": os.path.join(args.data_dir, "test.parquet"),
    }

    en_overall: Counter = Counter()
    ext_overall: Counter = Counter()
    en_by_role: dict[str, Counter] = defaultdict(Counter)
    ext_by_role: dict[str, Counter] = defaultdict(Counter)
    bigrams: Counter = Counter()
    trigrams: Counter = Counter()
    word_len_hist: Counter = Counter()
    role_en_totals: Counter = Counter()
    split_en_totals: Counter = Counter()
    split_rows: Counter = Counter()

    rows = 0
    parse_errors = 0
    total_en = 0
    total_ext = 0

    for split, path in splits.items():
        pf = pq.ParquetFile(path)
        print(f"Scanning {split} ({pf.metadata.num_rows} rows)...", flush=True)
        for batch in pf.iter_batches(batch_size=32):
            for row in batch.to_pylist():
                rows += 1
                split_rows[split] += 1
                try:
                    by_role = extract_text_parts(row.get("messages") or "[]")
                except Exception:
                    parse_errors += 1
                    continue
                for role, blob in by_role.items():
                    words, exts = tokenize(blob)
                    total_en += len(words)
                    total_ext += len(exts)
                    role_en_totals[role] += len(words)
                    split_en_totals[split] += len(words)
                    en_overall.update(words)
                    ext_overall.update(exts)
                    en_by_role[role].update(words)
                    ext_by_role[role].update(exts)
                    for w in words:
                        word_len_hist[min(len(w), 25)] += 1
                    content = [w for w in words if w not in STOPWORDS]
                    if len(content) >= 2:
                        bigrams.update(zip(content, content[1:]))
                    if len(content) >= 3:
                        trigrams.update(zip(content, content[1:], content[2:]))
                if rows % 512 == 0:
                    print(
                        f"  {rows} traces | words={total_en:,} vocab={len(en_overall):,}",
                        flush=True,
                    )

    content_words = Counter(
        {w: c for w, c in en_overall.items() if w not in STOPWORDS}
    )
    hapax = sum(1 for c in en_overall.values() if c == 1)

    length_hist = [
        {"length": str(k) if k < 25 else "25+", "count": int(word_len_hist[k])}
        for k in sorted(word_len_hist)
    ]

    zipf = [
        {"rank": i + 1, "word": w, "count": int(c)}
        for i, (w, c) in enumerate(en_overall.most_common(200))
    ]
    zipf_content = [
        {"rank": i + 1, "word": w, "count": int(c)}
        for i, (w, c) in enumerate(content_words.most_common(200))
    ]

    report = {
        "dataset": "saidutta69/fable-5-premium",
        "config": "openai_chat unique traces (agent_traces is the same conversations in a second format)",
        "method": (
            "Lowercased alphabetic tokens, length >= 2. Literal \\n/\\t/\\r stripped. "
            "File extensions counted separately and removed from the word list. "
            "English stopwords removed for the content-word view."
        ),
        "traces": int(rows),
        "parseErrors": parse_errors,
        "splits": {
            k: {"traces": int(split_rows[k]), "words": int(split_en_totals[k])}
            for k in splits
        },
        "totals": {
            "words": int(total_en),
            "vocab": len(en_overall),
            "hapax": hapax,
            "contentWords": int(sum(content_words.values())),
            "contentVocab": len(content_words),
            "stopwordShare": (total_en - sum(content_words.values())) / total_en if total_en else 0,
            "fileExtensions": int(total_ext),
            "extensionTypes": len(ext_overall),
        },
        "roleWords": {r: int(role_en_totals[r]) for r in role_en_totals},
        "topWords": top_n(en_overall, 150),
        "topContent": top_n(content_words, 150),
        "topExtensions": top_n(ext_overall, 40),
        "topWordsByRole": {r: top_n(ctr, 60) for r, ctr in en_by_role.items() if ctr},
        "topContentByRole": {
            r: top_n(Counter({w: c for w, c in ctr.items() if w not in STOPWORDS}), 60)
            for r, ctr in en_by_role.items()
            if ctr
        },
        "distinctiveByRole": {
            r: distinctive(en_by_role[r], en_overall, role_en_totals[r], total_en)
            for r in en_by_role
            if role_en_totals[r] > 0
        },
        "topBigrams": top_ngram(bigrams, 60),
        "topTrigrams": top_ngram(trigrams, 30),
        "zipf": zipf,
        "zipfContent": zipf_content,
        "coverage": coverage(en_overall, total_en),
        "contentCoverage": coverage(content_words, sum(content_words.values())),
        "wordLengthHistogram": length_hist,
        "roleShare": [
            {
                "role": role,
                "words": int(role_en_totals[role]),
                "share": role_en_totals[role] / total_en if total_en else 0,
            }
            for role in ROLES
            if role_en_totals[role]
        ],
    }

    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
    with open(args.out, "w") as f:
        json.dump(report, f)
    print("Wrote", args.out, os.path.getsize(args.out), "bytes")
    print("words", total_en, "vocab", len(en_overall))
    print("top10 content", content_words.most_common(10))
    print("top10 extensions", ext_overall.most_common(10))
    print("top10 bigrams", bigrams.most_common(10))


if __name__ == "__main__":
    main()
