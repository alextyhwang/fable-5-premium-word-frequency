# Fable-5 Premium word frequency

Interactive report of word frequencies in [`saidutta69/fable-5-premium`](https://huggingface.co/datasets/saidutta69/fable-5-premium).

The Hugging Face card lists 12,730 rows because the dataset ships two formats of the same conversations. This report counts the **6,365 unique OpenAI Chat traces** only.

## What the numbers mean

- **85.8 million** alphabetic words (length ≥ 2)
- **33,881** word types; **18%** appear only once
- Tool outputs are **55%** of the words; assistant messages are **40%**
- The most common content tokens are language path segments (`py`, `go`, `ts`) and coding-task words (`test`, `seeds`, `tasks`, `assert`)

Tokenization: lowercase alphabetic tokens, literal `\\n`/`\\t`/`\\r` stripped, dotted file extensions counted separately.

## Live report

https://fable-5-premium-word-frequency.vercel.app

## Run the report

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

## Recompute frequencies

The checked-in file `src/data/word-frequency.json` is the analysis output. To rebuild it:

```bash
pip install -r requirements.txt
python3 scripts/word_frequency.py \\
  --data-dir /tmp/fable5/openai_chat \\
  --out src/data/word-frequency.json
```

Download the unique split first:

```bash
python3 - <<'PY'
from huggingface_hub import snapshot_download
snapshot_download(
    repo_id="saidutta69/fable-5-premium",
    repo_type="dataset",
    allow_patterns="openai_chat/*.parquet",
    local_dir="/tmp/fable5",
)
PY
```
