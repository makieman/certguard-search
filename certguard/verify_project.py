import os
import sys
import importlib
import json
from dotenv import load_dotenv

def check_python_version():
    print("Checking Python version...")
    print(f"  Version: {sys.version}")
    if sys.version_info < (3, 9):
        print("  [WARNING] Python version is below 3.9. Recommend upgrading.")
        return False
    print("  [OK] Python version is OK.")
    return True

def check_dependencies():
    print("\nChecking dependencies in requirements.txt...")
    req_path = "requirements.txt"
    if not os.path.exists(req_path):
        print("  [ERROR] requirements.txt not found.")
        return False
        
    modules = []
    with open(req_path, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                modules.append(line.split("==")[0].split(">=")[0].strip())
                
    # Also add httpx since it is used in llm.py
    if "httpx" not in modules:
        modules.append("httpx")
        
    missing = []
    for mod in modules:
        # Map requirements names to importable module names
        import_name = mod
        if mod == "azure-search-documents":
            import_name = "azure.search.documents"
        elif mod == "python-dotenv":
            import_name = "dotenv"
            
        try:
            importlib.import_module(import_name)
            print(f"  [OK] {mod}: Installed")
        except ImportError:
            print(f"  [MISSING] {mod}: NOT INSTALLED")
            missing.append(mod)
            
    if missing:
        print(f"\n  [ERROR] Missing packages: {', '.join(missing)}")
        print("  Please run: pip install -r requirements.txt")
        return False
    print("  [OK] All dependencies installed.")
    return True

def check_env_variables():
    print("\nChecking environment variables (.env)...")
    if not os.path.exists(".env"):
        print("  [ERROR] .env file is missing.")
        return False
        
    load_dotenv()
    
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    anthropic_model = os.getenv("ANTHROPIC_MODEL")
    azure_endpoint = os.getenv("AZURE_SEARCH_ENDPOINT")
    azure_key = os.getenv("AZURE_SEARCH_KEY")
    
    success = True
    
    # Anthropic API Key check
    if not anthropic_key:
        print("  [ERROR] ANTHROPIC_API_KEY is not set.")
        success = False
    elif anthropic_key.startswith("sk-ant-api03-") and len(anthropic_key) > 50:
        print(f"  [OK] ANTHROPIC_API_KEY is configured (starts with sk-ant-api03-, length: {len(anthropic_key)})")
    else:
        print(f"  [WARNING] ANTHROPIC_API_KEY format is unusual (length: {len(anthropic_key)})")
        
    # Anthropic Model check
    if not anthropic_model:
        print("  [WARNING] ANTHROPIC_MODEL is not set. Will default to claude-3-5-sonnet-20241022.")
    else:
        print(f"  [OK] ANTHROPIC_MODEL is set to '{anthropic_model}'")
        if anthropic_model == "claude-sonnet-4-5" or "ANTHROPIC_MODEL=" in anthropic_model:
            print("  [ERROR] Invalid model configuration in .env. Double check assignment syntax.")
            success = False
            
    # Azure AI Search check
    if not azure_endpoint:
        print("  [ERROR] AZURE_SEARCH_ENDPOINT is not set.")
        success = False
    else:
        print(f"  [OK] AZURE_SEARCH_ENDPOINT is set to '{azure_endpoint}'")
        
    if not azure_key:
        print("  [ERROR] AZURE_SEARCH_KEY is not set.")
        success = False
    else:
        print("  [OK] AZURE_SEARCH_KEY is set.")
        
    return success

def check_data_and_docs():
    print("\nChecking synthetic data and documentation...")
    docs_dir = "docs"
    data_dir = "data"
    
    # Check docs
    if not os.path.exists(docs_dir):
        print("  [ERROR] docs/ directory is missing.")
    else:
        files = os.listdir(docs_dir)
        md_files = [f for f in files if f.endswith(".md")]
        print(f"  [OK] docs/ contains {len(md_files)} markdown files: {md_files}")
        
    # Check data
    if not os.path.exists(data_dir):
        print("  [ERROR] data/ directory is missing.")
    else:
        files = os.listdir(data_dir)
        json_files = [f for f in files if f.endswith(".json")]
        if not json_files:
            print("  [WARNING] data/ directory is empty. Expected: learners.json, work_signals.json, certs.json")
        else:
            print(f"  [OK] data/ contains {len(json_files)} json files: {json_files}")

def run_tests():
    print("\nRunning project unit tests...")
    import unittest
    
    # Import tests
    loader = unittest.TestLoader()
    start_dir = 'tests'
    suite = loader.discover(start_dir)
    
    runner = unittest.TextTestRunner(verbosity=1)
    result = runner.run(suite)
    
    if result.wasSuccessful():
        print("  [OK] Unit tests execution completed successfully.")
        return True
    else:
        print("  [ERROR] Unit tests failed.")
        return False

if __name__ == "__main__":
    print("=========================================")
    print("        CertGuard Verification Tool      ")
    print("=========================================")
    
    py_ok = check_python_version()
    deps_ok = check_dependencies()
    env_ok = check_env_variables()
    check_data_and_docs()
    
    tests_ok = False
    if deps_ok:
        tests_ok = run_tests()
        
    print("\n=========================================")
    print("                Summary                  ")
    print("=========================================")
    print(f"Python:       {'[OK]' if py_ok else '[FAILED]'}")
    print(f"Dependencies: {'[OK]' if deps_ok else '[FAILED]'}")
    print(f"Environment:  {'[OK]' if env_ok else '[FAILED]'}")
    print(f"Unit Tests:   {'[PASSED]' if tests_ok else '[FAILED]'}")
    print("=========================================")
