import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

// API services
import { getEvaluation, analyzeEvaluation, simulateEvaluation, downloadReport } from '../services/api/evaluations.js';
import { getRequirements } from '../services/api/requirements.js';
import { getVendors } from '../services/api/vendors.js';
import { getProposalsByEvaluation, getProposalStatus, getEmbeddingStatus } from '../services/api/proposals.js';

// UI primitives
import { useToast } from '../components/ui/ToastContext.jsx';
import LoadingState, { AnalysisLoadingState } from '../components/ui/LoadingState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';

// Layout evaluation components
import EvalHeader from '../components/evaluation/EvalHeader.jsx';
import RequirementsPanel from '../components/evaluation/RequirementsPanel.jsx';
import VendorsPanel from '../components/evaluation/VendorsPanel.jsx';
import StickyNav from '../components/layout/StickyNav.jsx';

// Analysis components
import AnalysisTrigger from '../components/analysis/AnalysisTrigger.jsx';
import DecisionSummary from '../components/analysis/DecisionSummary.jsx';
import VendorComparisonTable from '../components/analysis/VendorComparisonTable.jsx';
import RiskPanel from '../components/analysis/RiskPanel.jsx';
import EvidencePanel from '../components/analysis/EvidencePanel.jsx';
import NegotiationPanel from '../components/analysis/NegotiationPanel.jsx';

// Simulator
import SimulatorCard from '../components/simulator/SimulatorCard.jsx';

// Report
import ReportCard from '../components/reports/ReportCard.jsx';

// RAG
import ProcurementCopilot from '../components/analysis/ProcurementCopilot.jsx';

// ─── Priority / Scenario constants ───────────────────────────────────────────

const PRESETS = {
  'Balanced':       { requirements: 50, cost: 30, risk: 20 },
  'Quality First':  { requirements: 70, cost: 15, risk: 15 },
  'Cost Optimized': { requirements: 20, cost: 60, risk: 20 },
  'Risk Averse':    { requirements: 30, cost: 20, risk: 50 },
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EvaluationDetail() {
  const { id } = useParams();
  const { addToast } = useToast();

  // Core data
  const [evaluation, setEvaluation] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [chunkCounts, setChunkCounts] = useState({});
  const [embedCounts, setEmbedCounts] = useState({});

  // Page state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Analysis state
  const [graphLoading, setGraphLoading] = useState(false);
  const [graphResult, setGraphResult] = useState(null);
  const [simulationResult, setSimulationResult] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState(null);

  // Priority / scenario state
  const [priorities, setPriorities] = useState({ requirements: 50, cost: 30, risk: 20 });
  const [selectedScenario, setSelectedScenario] = useState('Balanced');

  // ─── Data fetch ─────────────────────────────────────────────────────────────

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const [evalData, reqData, vendorData, propData] = await Promise.all([
        getEvaluation(id),
        getRequirements(id),
        getVendors(id),
        getProposalsByEvaluation(id),
      ]);
      setEvaluation(evalData);
      setRequirements(reqData);
      setVendors(vendorData);
      setProposals(propData);

      // Fetch chunk/embed counts for completed proposals
      const cCounts = {};
      const eCounts = {};
      for (const p of propData) {
        if (p.processing_status === 'completed') {
          try {
            const statusData = await getProposalStatus(p.id);
            cCounts[p.id] = statusData.chunk_count;
            const embedData = await getEmbeddingStatus(p.id);
            eCounts[p.id] = embedData.embedded_chunks;
          } catch (e) {
            // silently ignore per-proposal status errors
          }
        }
      }
      setChunkCounts(cCounts);
      setEmbedCounts(eCounts);
    } catch (err) {
      setError({
        message: err.response?.data?.detail || 'Failed to load evaluation data.',
        status: err.response?.status,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  // ─── Priority helpers ────────────────────────────────────────────────────────

  const handlePriorityChange = (field, rawValue) => {
    const val = Math.min(100, Math.max(0, parseInt(rawValue) || 0));
    setSelectedScenario('Custom');
    setPriorities(prev => {
      const remaining = 100 - val;
      const others = Object.keys(prev).filter(k => k !== field);
      const [o1, o2] = others;
      const currentOtherTotal = prev[o1] + prev[o2];
      let newO1, newO2;
      if (currentOtherTotal === 0) {
        newO1 = Math.floor(remaining / 2);
        newO2 = remaining - newO1;
      } else {
        newO1 = Math.round((prev[o1] / currentOtherTotal) * remaining);
        newO2 = remaining - newO1;
      }
      return { ...prev, [field]: val, [o1]: newO1, [o2]: newO2 };
    });
  };

  const handleScenarioChange = async (scenarioName) => {
    setSelectedScenario(scenarioName);
    const newP = PRESETS[scenarioName];
    if (!newP) return;
    const oldP = priorities;
    setPriorities(newP);
    // Auto-simulate if we already have a result
    if (newP.requirements + newP.cost + newP.risk === 100 && graphResult) {
      try {
        setSimulating(true);
        const res = await simulateEvaluation(id, newP, oldP);
        setSimulationResult(res);
      } catch (err) {
        addToast('Simulation failed.', 'error');
      } finally {
        setSimulating(false);
      }
    }
  };

  // Re-simulate when slider changes and we have a graph result
  const handleSliderChange = async (field, rawValue) => {
    const val = Math.min(100, Math.max(0, parseInt(rawValue) || 0));
    setSelectedScenario('Custom');
    let newP;
    setPriorities(prev => {
      const remaining = 100 - val;
      const others = Object.keys(prev).filter(k => k !== field);
      const [o1, o2] = others;
      const currentOtherTotal = prev[o1] + prev[o2];
      let newO1, newO2;
      if (currentOtherTotal === 0) {
        newO1 = Math.floor(remaining / 2);
        newO2 = remaining - newO1;
      } else {
        newO1 = Math.round((prev[o1] / currentOtherTotal) * remaining);
        newO2 = remaining - newO1;
      }
      newP = { ...prev, [field]: val, [o1]: newO1, [o2]: newO2 };
      return newP;
    });
  };

  // ─── Analysis ────────────────────────────────────────────────────────────────

  const handleRunAnalysis = async () => {
    const total = priorities.requirements + priorities.cost + priorities.risk;
    if (total !== 100) {
      addToast(`Priorities must sum to 100%. Current sum is ${total}%.`, 'warning');
      return;
    }
    
    // Prevent premature analysis
    if (hasPendingProposals) {
      addToast('Proposal processing is still in progress. Please wait until it is ready.', 'warning');
      return;
    }
    
    try {
      setGraphLoading(true);
      setGraphResult(null);
      setSimulationResult(null);
      const result = await analyzeEvaluation(id, 'Run a full procurement analysis comparing all vendors.', priorities);
      setGraphResult(result);
      addToast('Procurement analysis complete.', 'success');
    } catch (err) {
      const status = err.response?.status;
      if (status === 429) {
        addToast('AI rate limit reached. Please wait before running analysis again.', 'warning');
      } else {
        addToast(err.response?.data?.detail || 'Analysis failed. Please try again.', 'error');
      }
    } finally {
      setGraphLoading(false);
    }
  };

  // ─── Report ──────────────────────────────────────────────────────────────────

  const handleDownloadReport = async () => {
    setGeneratingReport(true);
    setReportError(null);
    try {
      await downloadReport(id);
      addToast('Report downloaded successfully.', 'success');
    } catch (err) {
      const status = err.response?.status;
      const msg = status === 429
        ? 'AI rate limit reached. Please wait before generating a report.'
        : 'Unable to generate report. Please check that the API server is running.';
      setReportError(msg);
      addToast(msg, 'error');
    } finally {
      setGeneratingReport(false);
    }
  };

  // ─── Render guards ───────────────────────────────────────────────────────────

  if (loading) return <LoadingState message="Loading evaluation..." />;
  if (error) return <ErrorState statusCode={error.status} message={error.message} onRetry={fetchData} />;
  if (!evaluation) return <ErrorState message="Evaluation not found." />;

  const prioritiesValid = priorities.requirements + priorities.cost + priorities.risk === 100;
  const displayResult = simulationResult || graphResult;
  // A proposal is pending if it's not ready and not explicitly failed
  const hasPendingProposals = proposals.some(p => p.processing_status !== 'ready' && p.processing_status !== 'failed');
  const recVendorId = displayResult ? (displayResult.recommended_vendor_id || (displayResult.ranking && displayResult.ranking[0])) : null;

  // Build vendor_id → proposal_id map for evidence traceability.
  // Uses the most recently uploaded proposal for each vendor.
  const vendorProposalMap = {};
  proposals.forEach(p => {
    // Only map proposals that have been processed (have extractable evidence)
    if (p.processing_status === 'ready' || p.processing_status === 'completed') {
      vendorProposalMap[p.vendor_id] = p.id;
    }
  });


  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <EvalHeader
        evaluation={evaluation}
        vendors={vendors}
        requirements={requirements}
        proposals={proposals}
        graphLoading={graphLoading}
        generatingReport={generatingReport}
        graphResult={graphResult}
        prioritiesValid={prioritiesValid}
        onRunAnalysis={handleRunAnalysis}
        onDownloadReport={handleDownloadReport}
      />

      {/* Analysis trigger (always visible — for setting priorities before running) */}
      {!graphResult && (
        <AnalysisTrigger
          priorities={priorities}
          selectedScenario={selectedScenario}
          onPriorityChange={handlePriorityChange}
          onScenarioChange={handleScenarioChange}
          onRunAnalysis={handleRunAnalysis}
          graphLoading={graphLoading}
        />
      )}

      {/* Analysis loading */}
      {graphLoading && <AnalysisLoadingState />}

      {/* Analysis results — shown once graphResult exists */}
      {graphResult && displayResult && (
        <>
          <StickyNav sections={[
            { id: 'section-decision', label: 'Decision Summary' },
            { id: 'section-comparison', label: 'Compare Vendors' },
            { id: 'section-simulator', label: 'Simulator' },
            { id: 'section-risks', label: 'Risk Assessment' },
            { id: 'section-evidence', label: 'Evidence' },
            { id: 'section-negotiation', label: 'Negotiation' },
            { id: 'section-setup', label: 'Setup' }
          ]} />

          <div className="space-y-6">
            <div id="section-decision" className="scroll-mt-20">
              <DecisionSummary
                data={displayResult}
                baseResult={graphResult}
                vendors={vendors}
                vendorProposalMap={vendorProposalMap}
              />
            </div>

            <div id="section-comparison" className="scroll-mt-20">
              <VendorComparisonTable
                data={displayResult}
                vendors={vendors}
              />
            </div>

            <div id="section-simulator" className="scroll-mt-20">
              <SimulatorCard
                result={displayResult}
                baseResult={graphResult}
                vendors={vendors}
                simulating={simulating}
                priorities={priorities}
                selectedScenario={selectedScenario}
                onPriorityChange={handleSliderChange}
                onScenarioChange={handleScenarioChange}
              />
            </div>

            <div id="section-risks" className="scroll-mt-20">
              <RiskPanel
                risks={graphResult.risks || []}
                vendors={vendors}
                vendorProposalMap={vendorProposalMap}
              />
            </div>

            <div id="section-evidence" className="scroll-mt-20">
              <EvidencePanel
                baseResult={graphResult}
                vendors={vendors}
                vendorProposalMap={vendorProposalMap}
              />
            </div>

            <div id="section-negotiation" className="scroll-mt-20">
              <NegotiationPanel
                negotiation={graphResult.negotiation || []}
                vendors={vendors}
                recVendorId={recVendorId}
              />
            </div>


            <ReportCard
              evaluation={evaluation}
              graphResult={graphResult}
              generatingReport={generatingReport}
              onDownload={handleDownloadReport}
              reportError={reportError}
            />
          </div>
        </>
      )}

      {/* Setup sections — Requirements & Vendors (always accessible) */}
      <div id="section-setup" className="grid grid-cols-1 xl:grid-cols-2 gap-6 pt-2 scroll-mt-20">
        <RequirementsPanel
          evaluationId={id}
          requirements={requirements}
          setRequirements={setRequirements}
        />
        <VendorsPanel
          evaluationId={id}
          vendors={vendors}
          setVendors={setVendors}
          proposals={proposals}
          setProposals={setProposals}
          chunkCounts={chunkCounts}
          setChunkCounts={setChunkCounts}
          embedCounts={embedCounts}
          setEmbedCounts={setEmbedCounts}
        />
      </div>

      {/* Procurement Copilot (Floating Assistant) */}
      <ProcurementCopilot 
        evaluationId={id} 
        vendors={vendors} 
        hasPendingProposals={hasPendingProposals}
        vendorProposalMap={vendorProposalMap}
      />
    </div>
  );
}
