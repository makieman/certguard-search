import os
import json
from typing import Dict, List, Any
from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient
from agents.llm import call_llm

class Verifier:
    def __init__(self):
        """
        Input: gaps (from GapExtractor)
        Output: verified skills, annotated study resources, search context
        """
        self.endpoint = os.getenv("AZURE_SEARCH_ENDPOINT")
        self.key = os.getenv("AZURE_SEARCH_KEY")
        self.index_name = "certguard-index"
        
    def _search_azure(self, query: str) -> List[Dict[str, Any]]:
        results = []
        if not self.endpoint or not self.key:
            return results
            
        try:
            credential = AzureKeyCredential(self.key)
            client = SearchClient(endpoint=self.endpoint, index_name=self.index_name, credential=credential)
            
            search_results = client.search(search_text=query, top=3)
            for r in search_results:
                results.append({
                    "title": r.get("title"),
                    "content": r.get("content")[:500] + "...", # truncate content for context size
                    "category": r.get("category"),
                    "filename": r.get("filename")
                })
        except Exception as e:
            print(f"Azure Search query error: {e}")
        return results

    def _search_local(self, query: str) -> List[Dict[str, Any]]:
        # Fallback keyword search on local_search_index.json
        results = []
        try:
            local_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "local_search_index.json")
            if not os.path.exists(local_path):
                return results
                
            with open(local_path, "r", encoding="utf-8") as f:
                documents = json.load(f)
                
            query_terms = query.lower().split()
            for doc in documents:
                score = 0
                title_lower = doc["title"].lower()
                content_lower = doc["content"].lower()
                
                for term in query_terms:
                    if term in title_lower:
                        score += 5
                    if term in content_lower:
                        score += 1
                        
                if score > 0:
                    results.append({
                        "title": doc["title"],
                        "content": doc["content"][:500] + "...",
                        "category": doc["category"],
                        "filename": doc["filename"],
                        "score": score
                    })
            
            # Sort by match score
            results.sort(key=lambda x: x.get("score", 0), reverse=True)
            # Remove score key before returning
            for r in results:
                r.pop("score", None)
                
            return results[:3]
        except Exception as e:
            print(f"Local search fallback error: {e}")
        return results

    def verify_gaps(self, gap_data: Dict[str, Any], cert_requirements: Dict[str, Any]) -> Dict[str, Any]:
        weak_skills = gap_data.get("weak_skills", [])
        certification = cert_requirements.get("certification", "General")
        
        # 1. Search documentation for each weak skill
        search_context = []
        for skill in weak_skills:
            # Try Azure search first
            results = self._search_azure(f"{certification} {skill}")
            if not results:
                # Fallback to local search
                results = self._search_local(f"{certification} {skill}")
            search_context.extend(results)
            
        # Deduplicate results by title
        seen = set()
        dedup_context = []
        for item in search_context:
            if item["title"] not in seen:
                seen.add(item["title"])
                dedup_context.append(item)
                
        # 2. Invoke LLM to verify and align resources
        prompt = f"""
You are the Verifier agent in the CertGuard pipeline.
The learner is targeting the certification: '{certification}'.
The gap analysis identified these weak skills: {weak_skills}
We found the following relevant certification study resources:
{json.dumps(dedup_context, indent=2)}

Your task:
1. Verify if these weak skills are actually required for the '{certification}' certification.
2. Annotate the learning resources for the weak skills.
3. Output a structured JSON response matching this schema:
{{
  "is_valid": true/false (are the gaps verified against the requirements?),
  "verification_details": "Explanation of the verification process",
  "annotated_resources": [
    {{
      "skill": "skill_name",
      "resource": "Name of the guide or course",
      "description": "Specific study sections or topics relevant to this skill"
    }}
  ]
}}
Ensure the response is ONLY valid JSON.
"""
        response_text = call_llm(prompt, system_prompt="You are an expert technical verifier. Return ONLY valid JSON.")
        
        # Clean response text if LLM wrapped in code block
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
            
        try:
            verification_result = json.loads(response_text)
        except Exception as e:
            print(f"Verifier failed to parse JSON: {e}. Output was: {response_text}")
            # Fallback structure
            verification_result = {
                "is_valid": True,
                "verification_details": "Fallback verification due to parsing failure.",
                "annotated_resources": [
                    {"skill": skill, "resource": "Official Documentation", "description": f"Study requirements for {skill}"}
                    for skill in weak_skills
                ]
            }
            
        # Include search context in the final result
        verification_result["search_context"] = dedup_context
        return verification_result

if __name__ == "__main__":
    v = Verifier()
    sample_gaps = {"weak_skills": ["azure", "databricks"], "study_hours": 20}
    sample_reqs = {"certification": "Data Engineer"}
    print(v.verify_gaps(sample_gaps, sample_reqs))
