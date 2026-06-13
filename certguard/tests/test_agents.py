import os
import unittest
from orchestrator import CertGuardOrchestrator
from agents.gap_extractor import GapExtractor
from agents.verifier import Verifier
from agents.critic import Critic
from agents.judge import Judge
from agents.explainer import Explainer

class TestCertGuardPipeline(unittest.TestCase):
    def setUp(self):
        self.orchestrator = CertGuardOrchestrator()
        self.sample_learner = {
            "name": "Alice Developer",
            "skills": ["python", "sql", "testing"]
        }
        self.sample_requirements = {
            "certification": "Azure Data Engineer Associate",
            "required_skills": ["python", "sql", "azure", "databricks", "azure_data_factory"]
        }

    def test_gap_extractor(self):
        print("\n--- Testing Gap Extractor ---")
        extractor = GapExtractor()
        res = extractor.extract_gaps(self.sample_learner, self.sample_requirements)
        self.assertIn("weak_skills", res)
        self.assertIn("study_hours", res)
        self.assertIn("score_gap", res)
        self.assertIn("azure", res["weak_skills"])
        self.assertIn("databricks", res["weak_skills"])
        print("Gap Extractor checks passed.")

    def test_verifier(self):
        print("\n--- Testing Verifier ---")
        extractor = GapExtractor()
        gap_res = extractor.extract_gaps(self.sample_learner, self.sample_requirements)
        
        verifier = Verifier()
        res = verifier.verify_gaps(gap_res, self.sample_requirements)
        self.assertIn("is_valid", res)
        self.assertIn("annotated_resources", res)
        print("Verifier checks passed.")

    def test_critic(self):
        print("\n--- Testing Critic ---")
        extractor = GapExtractor()
        gap_res = extractor.extract_gaps(self.sample_learner, self.sample_requirements)
        
        verifier = Verifier()
        verify_res = verifier.verify_gaps(gap_res, self.sample_requirements)
        
        critic = Critic()
        res = critic.critique_plan(gap_res, verify_res, self.sample_requirements)
        self.assertIn("score_gap_valid", res)
        self.assertIn("study_hours_realistic", res)
        self.assertIn("criticism", res)
        print("Critic checks passed.")

    def test_judge(self):
        print("\n--- Testing Judge ---")
        extractor = GapExtractor()
        gap_res = extractor.extract_gaps(self.sample_learner, self.sample_requirements)
        
        verifier = Verifier()
        verify_res = verifier.verify_gaps(gap_res, self.sample_requirements)
        
        critic = Critic()
        critic_res = critic.critique_plan(gap_res, verify_res, self.sample_requirements)
        
        judge = Judge()
        res = judge.judge_readiness(
            self.sample_learner,
            self.sample_requirements,
            gap_res,
            verify_res,
            critic_res
        )
        self.assertIn("decision", res)
        self.assertIn("confidence", res)
        self.assertIn("justification", res)
        self.assertIn(res["decision"], ["Ready", "Needs More Study", "Not Ready"])
        print("Judge checks passed. Decision:", res["decision"])

    def test_explainer(self):
        print("\n--- Testing Explainer ---")
        extractor = GapExtractor()
        gap_res = extractor.extract_gaps(self.sample_learner, self.sample_requirements)
        
        verifier = Verifier()
        verify_res = verifier.verify_gaps(gap_res, self.sample_requirements)
        
        critic = Critic()
        critic_res = critic.critique_plan(gap_res, verify_res, self.sample_requirements)
        
        judge = Judge()
        judge_res = judge.judge_readiness(
            self.sample_learner,
            self.sample_requirements,
            gap_res,
            verify_res,
            critic_res
        )
        
        explainer = Explainer()
        res = explainer.generate_explanation(
            self.sample_learner,
            self.sample_requirements,
            gap_res,
            verify_res,
            critic_res,
            judge_res
        )
        self.assertIn("report_summary", res)
        self.assertIn("detailed_feedback", res)
        self.assertIn("recommended_roadmap", res)
        print("Explainer checks passed.")

    def test_full_orchestrator_pipeline(self):
        print("\n--- Testing Full Orchestrator Pipeline ---")
        res = self.orchestrator.evaluate_learner(self.sample_learner, self.sample_requirements)
        
        self.assertEqual(res["learner_name"], "Alice Developer")
        self.assertEqual(res["certification"], "Azure Data Engineer Associate")
        self.assertEqual(res["status"], "completed")
        self.assertIn("gap_analysis", res)
        self.assertIn("verification", res)
        self.assertIn("critic", res)
        self.assertIn("judge", res)
        self.assertIn("explainer", res)
        print("Full pipeline execution succeeded and returned correct schema.")

if __name__ == "__main__":
    unittest.main()
