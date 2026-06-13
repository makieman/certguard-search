"""
test_llm.py — Standalone test for each LLM provider in the CertGuard stack.

Usage:
    python test_llm.py              # test all three providers
    python test_llm.py gemini       # test Gemini only
    python test_llm.py github       # test GitHub Models only
    python test_llm.py groq         # test Groq only
"""

import os
import sys
import time
import textwrap
import httpx
from dotenv import load_dotenv

load_dotenv()

# ── credentials ──────────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL   = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

GITHUB_TOKEN   = os.getenv("GITHUB_TOKEN")
GITHUB_MODEL   = os.getenv("GITHUB_MODEL", "openai/gpt-4o-mini")

GROQ_API_KEY   = os.getenv("GROQ_API_KEY")
GROQ_MODEL     = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

TEST_PROMPT = "Reply with exactly one sentence: what is the capital of France?"

# ── colour helpers ────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
RESET  = "\033[0m"
BOLD   = "\033[1m"

def ok(msg):  print(f"  {GREEN}[PASS]{RESET}  {msg}")
def fail(msg): print(f"  {RED}[FAIL]{RESET}  {msg}")
def warn(msg): print(f"  {YELLOW}[SKIP]{RESET}  {msg}")

def preview(text: str, chars: int = 120) -> str:
    """Truncate and clean response for display."""
    text = text.strip().replace("\n", " ")
    return textwrap.shorten(text, width=chars, placeholder="...")

# ── provider tests ────────────────────────────────────────────────────────────

def test_gemini() -> tuple[bool, str]:
    """
    Tests Google Gemini using the stable /v1/ endpoint.
    gemini-2.0-flash is NOT available on /v1beta/.
    """
    provider = "Gemini"
    print(f"\n{BOLD}{CYAN}[1/3] Testing {provider}{RESET}")
    print(f"      Model   : {GEMINI_MODEL}")
    print(f"      Endpoint: /v1/ (stable — required for 2.0-series)")

    if not GEMINI_API_KEY:
        warn("GEMINI_API_KEY not set in .env")
        return False, "no key"

    url = (
        f"https://generativelanguage.googleapis.com/v1/models/"
        f"{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    )
    body = {
        "contents": [{"role": "user", "parts": [{"text": TEST_PROMPT}]}],
        "generationConfig": {"maxOutputTokens": 200, "temperature": 0.1}
    }

    t0 = time.time()
    try:
        r = httpx.post(url, json=body, timeout=30)
        elapsed = time.time() - t0

        if r.status_code == 200:
            text = r.json()["candidates"][0]["content"]["parts"][0]["text"]
            ok(f"{elapsed:.2f}s -> {preview(text)}")
            return True, text
        else:
            fail(f"HTTP {r.status_code} — {r.text[:200]}")
            return False, r.text
    except Exception as e:
        fail(str(e))
        return False, str(e)


def test_github() -> tuple[bool, str]:
    """
    Tests GitHub Models via the Azure AI inference endpoint.
    The endpoint requires the bare model name without any 'openai/' prefix.
    """
    provider = "GitHub Models"
    print(f"\n{BOLD}{CYAN}[2/3] Testing {provider}{RESET}")
    print(f"      Model   : {GITHUB_MODEL}")
    print(f"      Endpoint: models.inference.ai.azure.com")

    if not GITHUB_TOKEN:
        warn("GITHUB_TOKEN not set in .env")
        return False, "no key"

    # Strip namespace prefix — endpoint only accepts the bare model name
    bare_model = GITHUB_MODEL.split("/")[-1] if "/" in GITHUB_MODEL else GITHUB_MODEL
    print(f"      Bare model sent: {bare_model}")

    url = "https://models.inference.ai.azure.com/chat/completions"
    headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Content-Type": "application/json",
    }
    body = {
        "model": bare_model,
        "messages": [{"role": "user", "content": TEST_PROMPT}],
        "max_tokens": 200,
        "temperature": 0.1,
    }

    t0 = time.time()
    try:
        r = httpx.post(url, json=body, headers=headers, timeout=30)
        elapsed = time.time() - t0

        if r.status_code == 200:
            text = r.json()["choices"][0]["message"]["content"]
            ok(f"{elapsed:.2f}s -> {preview(text)}")
            return True, text
        else:
            fail(f"HTTP {r.status_code} — {r.text[:200]}")
            return False, r.text
    except Exception as e:
        fail(str(e))
        return False, str(e)


def test_groq() -> tuple[bool, str]:
    """
    Tests Groq with exponential backoff on 429.
    llama-3.1-8b-instant has the highest free TPM of all Groq models in 2026.
    """
    provider = "Groq"
    print(f"\n{BOLD}{CYAN}[3/3] Testing {provider}{RESET}")
    print(f"      Model   : {GROQ_MODEL}")
    print(f"      Endpoint: api.groq.com (OpenAI-compatible)")

    if not GROQ_API_KEY:
        warn("GROQ_API_KEY not set in .env")
        return False, "no key"

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    body = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": TEST_PROMPT}],
        "max_tokens": 200,
        "temperature": 0.1,
    }

    max_retries = 3
    for attempt in range(max_retries):
        t0 = time.time()
        try:
            r = httpx.post(url, json=body, headers=headers, timeout=30)
            elapsed = time.time() - t0

            if r.status_code == 200:
                text = r.json()["choices"][0]["message"]["content"]
                ok(f"{elapsed:.2f}s -> {preview(text)}")
                return True, text

            if r.status_code == 429:
                wait = 2 ** attempt  # 1s → 2s → 4s
                print(f"  {YELLOW}[429] Rate-limited -- attempt {attempt+1}/{max_retries}."
                      f" Retrying in {wait}s...{RESET}")
                time.sleep(wait)
                continue

            fail(f"HTTP {r.status_code} — {r.text[:200]}")
            return False, r.text

        except Exception as e:
            fail(f"Exception (attempt {attempt+1}): {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
            else:
                return False, str(e)

    fail("All retry attempts exhausted.")
    return False, "rate-limited"


# ── main ──────────────────────────────────────────────────────────────────────

TESTS = {
    "gemini": ("Gemini",       test_gemini),
    "github": ("GitHub Models", test_github),
    "groq":   ("Groq",         test_groq),
}

def main():
    filter_arg = sys.argv[1].lower() if len(sys.argv) > 1 else None

    print(f"\n{BOLD}{'='*60}")
    print("  CertGuard LLM Provider Test Suite")
    print(f"{'='*60}{RESET}")
    print(f"  Prompt: \"{TEST_PROMPT}\"")

    results: dict[str, bool] = {}

    for key, (name, fn) in TESTS.items():
        if filter_arg and filter_arg != key:
            continue
        passed, _ = fn()
        results[key] = passed

    # ── summary table ─────────────────────────────────────────────────────
    print(f"\n{BOLD}{'='*60}")
    print("  Summary")
    print(f"{'='*60}{RESET}")

    rows = {
        "gemini": ("Gemini",        GEMINI_MODEL,  "15 req/min · 1500/day free"),
        "github": ("GitHub Models", GITHUB_MODEL,  "free with GitHub account"),
        "groq":   ("Groq",         GROQ_MODEL,    "generous daily free tier"),
    }
    for key, (name, model, note) in rows.items():
        if key not in results:
            status = f"{YELLOW}SKIPPED{RESET}"
        elif results[key]:
            status = f"{GREEN}PASSED {RESET}"
        else:
            status = f"{RED}FAILED {RESET}"
        print(f"  {status}  {name:<16} {model:<30} {note}")

    total  = len(results)
    passed = sum(results.values())
    print(f"\n  {passed}/{total} providers operational\n")

    if passed == 0 and total > 0:
        print(f"  {RED}No providers are working — check your API keys in .env{RESET}\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
