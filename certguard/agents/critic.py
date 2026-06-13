import json
from typing import Dict, Any
from agents.llm import call_llm

class Critic:
    def __init__(self):
        """
        Input: gap analysis + verification results
        Output: critique of study plan, realism check, and suggestions
        """
        pass
        
    def critique_plan(self, gap_data: Dict[str, Any], verification_data: Dict[str, Any], cert_requirements: Dict[str, Any]) -> Dict[str, Any]:
        certification = cert_requirements.get("certification", "General")
        weak_skills = gap_data.get("weak_skills", [])
        study_hours = gap_data.get("study_hours", 0)
        annotated_resources = verification_data.get("annotated_resources", [])
        
        prompt = f"""
You are the Critic agent in the CertGuard pipeline.
The learner wants to prepare for: '{certification}'.
Gap analysis details:
- Weak skills identified: {weak_skills}
- Estimated study hours: {study_hours} hours

Verification details:
- Verified resources: {json.dumps(annotated_resources, indent=2)}

Your task:
1. Critically evaluate whether the study plan is realistic. For example, is {study_hours} hours sufficient for mastering {weak_skills} for a '{certification}' level?
2. Check if the learning resources are appropriate and cover all the gaps.
3. Identify potential risks or missing details in their roadmap.
4. Output a structured JSON response matching this schema:
{{
  "score_gap_valid": true/false (is the score gap assessment valid?),
  "study_hours_realistic": true/false (is the study time realistic?),
  "criticism": "Detailed critical assessment of the plan",
  "suggestions": [
    "Suggestion 1 to improve the plan",
    "Suggestion 2 to improve the plan"
  ]
}}
Ensure the response is ONLY valid JSON.
"""
        response_text = call_llm(prompt, system_prompt="You are a critical reviewer. Return ONLY valid JSON.")
        
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
            
        try:
            critic_result = json.loads(response_text)
        except Exception as e:
            print(f"Critic failed to parse JSON: {e}. Output was: {response_text}")
            critic_result = {
                "score_gap_valid": True,
                "study_hours_realistic": False,
                "criticism": "Fallback critic: Estimated study hours might be insufficient for cloud infrastructure components.",
                "suggestions": [
                    "Allocate more hands-on lab time for weak skills.",
                    "Review official certification practice questions."
                ]
            }
            
        return critic_result
