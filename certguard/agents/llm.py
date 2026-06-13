import os
import json
import time
import httpx
from dotenv import load_dotenv

load_dotenv()

# --- Provider credentials ---
GEMINI_API_KEY  = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL    = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

GITHUB_TOKEN    = os.getenv("GITHUB_TOKEN")          # GitHub Models (option 2)
GITHUB_MODEL    = os.getenv("GITHUB_MODEL", "openai/gpt-4o-mini")

GROQ_API_KEY    = os.getenv("GROQ_API_KEY")           # Groq (option 3)
GROQ_MODEL      = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")   # highest free TPM on Groq

# ---------------------------------------------------------------------------
# Public entry point — cascades through providers in priority order
# ---------------------------------------------------------------------------

def call_llm(prompt: str, system_prompt: str = None) -> str:
    """
    Calls LLM providers in priority order:
      1. GitHub Models   (gpt-4o-mini — free with GitHub account)  <-- PRIMARY
      2. Groq            (llama-3.1-8b-instant — fastest inference, generous free tier)
      3. Google Gemini   (fallback — quota currently exhausted)
      4. Mock fallback   (structured responses for development / testing)
    """
    # 1. GitHub Models -------------------------------------------------------
    if GITHUB_TOKEN:
        result = _call_github_models(prompt, system_prompt)
        if result is not None:
            return result
        print("GitHub Models failed — trying Groq next...")
    else:
        print("Warning: GITHUB_TOKEN not set — skipping GitHub Models.")

    # 2. Groq ----------------------------------------------------------------
    if GROQ_API_KEY:
        result = _call_groq(prompt, system_prompt)
        if result is not None:
            return result
        print("Groq failed — trying Gemini next...")
    else:
        print("Warning: GROQ_API_KEY not set — skipping Groq.")

    # 3. Google Gemini -------------------------------------------------------
    if GEMINI_API_KEY:
        result = _call_gemini(prompt, system_prompt)
        if result is not None:
            return result
        print("Gemini failed — falling back to mock responses.")
    else:
        print("Warning: GEMINI_API_KEY not set — skipping Gemini.")

    # 4. Mock fallback -------------------------------------------------------
    print("All providers exhausted. Using structured mock fallback.")
    return get_mock_llm_response(prompt, system_prompt)


# ---------------------------------------------------------------------------
# Provider 1: Google Gemini
# ---------------------------------------------------------------------------

def _call_gemini(prompt: str, system_prompt: str = None) -> str | None:
    """
    Calls Google AI Studio Gemini API.
    Uses the stable /v1/ endpoint — required for gemini-2.0-flash and later models
    (v1beta only surfaces 1.5-series models).  Returns None on any failure.
    """
    # NOTE: use /v1/ (stable), NOT /v1beta/ — gemini-2.0-flash is NOT in v1beta
    url = (
        f"https://generativelanguage.googleapis.com/v1/models/"
        f"{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    )

    contents = []
    if system_prompt:
        contents.append({
            "role": "user",
            "parts": [{"text": f"[System Instructions]\n{system_prompt}\n\n[User Message]\n{prompt}"}]
        })
    else:
        contents.append({
            "role": "user",
            "parts": [{"text": prompt}]
        })

    data = {
        "contents": contents,
        "generationConfig": {
            "maxOutputTokens": 4000,
            "temperature": 0.2
        }
    }

    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(url, json=data)
            if response.status_code == 200:
                result = response.json()
                return result["candidates"][0]["content"]["parts"][0]["text"]
            print(f"Gemini API error (HTTP {response.status_code}): {response.text}")
            return None
    except Exception as e:
        print(f"Gemini exception: {e}")
        return None


# ---------------------------------------------------------------------------
# Provider 2: GitHub Models  (OpenAI-compatible endpoint)
# ---------------------------------------------------------------------------

def _call_github_models(prompt: str, system_prompt: str = None) -> str | None:
    """
    Calls GitHub Models via the Azure AI inference endpoint.
    Model: gpt-4o-mini (free with any GitHub account).
    Returns None on any failure.
    """
    url = "https://models.inference.ai.azure.com/chat/completions"

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Content-Type": "application/json",
    }
    # GitHub Models endpoint requires the bare model name — strip any "openai/" namespace prefix
    bare_model = GITHUB_MODEL.split("/")[-1] if "/" in GITHUB_MODEL else GITHUB_MODEL
    data = {
        "model": bare_model,
        "messages": messages,
        "max_tokens": 4000,
        "temperature": 0.2,
    }

    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(url, headers=headers, json=data)
            if response.status_code == 200:
                result = response.json()
                return result["choices"][0]["message"]["content"]
            print(f"GitHub Models error (HTTP {response.status_code}): {response.text}")
            return None
    except Exception as e:
        print(f"GitHub Models exception: {e}")
        return None


# ---------------------------------------------------------------------------
# Provider 3: Groq  (OpenAI-compatible endpoint)
# ---------------------------------------------------------------------------

def _call_groq(prompt: str, system_prompt: str = None) -> str | None:
    """
    Calls Groq cloud API — fastest inference, generous free tier.
    Default model: llama-3.1-8b-instant  (~4× higher free TPM than llama3-8b-8192).
    Retries up to 3 times with exponential backoff on HTTP 429 (rate-limit) responses.
    Returns None only after all retries are exhausted or on a hard error.
    """
    url = "https://api.groq.com/openai/v1/chat/completions"

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    data = {
        "model": GROQ_MODEL,
        "messages": messages,
        "max_tokens": 4000,
        "temperature": 0.2,
    }

    max_retries = 3
    for attempt in range(max_retries):
        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.post(url, headers=headers, json=data)

                if response.status_code == 200:
                    return response.json()["choices"][0]["message"]["content"]

                if response.status_code == 429:
                    wait = 2 ** attempt          # 1s → 2s → 4s
                    print(f"Groq rate-limited (attempt {attempt + 1}/{max_retries}). "
                          f"Retrying in {wait}s...")
                    time.sleep(wait)
                    continue                     # retry

                # Any other HTTP error — don't retry
                print(f"Groq error (HTTP {response.status_code}): {response.text}")
                return None

        except Exception as e:
            print(f"Groq exception (attempt {attempt + 1}): {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
            else:
                return None

    print("Groq: all retry attempts exhausted after rate-limiting.")
    return None


def get_mock_llm_response(prompt: str, system_prompt: str = None) -> str:
    """
    Fallback mock generator that parses key instructions in the prompt and returns valid-looking JSON or text.
    """
    prompt_lower = prompt.lower()
    sys_lower = system_prompt.lower() if system_prompt else ""

    # Define fallback structures
    judge_fallback = json.dumps({
        "decision": "Ready" if "weak_skills: []" in prompt_lower or "weak skills: []" in prompt_lower else "Needs More Study",
        "confidence": 0.9,
        "justification": "The learner lacks Azure and Databricks skills which are mandatory for DP-203. However, they are strong in python and sql, representing a good foundation."
    }, indent=2)

    explainer_fallback = json.dumps({
        "report_summary": "Alice is on the right path for Azure Data Engineer Associate, but needs to focus on Azure-specific technologies.",
        "detailed_feedback": "You already have python and sql skills, which covers about 40% of the DP-203 syllabus. Your gap is the Azure cloud environment, Azure Data Factory, Databricks, and Synapse. We recommend a dedicated 55-hour study plan focusing on Databricks clusters and Data Factory ETL pipelines.",
        "recommended_roadmap": [
            "Step 1: Get familiar with Azure cloud basics (AZ-900).",
            "Step 2: Spend 15 hours on Azure Data Factory pipeline orchestration.",
            "Step 3: Spend 25 hours on Databricks, PySpark, and Delta Lake tables.",
            "Step 4: Practice dedicated SQL pools in Synapse."
        ]
    }, indent=2)

    critic_fallback = json.dumps({
        "score_gap_valid": True,
        "study_hours_realistic": True,
        "criticism": "The gap analysis is mostly complete. However, python study hours (10 hours) might be tight if the learner lacks OOP experience. We should recommend checking their OOP familiarity.",
        "suggestions": [
            "Verify if the learner is comfortable with OOP principles.",
            "Increase study hours if no prior Python/SQL experience exists."
        ]
    }, indent=2)

    verifier_fallback = json.dumps({
        "is_valid": True,
        "verification_details": "Skills verified against standard syllabus. Relevant learning resources found in Azure AI Search.",
        "annotated_resources": [
            {
                "skill": "python",
                "resource": "Microsoft Learn / Python PCAP course",
                "description": "Found study material details about Python syntax, modules, and OOP."
            },
            {
                "skill": "sql",
                "resource": "Microsoft Learn DP-203",
                "description": "Found SQL query patterns, indexing, and Delta Lake optimizations."
            }
        ]
    }, indent=2)

    # 1. Direct match on system prompt keywords
    if sys_lower:
        if "judge" in sys_lower:
            return judge_fallback
        elif "explain" in sys_lower or "educator" in sys_lower:
            return explainer_fallback
        elif "critic" in sys_lower or "reviewer" in sys_lower:
            return critic_fallback
        elif "verify" in sys_lower or "verifier" in sys_lower:
            return verifier_fallback

    # 2. Fallback to prompt keywords if system prompt didn't match
    if "judge" in prompt_lower:
        return judge_fallback
    elif "explainer" in prompt_lower or "explain" in prompt_lower:
        return explainer_fallback
    elif "critic" in prompt_lower or "critique" in prompt_lower:
        return critic_fallback
    elif "verifier" in prompt_lower or "verify" in prompt_lower:
        return verifier_fallback

    return "This is a default mock response from the LLM module fallback."
