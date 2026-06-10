from typing import Dict, List, Any

class GapExtractor:
    def __init__(self):
        """
        Input: learner data + certification requirements
        Output: weak skills, score gap, study hours
        """
        pass

    def extract_gaps(self, learner_data: Dict[str, Any], cert_requirements: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extracts the gaps between learner's current skills and the certification requirements.
        """
        learner_skills = set(learner_data.get("skills", []))
        required_skills = set(cert_requirements.get("required_skills", []))
        
        weak_skills = list(required_skills - learner_skills)
        
        # Simple heuristic for study hours
        study_hours = len(weak_skills) * 10 
        
        return {
            "weak_skills": weak_skills,
            "score_gap": len(weak_skills) * 10,
            "study_hours": study_hours
        }

if __name__ == "__main__":
    extractor = GapExtractor()
    sample_learner = {"name": "Alice", "skills": ["python", "sql"]}
    sample_reqs = {"certification": "Data Engineer", "required_skills": ["python", "sql", "azure", "databricks"]}
    
    print(extractor.extract_gaps(sample_learner, sample_reqs))
