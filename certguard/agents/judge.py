import json
from typing import Dict, Any
from agents.llm import call_llm

class Judge:
    def __init__(self):
        """
        Input: gaps + verification + criticism
        Output: readiness decision (Ready / Not Ready / Needs More Study), confidence, justification
        """
        pass
        
    def judge_readiness(self, 
                        learner_data: Dict[str, Any],
                        cert_requirements: Dict[str, Any],
                        gap_data: Dict[str, Any], 
                        verification_data: Dict[str, Any], 
                        critic_data: Dict[str, Any]) -> Dict[str, Any]:
        
        certification = cert_requirements.get("certification", "General")
        learner_name = learner_data.get("name", "Learner")
        learner_skills = learner_data.get("skills", [])
        weak_skills = gap_data.get("weak_skills", [])
        
        prompt = f"""
You are the Judge agent in the CertGuard pipeline.
We need to determine if the learner '{learner_name}' is ready to sit for the '{certification}' certification exam.

Learner's current skills: {learner_skills}
Target certification required skills: {cert_requirements.get("required_skills", [])}

Gaps:
- Weak skills: {weak_skills}
- Score gap: {gap_data.get("score_gap", 0)}

Verifier assessment:
- Gaps valid: {verification_data.get("is_valid", True)}
- Annotated resources: {json.dumps(verification_data.get("annotated_resources", []), indent=2)}

Critic evaluation:
- Criticism: {critic_data.get("criticism")}
- Suggestions: {critic_data.get("suggestions")}

Your task:
1. Make a final assessment of readiness. Choose one of:
   - "Ready" (if they have no/minimal gaps and are fully prepared)
   - "Needs More Study" (if they have gaps but have a path/roadmap, which is the common case)
   - "Not Ready" (if gaps are too large and confidence is extremely low)
2. Provide a confidence score (float between 0.0 and 1.0).
3. Write a justification explaining the decision.
4. Output a structured JSON response matching this schema:
{{
  "decision": "Ready" / "Needs More Study" / "Not Ready",
  "confidence": 0.0 to 1.0,
  "justification": "Detailed reasoning for this judgment"
}}
Ensure the response is ONLY valid JSON.
"""
        response_text = call_llm(prompt, system_prompt="You are a senior certification evaluator and judge. Return ONLY valid JSON.")
        
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
            
        try:
            judge_result = json.loads(response_text)
        except Exception as e:
            print(f"Judge failed to parse JSON: {e}. Output was: {response_text}")
            decision = "Needs More Study" if weak_skills else "Ready"
            judge_result = {
                "decision": decision,
                "confidence": 0.8,
                "justification": f"Fallback judgement: The learner has {len(weak_skills)} weak skills and requires structured training before exam attempt."
            }
            
        return judge_result
