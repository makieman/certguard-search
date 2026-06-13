import os
import json
from typing import Dict, Any
from agents.llm import call_llm

class Explainer:
    def __init__(self):
        """
        Input: gaps + verification + criticism + judgment
        Output: friendly structured report, roadmap, and learning plan explanation
        """
        # Resolve path to work_signals.json
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.work_signals_path = os.path.join(base_dir, "data", "work_signals.json")
        
    def generate_explanation(self,
                             learner_data: Dict[str, Any],
                             cert_requirements: Dict[str, Any],
                             gap_data: Dict[str, Any],
                             verification_data: Dict[str, Any],
                             critic_data: Dict[str, Any],
                             judge_data: Dict[str, Any]) -> Dict[str, Any]:
                             
        certification = cert_requirements.get("certification", "General")
        learner_name = learner_data.get("name", "Learner")
        
        # Load Work IQ activity & scheduling signals
        work_signals = {}
        if os.path.exists(self.work_signals_path):
            try:
                with open(self.work_signals_path, "r", encoding="utf-8") as f:
                    all_signals = json.load(f)
                    work_signals = all_signals.get(learner_name, {})
            except Exception as e:
                print(f"Failed to load work signals: {e}")

        prompt = f"""
You are the Explainer agent in the CertGuard pipeline.
We need to generate a beautiful, comprehensive, and friendly readiness report for the learner '{learner_name}' who is preparing for the '{certification}' exam.

Work IQ (Activity & Scheduling Signals):
- Preferred learning slots: {work_signals.get("preferred_learning_slots", "Flexible / self-paced")}
- Dedicated focus hours: {work_signals.get("dedicated_focus_hours", "Flexible / self-paced")}
- Cognitive peak hours: {work_signals.get("cognitive_peak_hours", "Not specified")}
- Weekly study budget: {work_signals.get("weekly_study_budget_hours", "Not specified")} hours/week
- Avoid active meeting times: {work_signals.get("active_meeting_hours", "None")}

Inputs and assessments:
- Learner skills: {learner_data.get("skills", [])}
- Required skills: {cert_requirements.get("required_skills", [])}
- Gaps: Weak skills {gap_data.get("weak_skills", [])}, score gap {gap_data.get("score_gap", 0)}, study hours {gap_data.get("study_hours", 0)}
- Verifier annotated resources: {json.dumps(verification_data.get("annotated_resources", []), indent=2)}
- Critic details: {critic_data.get("criticism")}, suggestions {critic_data.get("suggestions")}
- Judge decision: {judge_data.get("decision")}, confidence {judge_data.get("confidence")}, justification {judge_data.get("justification")}

Your task:
1. Explain the results to the user in a constructive and motivating tone.
2. Outline a customized roadmap based on the gaps, study hours, critic suggestions, and verified resources.
3. Formulate a final structured JSON matching this schema:
{{
  "report_summary": "Friendly high-level summary of the learner's readiness",
  "detailed_feedback": "Detailed, paragraph-long feedback on where they stand and how they can fill their gaps",
  "recommended_roadmap": [
    "Step 1 details...",
    "Step 2 details...",
    "Step 3 details..."
  ]
}}
Ensure the response is ONLY valid JSON.
"""
        response_text = call_llm(prompt, system_prompt="You are an encouraging and clear technical educator and explainer. Return ONLY valid JSON.")
        
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
            
        try:
            explainer_result = json.loads(response_text)
        except Exception as e:
            print(f"Explainer failed to parse JSON: {e}. Output was: {response_text}")
            explainer_result = {
                "report_summary": f"You are currently evaluated as '{judge_data.get('decision')}' for the {certification} certification.",
                "detailed_feedback": f"Your strong skills are {learner_data.get('skills', [])}. You need to address the following gap areas: {gap_data.get('weak_skills', [])}. Follow the suggestions and review the materials.",
                "recommended_roadmap": [
                    "Step 1: Set aside dedicated time to cover your weak skills: " + ", ".join(gap_data.get('weak_skills', [])),
                    "Step 2: Utilize the verified learning materials for study.",
                    "Step 3: Take a practice test to measure readiness before the actual exam."
                ]
            }
            
        return explainer_result
