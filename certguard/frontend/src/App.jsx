import React, { useState, useEffect } from 'react'
import './App.css'
import ManagerDashboard from './ManagerDashboard'

const CERTIFICATIONS = [
  {
    id: "dp-203",
    name: "Azure Data Engineer Associate",
    required_skills: ["python", "sql", "azure", "databricks", "azure_data_factory", "azure_data_lake", "synapse"]
  },
  {
    id: "saa-c03",
    name: "AWS Certified Solutions Architect - Associate",
    required_skills: ["aws", "ec2", "s3", "rds", "vpc", "iam", "serverless"]
  },
  {
    id: "pcap",
    name: "Python Certified Associate Programmer (PCAP)",
    required_skills: ["python", "oop", "modules", "exceptions", "testing"]
  }
];

const ALL_SKILLS = [
  "python", "sql", "azure", "databricks", "azure_data_factory", "azure_data_lake", "synapse",
  "aws", "ec2", "s3", "rds", "vpc", "iam", "serverless",
  "oop", "modules", "exceptions", "testing"
];

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

function App() {
  const [learnerName, setLearnerName] = useState("Alice Developer");
  const [selectedCert, setSelectedCert] = useState(CERTIFICATIONS[0]);
  const [currentSkills, setCurrentSkills] = useState(["python", "sql", "testing"]);
  
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

  const selectCertById = (id) => {
    const cert = CERTIFICATIONS.find(c => c.id === id);
    setSelectedCert(cert);
    
    // Auto-fill some relevant skills to make it interactive and convenient
    if (id === "dp-203") {
      setCurrentSkills(["python", "sql", "testing"]);
    } else if (id === "saa-c03") {
      setCurrentSkills(["aws", "s3", "iam"]);
    } else if (id === "pcap") {
      setCurrentSkills(["python", "modules"]);
    }
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

    // Start fetching request in background
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

    // Step simulation times
    const stepTimes = [800, 1200, 1000, 800, 600];
    
    for (let step = 1; step <= 5; step++) {
      setCurrentStep(step);
      setStepStatuses(prev => {
        const next = [...prev];
        next[step - 1] = "active";
        return next;
      });

      // Wait for the duration of the current step
      await new Promise(resolve => setTimeout(resolve, stepTimes[step - 1]));

      setStepStatuses(prev => {
        const next = [...prev];
        next[step - 1] = "completed";
        return next;
      });
    }

    // Await API response if it hasn't completed yet
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

  // Radial dash offset calculation
  const getRadialOffset = (confidence) => {
    const radius = 32;
    const circumference = 2 * Math.PI * radius;
    return circumference - (confidence * circumference);
  };

  return (
    <div className="app-container">

      <header className="app-header">
        <div className="logo-container">
          <div className="logo-icon">CG</div>
          <div className="logo-text">
            <h1>CertGuard</h1>
            <p>Multi-Agent Certification Readiness System</p>
          </div>
        </div>
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* App-level view switcher */}
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
            <label className="form-label">Learner Name</label>
            <input 
              type="text" 
              className="form-input" 
              value={learnerName} 
              onChange={(e) => setLearnerName(e.target.value)} 
              placeholder="e.g. Alice Developer"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Target Certification</label>
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
                    style={{ borderRight: isRequired ? '2px solid rgba(168, 85, 247, 0.4)' : 'none' }}
                  >
                    <input 
                      type="checkbox" 
                      checked={isChecked} 
                      onChange={() => toggleSkill(skill)}
                    />
                    <div className="skill-checkbox-indicator" />
                    <span>{skill}</span>
                  </label>
                );
              })}
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
              * Purple right border indicates skill is required for selected certification.
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
                Processing Pipeline...
              </>
            ) : (
              <>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Run Assessment
              </>
            )}
          </button>

          {/* Doc Status Box */}
          <div className="doc-list-container">
            <label className="form-label">Available Certification Docs ({documents.length})</label>
            <div className="doc-list">
              {documents.length > 0 ? (
                documents.map(doc => (
                  <div key={doc.id} className="doc-item">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>{doc.filename}</span>
                  </div>
                ))
              ) : (
                <div className="doc-item" style={{ color: 'var(--text-muted)' }}>No docs found. Click Index search docs.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side Panel - Evaluation Results / Pipeline Progress */}
        <div className="glass-card" style={{ minHeight: '500px' }}>
          {/* 1. Pre-Run Empty State */}
          {!isEvaluating && !evaluationResult && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px', color: 'var(--text-secondary)' }}>
              <svg width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '16px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <h3>No Evaluation Session Active</h3>
              <p style={{ maxWidth: '400px', textAlign: 'center', fontSize: '14px' }}>
                Configure the learner profile and trigger the assessment to execute the 5-agent decision pipeline.
              </p>
            </div>
          )}

          {/* 2. Active Evaluating Stepper */}
          {isEvaluating && (
            <div>
              <h2 className="card-title">
                <div className="spinner" style={{ borderColor: 'rgba(168, 85, 247, 0.1)', borderTopColor: 'var(--color-primary)' }} />
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
                    <div className="step-name">Verifier Agent</div>
                    <div className="step-desc">Queries Azure AI Search for relevant syllabus resources and validates skills.</div>
                  </div>
                  <div className="step-status-text">
                    {stepStatuses[1] === "active" && "Searching Index..."}
                    {stepStatuses[1] === "completed" && "Completed"}
                    {stepStatuses[1] === "pending" && "Queued"}
                  </div>
                </div>

                <div className={`step-row ${stepStatuses[2]}`}>
                  <div className="step-icon">3</div>
                  <div className="step-details">
                    <div className="step-name">Critic Agent</div>
                    <div className="step-desc">Evaluates the study hours and checks if goals are realistic.</div>
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
                    <div className="step-desc">Reviews all insights and issues the final readiness verdict.</div>
                  </div>
                  <div className="step-status-text">
                    {stepStatuses[3] === "active" && "Judging..."}
                    {stepStatuses[3] === "completed" && "Completed"}
                    {stepStatuses[3] === "pending" && "Queued"}
                  </div>
                </div>

                <div className={`step-row ${stepStatuses[4]}`}>
                  <div className="step-icon">5</div>
                  <div className="step-details">
                    <div className="step-name">Explainer Agent</div>
                    <div className="step-desc">Assembles a customized timeline and feedback roadmap.</div>
                  </div>
                  <div className="step-status-text">
                    {stepStatuses[4] === "active" && "Generating Report..."}
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
              </div>

              {/* Tab 1: Overview */}
              {activeTab === 'overview' && (
                <div>
                  <div className="stats-grid">
                    <div className="stat-box">
                      <div className="stat-val" style={{ color: 'var(--color-danger)' }}>
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
                            <span className="resource-skill">{res.skill}</span>
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
                    Passages retrieved from the Azure AI Search index for context matching:
                  </p>

                  {evaluationResult.verification.search_context && evaluationResult.verification.search_context.length > 0 ? (
                    evaluationResult.verification.search_context.map((passage, idx) => (
                      <div key={idx} className="passage-card">
                        <div className="passage-meta">
                          <span>Source: <strong>{passage.filename}</strong></span>
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
