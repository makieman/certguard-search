import React, { useState, useEffect } from 'react'
import './App.css'
import ManagerDashboard from './ManagerDashboard'

const CERTIFICATIONS = [
  {
    id: "az-900",
    name: "AZ-900: Microsoft Azure Fundamentals",
    level: "Fundamentals",
    badge_color: "#107c41", // Green
    required_skills: [
      "cloud_concepts",
      "azure_architecture_services",
      "azure_management_governance",
      "azure_security_compliance"
    ]
  },
  {
    id: "az-104",
    name: "AZ-104: Microsoft Azure Administrator",
    level: "Associate",
    badge_color: "#0078d4", // MS Blue
    required_skills: [
      "azure_identities_governance",
      "azure_storage_implementation",
      "azure_compute_resources",
      "azure_virtual_networking",
      "azure_resource_monitoring"
    ]
  },
  {
    id: "az-204",
    name: "AZ-204: Developing Solutions for Microsoft Azure",
    level: "Associate",
    badge_color: "#0078d4",
    required_skills: [
      "azure_compute_solutions",
      "azure_storage_development",
      "azure_security_implementation",
      "azure_monitoring_troubleshooting",
      "third_party_services_integration"
    ]
  },
  {
    id: "az-305",
    name: "AZ-305: Designing Microsoft Azure Infrastructure Solutions",
    level: "Expert",
    badge_color: "#f5a623", // Gold
    required_skills: [
      "identity_governance_design",
      "data_storage_design",
      "business_continuity_design",
      "infrastructure_design"
    ]
  },
  {
    id: "az-400",
    name: "AZ-400: Designing and Implementing Microsoft DevOps Solutions",
    level: "Expert",
    badge_color: "#f5a623",
    required_skills: [
      "devops_instrumentation",
      "site_reliability_engineering",
      "security_compliance",
      "source_control",
      "continuous_integration",
      "continuous_delivery"
    ]
  },
  {
    id: "az-500",
    name: "AZ-500: Microsoft Azure Security Technologies",
    level: "Associate",
    badge_color: "#0078d4",
    required_skills: [
      "identity_access_management",
      "platform_protection",
      "security_operations",
      "secure_data_applications"
    ]
  },
  {
    id: "dp-203",
    name: "DP-203: Microsoft Azure Data Engineering",
    level: "Associate",
    badge_color: "#0078d4",
    required_skills: [
      "data_storage_design",
      "data_processing_development",
      "data_security_optimization",
      "data_storage_processing_monitoring"
    ]
  },
  {
    id: "dp-420",
    name: "DP-420: Designing and Implementing Cloud-Native Applications Using Microsoft Azure Cosmos DB",
    level: "Specialty",
    badge_color: "#8660a9", // Purple
    required_skills: [
      "cosmosdb_data_modeling",
      "cosmosdb_partitioning",
      "cosmosdb_replication",
      "cosmosdb_query_tuning",
      "cosmosdb_sdk_integration"
    ]
  },
  {
    id: "ai-102",
    name: "AI-102: Designing and Implementing a Microsoft Azure AI Solution",
    level: "Associate",
    badge_color: "#0078d4",
    required_skills: [
      "azure_ai_services",
      "natural_language_processing",
      "computer_vision_solutions",
      "generative_ai_integration"
    ]
  }
];

const ALL_SKILLS = [
  "cloud_concepts",
  "azure_architecture_services",
  "azure_management_governance",
  "azure_security_compliance",
  "azure_identities_governance",
  "azure_storage_implementation",
  "azure_compute_resources",
  "azure_virtual_networking",
  "azure_resource_monitoring",
  "azure_compute_solutions",
  "azure_storage_development",
  "azure_security_implementation",
  "azure_monitoring_troubleshooting",
  "third_party_services_integration",
  "identity_governance_design",
  "data_storage_design",
  "business_continuity_design",
  "infrastructure_design",
  "devops_instrumentation",
  "site_reliability_engineering",
  "security_compliance",
  "source_control",
  "continuous_integration",
  "continuous_delivery",
  "identity_access_management",
  "platform_protection",
  "security_operations",
  "secure_data_applications",
  "data_processing_development",
  "data_security_optimization",
  "data_storage_processing_monitoring",
  "cosmosdb_data_modeling",
  "cosmosdb_partitioning",
  "cosmosdb_replication",
  "cosmosdb_query_tuning",
  "cosmosdb_sdk_integration",
  "azure_ai_services",
  "natural_language_processing",
  "computer_vision_solutions",
  "generative_ai_integration"
];

const PRESET_LEARNERS = [
  { name: "Alice Developer", cert_id: "az-204", skills: ["azure_compute_solutions", "third_party_services_integration"] },
  { name: "Bob Architect", cert_id: "az-305", skills: ["identity_governance_design", "infrastructure_design"] },
  { name: "Charlie Data", cert_id: "dp-203", skills: ["data_storage_design", "data_processing_development"] },
  { name: "David Admin", cert_id: "az-104", skills: ["azure_identities_governance", "azure_storage_implementation"] },
  { name: "Emma SecOps", cert_id: "az-500", skills: ["identity_access_management", "platform_protection"] },
  { name: "Frank DevOps", cert_id: "az-400", skills: ["source_control", "continuous_integration"] },
  { name: "Grace Cosmos", cert_id: "dp-420", skills: ["cosmosdb_data_modeling", "cosmosdb_partitioning"] },
  { name: "Harry AI", cert_id: "ai-102", skills: ["azure_ai_services", "generative_ai_integration"] },
  { name: "Irene Student", cert_id: "az-900", skills: ["cloud_concepts"] },
  { name: "Jack Engineer", cert_id: "dp-203", skills: ["data_security_optimization", "data_processing_development"] }
];

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

function App() {
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(0);
  const [learnerName, setLearnerName] = useState(PRESET_LEARNERS[0].name);
  const [selectedCert, setSelectedCert] = useState(CERTIFICATIONS.find(c => c.id === PRESET_LEARNERS[0].cert_id) || CERTIFICATIONS[0]);
  const [currentSkills, setCurrentSkills] = useState(PRESET_LEARNERS[0].skills);
  
  // Pipeline status states
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepStatuses, setStepStatuses] = useState(["pending", "pending", "pending", "pending", "pending"]);
  
  // Results & Documents states
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isIndexing, setIsIndexing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [appView, setAppView] = useState("assessment"); // "assessment" | "dashboard"

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`${API_BASE}/docs`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error("Error fetching docs:", error);
    }
  };

  const handleIndexDocs = async () => {
    setIsIndexing(true);
    try {
      const response = await fetch(`${API_BASE}/index`, { method: "POST" });
      if (response.ok) {
        alert("Re-indexing completed successfully!");
        fetchDocuments();
      } else {
        alert("Re-indexing failed.");
      }
    } catch (error) {
      console.error("Error indexing:", error);
      alert("Error contacting API for indexing.");
    } finally {
      setIsIndexing(false);
    }
  };

  const toggleSkill = (skill) => {
    if (currentSkills.includes(skill)) {
      setCurrentSkills(currentSkills.filter(s => s !== skill));
    } else {
      setCurrentSkills([...currentSkills, skill]);
    }
  };

  const handlePresetSelect = (index) => {
    setSelectedProfileIndex(index);
    if (index === -1) {
      // Manual edit
      return;
    }
    const preset = PRESET_LEARNERS[index];
    setLearnerName(preset.name);
    setCurrentSkills(preset.skills);
    const cert = CERTIFICATIONS.find(c => c.id === preset.cert_id);
    if (cert) setSelectedCert(cert);
  };

  const selectCertById = (id) => {
    const cert = CERTIFICATIONS.find(c => c.id === id);
    setSelectedCert(cert);
    setSelectedProfileIndex(-1); // Switch to manual edit mode
  };

  const runEvaluation = async () => {
    if (!learnerName.trim()) {
      alert("Please enter a learner name.");
      return;
    }

    setIsEvaluating(true);
    setEvaluationResult(null);
    setStepStatuses(["pending", "pending", "pending", "pending", "pending"]);
    setCurrentStep(1);

    const payload = {
      learner_data: {
        name: learnerName,
        skills: currentSkills
      },
      cert_requirements: {
        certification: selectedCert.name,
        required_skills: selectedCert.required_skills
      }
    };

    let apiData = null;
    let apiError = null;
    
    const apiPromise = fetch(`${API_BASE}/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    .then(res => {
      if (!res.ok) throw new Error("Backend pipeline error");
      return res.json();
    })
    .then(data => { apiData = data; })
    .catch(err => { apiError = err; });

    const stepTimes = [800, 1200, 1000, 800, 600];
    
    for (let step = 1; step <= 5; step++) {
      setCurrentStep(step);
      setStepStatuses(prev => {
        const next = [...prev];
        next[step - 1] = "active";
        return next;
      });

      await new Promise(resolve => setTimeout(resolve, stepTimes[step - 1]));

      setStepStatuses(prev => {
        const next = [...prev];
        next[step - 1] = "completed";
        return next;
      });
    }

    await apiPromise;

    if (apiError) {
      alert(`Pipeline error: ${apiError.message}`);
      setIsEvaluating(false);
      return;
    }

    setEvaluationResult(apiData);
    setIsEvaluating(false);
    setActiveTab("overview");
  };

  const getRadialOffset = (confidence) => {
    const radius = 32;
    const circumference = 2 * Math.PI * radius;
    return circumference - (confidence * circumference);
  };

  const formatSkillName = (skill) => {
    return skill.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-container">
          <div className="logo-icon">CG</div>
          <div className="logo-text">
            <h1>CertGuard</h1>
            <p>Microsoft Azure Agentic Certification Readiness Advisor</p>
          </div>
        </div>
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex', background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border-color)', borderRadius: '10px', padding: '4px', gap: '4px'
          }}>
            <button
              onClick={() => setAppView('assessment')}
              style={{
                padding: '7px 14px', fontSize: '13px', fontWeight: 600,
                border: 'none', borderRadius: '7px', cursor: 'pointer',
                background: appView === 'assessment' ? 'var(--color-primary)' : 'transparent',
                color: appView === 'assessment' ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}
            >Assessment</button>
            <button
              onClick={() => setAppView('dashboard')}
              style={{
                padding: '7px 14px', fontSize: '13px', fontWeight: 600,
                border: 'none', borderRadius: '7px', cursor: 'pointer',
                background: appView === 'dashboard' ? 'var(--color-primary)' : 'transparent',
                color: appView === 'dashboard' ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}
            >📊 Manager</button>
          </div>

          <button 
            className="btn btn-secondary" 
            onClick={handleIndexDocs} 
            disabled={isIndexing}
          >
            {isIndexing ? (
              <>
                <div className="spinner" style={{ marginRight: '6px' }} />
                Indexing...
              </>
            ) : (
              <>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: '6px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5" />
                </svg>
                Index Docs
              </>
            )}
          </button>
        </div>
      </header>

      {/* ── Manager Dashboard view ── */}
      {appView === 'dashboard' && (
        <div className="glass-card">
          <ManagerDashboard />
        </div>
      )}

      {/* ── Assessment view ── */}
      {appView === 'assessment' && <div className="app-grid">
        {/* Left Side Panel - Input Profile */}
        <div className="glass-card">
          <h2 className="card-title">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Learner Configuration
          </h2>

          <div className="form-group">
            <label className="form-label">Profile Template</label>
            <select 
              className="form-input"
              value={selectedProfileIndex} 
              onChange={(e) => handlePresetSelect(Number(e.target.value))}
            >
              {PRESET_LEARNERS.map((preset, idx) => (
                <option key={idx} value={idx}>{preset.name} ({preset.cert_id.toUpperCase()})</option>
              ))}
              <option value={-1}>Custom / Manual Entry</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Learner Name</label>
            <input 
              type="text" 
              className="form-input" 
              value={learnerName} 
              onChange={(e) => {
                setLearnerName(e.target.value);
                setSelectedProfileIndex(-1);
              }} 
              placeholder="e.g. Alice Developer"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Target Microsoft Certification</label>
            <select 
              className="form-input" 
              value={selectedCert.id} 
              onChange={(e) => selectCertById(e.target.value)}
            >
              {CERTIFICATIONS.map(cert => (
                <option key={cert.id} value={cert.id}>{cert.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Current Verified Skills</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {currentSkills.length} selected
              </span>
            </label>
            <div className="skills-grid">
              {ALL_SKILLS.map(skill => {
                const isRequired = selectedCert.required_skills.includes(skill);
                const isChecked = currentSkills.includes(skill);
                return (
                  <label 
                    key={skill} 
                    className={`skill-checkbox-label ${isChecked ? 'checked' : ''}`}
                    style={{ borderRight: isRequired ? `2px solid ${selectedCert.badge_color}` : 'none' }}
                  >
                    <input 
                      type="checkbox" 
                      checked={isChecked} 
                      onChange={() => {
                        toggleSkill(skill);
                        setSelectedProfileIndex(-1);
                      }}
                    />
                    <div className="skill-checkbox-indicator" />
                    <span>{formatSkillName(skill)}</span>
                  </label>
                );
              })}
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
              * Border highlight indicates a required skill for the {selectedCert.level} level certification.
            </p>
          </div>

          <button 
            className="btn btn-primary btn-glow" 
            onClick={runEvaluation} 
            disabled={isEvaluating}
            style={{ width: '100%', marginTop: '8px' }}
          >
            {isEvaluating ? (
              <>
                <div className="spinner" />
                Evaluating in Agents League...
              </>
            ) : (
              <>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Run Agent Assessment
              </>
            )}
          </button>

          {/* Doc Status Box */}
          <div className="doc-list-container">
            <label className="form-label">Available Microsoft Syllabus Guides ({documents.length})</label>
            <div className="doc-list">
              {documents.length > 0 ? (
                documents.map(doc => (
                  <div key={doc.id} className="doc-item">
                    <svg width="14" height="14" fill="none" stroke="#0078d4" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>{doc.filename}</span>
                  </div>
                ))
              ) : (
                <div className="doc-item" style={{ color: 'var(--text-muted)' }}>No docs found. Click Index Docs to load.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side Panel - Evaluation Results / Pipeline Progress */}
        <div className="glass-card" style={{ minHeight: '500px' }}>
          {/* 1. Pre-Run Empty State */}
          {!isEvaluating && !evaluationResult && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px', color: 'var(--text-secondary)' }}>
              <svg width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: 'rgba(0,120,212,0.1)', marginBottom: '16px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <h3>No Evaluation Session Active</h3>
              <p style={{ maxWidth: '400px', textAlign: 'center', fontSize: '14px' }}>
                Configure the learner profile or select a template and trigger the assessment to execute the 5-agent decision pipeline.
              </p>
            </div>
          )}

          {/* 2. Active Evaluating Stepper */}
          {isEvaluating && (
            <div>
              <h2 className="card-title">
                <div className="spinner" style={{ borderColor: 'rgba(0, 120, 212, 0.1)', borderTopColor: 'var(--color-primary)' }} />
                Agent Pipeline Execution
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                Running multi-agent consensus readiness assessment for <strong>{learnerName}</strong>...
              </p>

              <div className="stepper-container">
                <div className={`step-row ${stepStatuses[0]}`}>
                  <div className="step-icon">1</div>
                  <div className="step-details">
                    <div className="step-name">Gap Extractor</div>
                    <div className="step-desc">Identifies missing required skills and scores the gap.</div>
                  </div>
                  <div className="step-status-text">
                    {stepStatuses[0] === "active" && "Extracting Gaps..."}
                    {stepStatuses[0] === "completed" && "Completed"}
                    {stepStatuses[0] === "pending" && "Queued"}
                  </div>
                </div>

                <div className={`step-row ${stepStatuses[1]}`}>
                  <div className="step-icon">2</div>
                  <div className="step-details">
                    <div className="step-name">Verifier Agent (MCP Enhanced)</div>
                    <div className="step-desc">Queries Microsoft Learn MCP endpoint & Azure Search live to ground syllabus.</div>
                  </div>
                  <div className="step-status-text">
                    {stepStatuses[1] === "active" && "Querying MS Learn & Azure Search..."}
                    {stepStatuses[1] === "completed" && "Completed"}
                    {stepStatuses[1] === "pending" && "Queued"}
                  </div>
                </div>

                <div className={`step-row ${stepStatuses[2]}`}>
                  <div className="step-icon">3</div>
                  <div className="step-details">
                    <div className="step-name">Critic Agent</div>
                    <div className="step-desc">Evaluates study hours allocation and validates roadmap feasibility.</div>
                  </div>
                  <div className="step-status-text">
                    {stepStatuses[2] === "active" && "Critiquing Plan..."}
                    {stepStatuses[2] === "completed" && "Completed"}
                    {stepStatuses[2] === "pending" && "Queued"}
                  </div>
                </div>

                <div className={`step-row ${stepStatuses[3]}`}>
                  <div className="step-icon">4</div>
                  <div className="step-details">
                    <div className="step-name">Judge Agent</div>
                    <div className="step-desc">Reviews all signals and outputs final readiness verdict.</div>
                  </div>
                  <div className="step-status-text">
                    {stepStatuses[3] === "active" && "Judging Readiness..."}
                    {stepStatuses[3] === "completed" && "Completed"}
                    {stepStatuses[3] === "pending" && "Queued"}
                  </div>
                </div>

                <div className={`step-row ${stepStatuses[4]}`}>
                  <div className="step-icon">5</div>
                  <div className="step-details">
                    <div className="step-name">Explainer Agent</div>
                    <div className="step-desc">Synthesizes timeline and custom learning roadmap.</div>
                  </div>
                  <div className="step-status-text">
                    {stepStatuses[4] === "active" && "Generating Explanations..."}
                    {stepStatuses[4] === "completed" && "Finished"}
                    {stepStatuses[4] === "pending" && "Queued"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. Render Evaluation Results */}
          {!isEvaluating && evaluationResult && (
            <div>
              <div className="results-header-box">
                <div>
                  <h2 style={{ margin: 0, fontSize: '22px' }}>Readiness Assessment Report</h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Learner: <strong>{evaluationResult.learner_name}</strong> | Certification: <strong>{evaluationResult.certification}</strong>
                  </p>
                </div>
                
                {/* Decision Badge */}
                <div className={`readiness-badge ${
                  evaluationResult.judge.decision === 'Ready' ? 'ready' : 
                  evaluationResult.judge.decision === 'Needs More Study' ? 'study' : 'not-ready'
                }`}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    {evaluationResult.judge.decision === 'Ready' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    )}
                  </svg>
                  {evaluationResult.judge.decision}
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="tabs-navigation">
                <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
                <button className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>Study Roadmap</button>
                <button className={`tab-btn ${activeTab === 'resources' ? 'active' : ''}`} onClick={() => setActiveTab('resources')}>Learning Materials</button>
                <button className={`tab-btn ${activeTab === 'passages' ? 'active' : ''}`} onClick={() => setActiveTab('passages')}>Search Context</button>
                <button className={`tab-btn ${activeTab === 'debate' ? 'active' : ''}`} onClick={() => setActiveTab('debate')}>🗣️ Debate Trace</button>
              </div>

              {/* Tab 1: Overview */}
              {activeTab === 'overview' && (
                <div>
                  <div className="stats-grid">
                    <div className="stat-box">
                      <div className="stat-val" style={{ color: '#ef4444' }}>
                        {evaluationResult.gap_analysis.weak_skills.length}
                      </div>
                      <div className="stat-label">Missing Skills</div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-val" style={{ color: 'var(--color-primary)' }}>
                        {evaluationResult.gap_analysis.study_hours}h
                      </div>
                      <div className="stat-label">Recommended study</div>
                    </div>
                    <div className="stat-box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 16px' }}>
                      <div className="radial-progress-container">
                        <svg className="radial-progress-svg">
                           <circle className="radial-progress-bg" cx="40" cy="40" r="32" />
                           <circle 
                            className="radial-progress-fill" 
                            cx="40" 
                            cy="40" 
                            r="32" 
                            strokeDasharray={2 * Math.PI * 32}
                            strokeDashoffset={getRadialOffset(evaluationResult.judge.confidence)}
                           />
                        </svg>
                        <div className="radial-progress-text">{Math.round(evaluationResult.judge.confidence * 100)}%</div>
                      </div>
                      <div className="stat-label" style={{ marginTop: '2px' }}>Confidence Score</div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Judge Justification</h3>
                    <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-primary)', margin: 0 }}>
                      {evaluationResult.judge.justification}
                    </p>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Educator Executive Summary</h3>
                    <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-primary)', margin: 0 }}>
                      {evaluationResult.explainer.report_summary}
                    </p>
                    <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)', marginTop: '10px', marginBottom: 0 }}>
                      {evaluationResult.explainer.detailed_feedback}
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 2: Timeline / Roadmap */}
              {activeTab === 'timeline' && (
                <div>
                  <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Customized Preparation Roadmap</h3>
                  
                  {evaluationResult.explainer.recommended_roadmap && evaluationResult.explainer.recommended_roadmap.length > 0 ? (
                    <div className="roadmap-timeline">
                      {evaluationResult.explainer.recommended_roadmap.map((step, idx) => (
                        <div key={idx} className="roadmap-item">
                          <div className="roadmap-title">Phase {idx + 1}</div>
                          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>{step}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>No roadmap steps generated.</p>
                  )}
                </div>
              )}

              {/* Tab 3: Learning Materials */}
              {activeTab === 'resources' && (
                <div>
                  <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Annotated Learning Resources</h3>
                  
                  {evaluationResult.verification.annotated_resources && evaluationResult.verification.annotated_resources.length > 0 ? (
                    <div className="resource-list">
                      {evaluationResult.verification.annotated_resources.map((res, idx) => (
                        <div key={idx} className="resource-card">
                          <div className="resource-header">
                            <span className="resource-title">{res.resource}</span>
                            <span className="resource-skill">{formatSkillName(res.skill)}</span>
                          </div>
                          <span className="resource-desc">{res.description}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>No resources annotated.</p>
                  )}
                </div>
              )}

              {/* Tab 4: Search Context */}
              {activeTab === 'passages' && (
                <div>
                  <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Search Context Passages</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                    Passages retrieved from the Microsoft Learn MCP server and Azure Search index for syllabus grounding:
                  </p>

                  {evaluationResult.verification.search_context && evaluationResult.verification.search_context.length > 0 ? (
                    evaluationResult.verification.search_context.map((passage, idx) => (
                      <div key={idx} className="passage-card">
                        <div className="passage-meta">
                          <span>Source: <a href={passage.filename} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>{passage.filename.startsWith('http') ? 'Microsoft Learn Link' : passage.filename}</a></span>
                          <span style={{ textTransform: 'capitalize' }}>Category: {passage.category}</span>
                        </div>
                        <pre className="passage-content">{passage.content}</pre>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>No search context passages retrieved.</p>
                  )}
                </div>
              )}

              {/* Tab 5: Debate Trace */}
              {activeTab === 'debate' && (
                <div className="debate-trace-container">
                  <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Pipeline Reasoner & Debate Transcript</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                    Follow the reasoning loop across the 5 specialized agents that audited this learner's readiness:
                  </p>

                  <div className="debate-transcript">
                    {/* Agent 1 */}
                    <div className="debate-speech-bubble gap-extractor">
                      <div className="agent-avatar">🔍</div>
                      <div className="speech-content">
                        <div className="agent-meta">Agent 1: Gap Extractor</div>
                        <div className="agent-text">
                          <p><strong>Analysis:</strong> I compared {evaluationResult.learner_name}'s verified profile against the {evaluationResult.certification} requirement matrix.</p>
                          <ul>
                            <li><strong>Score Gap:</strong> {evaluationResult.gap_analysis.score_gap} missing elements.</li>
                            <li><strong>Weak Skills Pinpointed:</strong> {evaluationResult.gap_analysis.weak_skills.map(s => formatSkillName(s)).join(', ') || 'None!'}</li>
                            <li><strong>Calculated Budget:</strong> {evaluationResult.gap_analysis.study_hours} hours required to close the gap.</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Agent 2 */}
                    <div className="debate-speech-bubble verifier">
                      <div className="agent-avatar">🛡️</div>
                      <div className="speech-content">
                        <div className="agent-meta">Agent 2: Verifier Agent (MCP Grounded)</div>
                        <div className="agent-text">
                          <p><strong>Analysis:</strong> I ran validation checks on the weak skills using the <strong>Microsoft Learn MCP endpoint</strong> and Azure Search indexes.</p>
                          <p><strong>Status:</strong> {evaluationResult.verification.is_valid ? '✅ Gaps Validated Against Syllabus' : '⚠️ Gaps Discrepancy Found'}</p>
                          <p><strong>Details:</strong> {evaluationResult.verification.verification_details}</p>
                          <p><strong>Resources Matched:</strong> Loaded {evaluationResult.verification.annotated_resources ? evaluationResult.verification.annotated_resources.length : 0} study guides.</p>
                        </div>
                      </div>
                    </div>

                    {/* Agent 3 */}
                    <div className="debate-speech-bubble critic">
                      <div className="agent-avatar">⚖️</div>
                      <div className="speech-content">
                        <div className="agent-meta">Agent 3: Critic Agent</div>
                        <div className="agent-text">
                          <p><strong>Analysis:</strong> I ran an audit on the learning strategy and the hours budget.</p>
                          <p><strong>Findings:</strong> {evaluationResult.critic.criticism}</p>
                          <ul>
                            <li><strong>Score Gap Valid:</strong> {evaluationResult.critic.score_gap_valid ? 'Yes' : 'No'}</li>
                            <li><strong>Hours Realistic:</strong> {evaluationResult.critic.study_hours_realistic ? 'Yes' : 'No'}</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Agent 4 */}
                    <div className="debate-speech-bubble judge">
                      <div className="agent-avatar">🏛️</div>
                      <div className="speech-content">
                        <div className="agent-meta">Agent 4: Judge Agent</div>
                        <div className="agent-text">
                          <p><strong>Analysis:</strong> I examined the arguments from the Gap Extractor, Verifier, and Critic.</p>
                          <p><strong>Readiness Verdict:</strong> <span className={`verdict-text ${evaluationResult.judge.decision === 'Ready' ? 'ready' : 'not-ready'}`}>{evaluationResult.judge.decision}</span></p>
                          <p><strong>Confidence Metric:</strong> {(evaluationResult.judge.confidence * 100).toFixed(0)}%</p>
                          <p><strong>Justification Summary:</strong> {evaluationResult.judge.justification}</p>
                        </div>
                      </div>
                    </div>

                    {/* Agent 5 */}
                    <div className="debate-speech-bubble explainer">
                      <div className="agent-avatar">📝</div>
                      <div className="speech-content">
                        <div className="agent-meta">Agent 5: Explainer Agent</div>
                        <div className="agent-text">
                          <p><strong>Analysis:</strong> I formulated the final coaching recommendations and converted the pipeline's findings into a friendly, structured format.</p>
                          <p><strong>Action Plan Summary:</strong> {evaluationResult.explainer.report_summary}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Critic Side Note */}
              <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--color-warning)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Critic Audit Findings</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  <strong>Review:</strong> {evaluationResult.critic.criticism}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                  {evaluationResult.critic.suggestions.map((sug, idx) => (
                    <div key={idx} style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', color: '#fcd34d' }}>
                      💡 {sug}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>}
    </div>
  )
}

export default App
