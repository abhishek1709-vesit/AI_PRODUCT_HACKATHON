CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    priority TEXT CHECK (priority IN ('must_have', 'nice_to_have', 'optional')),
    weight NUMERIC(5,4) DEFAULT 1.0,
    minimum_value TEXT,
    preferred_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_info TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    processing_status TEXT DEFAULT 'pending',
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS proposal_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE,
    page_number INTEGER,
    section TEXT,
    chunk_text TEXT NOT NULL,
    embedding VECTOR(384),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendor_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE,
    requirement_id UUID REFERENCES requirements(id) ON DELETE CASCADE,
    status TEXT,
    explanation TEXT,
    evidence TEXT,
    page_number INTEGER,
    section TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE,
    risk_type TEXT,
    description TEXT,
    severity TEXT,
    evidence TEXT,
    page_number INTEGER,
    section TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendor_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE,
    currency TEXT DEFAULT 'INR',
    subscription_cost NUMERIC,
    subscription_period TEXT,
    implementation_cost NUMERIC,
    support_cost NUMERIC,
    support_period TEXT,
    usage_cost NUMERIC,
    additional_costs NUMERIC,
    estimated_tco NUMERIC,
    is_estimated BOOLEAN DEFAULT TRUE,
    notes TEXT,
    evidence TEXT,
    page_number INTEGER,
    section TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE,
    recommended_vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    recommendation_score NUMERIC(5,2),
    summary TEXT,
    reasoning TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS negotiation_strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    strategy_details TEXT,
    clarification_questions JSONB,
    leverage_points JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_modtime ON users;
CREATE TRIGGER update_users_modtime
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_eval_modtime ON evaluations;
CREATE TRIGGER update_eval_modtime
BEFORE UPDATE ON evaluations
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_req_modtime ON requirements;
CREATE TRIGGER update_req_modtime
BEFORE UPDATE ON requirements
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_vend_modtime ON vendors;
CREATE TRIGGER update_vend_modtime
BEFORE UPDATE ON vendors
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_prop_modtime ON proposals;
CREATE TRIGGER update_prop_modtime
BEFORE UPDATE ON proposals
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_analysis_modtime ON vendor_analysis;
CREATE TRIGGER update_analysis_modtime
BEFORE UPDATE ON vendor_analysis
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_risks_modtime ON risks;
CREATE TRIGGER update_risks_modtime
BEFORE UPDATE ON risks
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_costs_modtime ON vendor_costs;
CREATE TRIGGER update_costs_modtime
BEFORE UPDATE ON vendor_costs
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_recs_modtime ON recommendations;
CREATE TRIGGER update_recs_modtime
BEFORE UPDATE ON recommendations
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_neg_modtime ON negotiation_strategies;
CREATE TRIGGER update_neg_modtime
BEFORE UPDATE ON negotiation_strategies
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE INDEX IF NOT EXISTS idx_evaluations_user_id
ON evaluations(user_id);

CREATE INDEX IF NOT EXISTS idx_requirements_evaluation_id
ON requirements(evaluation_id);

CREATE INDEX IF NOT EXISTS idx_vendors_evaluation_id
ON vendors(evaluation_id);

CREATE INDEX IF NOT EXISTS idx_proposals_vendor_id
ON proposals(vendor_id);

CREATE INDEX IF NOT EXISTS idx_proposals_evaluation_id
ON proposals(evaluation_id);

CREATE INDEX IF NOT EXISTS idx_chunks_proposal_id
ON proposal_chunks(proposal_id);

CREATE INDEX IF NOT EXISTS idx_chunks_vendor_id
ON proposal_chunks(vendor_id);

CREATE INDEX IF NOT EXISTS idx_chunks_evaluation_id
ON proposal_chunks(evaluation_id);

CREATE INDEX IF NOT EXISTS idx_analysis_vendor_id
ON vendor_analysis(vendor_id);

CREATE INDEX IF NOT EXISTS idx_analysis_requirement_id
ON vendor_analysis(requirement_id);

CREATE INDEX IF NOT EXISTS idx_risks_vendor_id
ON risks(vendor_id);

CREATE INDEX IF NOT EXISTS idx_costs_vendor_id
ON vendor_costs(vendor_id);

CREATE INDEX IF NOT EXISTS idx_recommendations_evaluation_id
ON recommendations(evaluation_id);

CREATE INDEX IF NOT EXISTS idx_negotiation_evaluation_id
ON negotiation_strategies(evaluation_id);
