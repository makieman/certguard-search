import os
from dotenv import load_dotenv
from typing import Dict, Any

from agents.gap_extractor import GapExtractor
from agents.verifier import Verifier
from agents.critic import Critic
from agents.judge import Judge
from agents.explainer import Explainer

load_dotenv()

class CertGuardOrchestrator:
    def __init__(self):
        print("Initializing CertGuard Orchestrator...")
        self.gap_extractor = GapExtractor()
        self.verifier = Verifier()
        self.critic = Critic()
        self.judge = Judge()
        self.explainer = Explainer()

    def evaluate_learner(self, learner_data: dict, cert_requirements: dict) -> dict:
        print(f"Evaluating learner '{learner_data.get('name', 'Learner')}' against requirements for '{cert_requirements.get('certification', 'Certification')}'...")
        
        # Step 1: Gap Extractor
        gap_results = self.gap_extractor.extract_gaps(learner_data, cert_requirements)
        print("Gap Extractor finished:", gap_results)
        
        # Step 2: Verifier
        verification_results = self.verifier.verify_gaps(gap_results, cert_requirements)
        print("Verifier finished:", verification_results)
        
        # Step 3: Critic
        critic_results = self.critic.critique_plan(gap_results, verification_results, cert_requirements)
        print("Critic finished:", critic_results)
        
        # Step 4: Judge
        judge_results = self.judge.judge_readiness(
            learner_data,
            cert_requirements,
            gap_results,
            verification_results,
            critic_results
        )
        print("Judge finished:", judge_results)
        
        # Step 5: Explainer
        explainer_results = self.explainer.generate_explanation(
            learner_data,
            cert_requirements,
            gap_results,
            verification_results,
            critic_results,
            judge_results
        )
        print("Explainer finished:", explainer_results)
        
        # Assemble the full response pipeline dictionary
        pipeline_output = {
            "learner_name": learner_data.get("name", "Learner"),
            "certification": cert_requirements.get("certification", "Certification"),
            "status": "completed",
            "gap_analysis": gap_results,
            "verification": {
                "is_valid": verification_results.get("is_valid"),
                "verification_details": verification_results.get("verification_details"),
                "annotated_resources": verification_results.get("annotated_resources"),
                "search_context": verification_results.get("search_context", [])
            },
            "critic": critic_results,
            "judge": judge_results,
            "explainer": explainer_results
        }
        
        return pipeline_output

if __name__ == "__main__":
    orchestrator = CertGuardOrchestrator()
    sample_learner = {"name": "Alice", "skills": ["python", "sql"]}
    sample_reqs = {"certification": "Azure Data Engineer", "required_skills": ["python", "sql", "azure", "databricks"]}
    
    result = orchestrator.evaluate_learner(sample_learner, sample_reqs)
    print("\nFinal Result:\n", result)
