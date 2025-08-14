-- Migration: Add hierarchy tables for government structure
-- Date: 2024-12-19
-- Description: Adds tables for managing government hierarchy, positions, and appointments

-- Create enums
CREATE TYPE organization_type AS ENUM (
  'presidency',
  'parliament',
  'government',
  'ministry',
  'committee',
  'agency',
  'department',
  'division',
  'sector',
  'group',
  'regional_office',
  'local_administration'
);

CREATE TYPE hierarchy_level AS ENUM (
  'level_0',
  'level_1',
  'level_2',
  'level_3',
  'level_4',
  'level_5',
  'level_6'
);

CREATE TYPE position_type AS ENUM (
  'president',
  'prime_minister',
  'deputy_prime_minister',
  'minister',
  'deputy_minister',
  'chairman',
  'deputy_chairman',
  'head_of_department',
  'deputy_head_department',
  'head_of_division',
  'deputy_head_division',
  'head_of_sector',
  'leading_specialist',
  'chief_specialist',
  'senior_specialist',
  'specialist',
  'junior_specialist',
  'consultant',
  'advisor',
  'assistant'
);

CREATE TYPE civil_service_category AS ENUM (
  'political',
  'administrative',
  'corps_a',
  'corps_b',
  'corps_c'
);

CREATE TYPE civil_service_subcategory AS ENUM (
  'corps_a1', 'corps_a2', 'corps_a3',
  'corps_b1', 'corps_b2', 'corps_b3', 'corps_b4', 'corps_b5',
  'corps_c1', 'corps_c2', 'corps_c3', 'corps_c4'
);

-- Government structure table
CREATE TABLE government_structure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic information
  name VARCHAR(300) NOT NULL,
  name_kk VARCHAR(300),
  name_en VARCHAR(300),
  short_name VARCHAR(100),
  code VARCHAR(50) UNIQUE,
  
  -- Hierarchical structure
  parent_id UUID REFERENCES government_structure(id),
  level hierarchy_level NOT NULL,
  type organization_type NOT NULL,
  path TEXT, -- Materialized path for fast queries
  order_index INTEGER DEFAULT 0,
  
  -- Contact information
  description TEXT,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(255),
  
  -- Leadership
  head_user_id UUID REFERENCES users(id),
  deputy_head_user_id UUID REFERENCES users(id),
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  established_date TIMESTAMP,
  
  -- System fields
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Positions table
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic position information
  title VARCHAR(300) NOT NULL,
  title_kk VARCHAR(300),
  title_en VARCHAR(300),
  code VARCHAR(50) UNIQUE,
  
  -- Organization association
  organization_id UUID NOT NULL REFERENCES government_structure(id),
  
  -- Position classification
  type position_type NOT NULL,
  category civil_service_category NOT NULL,
  subcategory civil_service_subcategory,
  rank INTEGER,
  
  -- Hierarchical relationships
  reports_to_position_id UUID REFERENCES positions(id),
  is_managerial BOOLEAN DEFAULT false,
  can_manage_subordinates BOOLEAN DEFAULT false,
  can_assign_tasks BOOLEAN DEFAULT false,
  can_issue_disciplinary_actions BOOLEAN DEFAULT false,
  
  -- Position requirements
  description TEXT,
  requirements TEXT,
  responsibilities TEXT,
  min_experience INTEGER,
  salary_grade INTEGER,
  
  -- Quantitative limits
  max_positions INTEGER DEFAULT 1,
  is_unique BOOLEAN DEFAULT false,
  
  -- Position status
  is_active BOOLEAN DEFAULT true,
  established_date TIMESTAMP,
  abolished_date TIMESTAMP,
  
  -- System fields
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Appointments table (career history)
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  user_id UUID NOT NULL REFERENCES users(id),
  position_id UUID NOT NULL REFERENCES positions(id),
  organization_id UUID NOT NULL REFERENCES government_structure(id),
  
  -- Appointment details
  appointment_date TIMESTAMP NOT NULL,
  dismissal_date TIMESTAMP,
  is_current BOOLEAN DEFAULT true,
  
  -- Appointment type
  appointment_type VARCHAR(50) NOT NULL, -- permanent, temporary, acting
  appointment_order VARCHAR(100),
  dismissal_order VARCHAR(100),
  dismissal_reason VARCHAR(200),
  
  -- Additional information
  salary INTEGER,
  allowances TEXT, -- JSON
  working_conditions TEXT,
  
  -- System fields
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Delegations table
CREATE TABLE delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Delegation participants
  delegator_user_id UUID NOT NULL REFERENCES users(id),
  delegate_user_id UUID NOT NULL REFERENCES users(id),
  
  -- Delegation scope
  organization_id UUID REFERENCES government_structure(id),
  position_id UUID REFERENCES positions(id),
  
  -- Time frame
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  
  -- Delegated authorities
  permissions TEXT, -- JSON array of permissions
  restrictions TEXT,
  reason VARCHAR(500),
  
  -- System fields
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_government_structure_parent_id ON government_structure(parent_id);
CREATE INDEX idx_government_structure_path ON government_structure USING GIST(path gist_trgm_ops);
CREATE INDEX idx_government_structure_type ON government_structure(type);
CREATE INDEX idx_government_structure_level ON government_structure(level);
CREATE INDEX idx_government_structure_head_user_id ON government_structure(head_user_id);

CREATE INDEX idx_positions_organization_id ON positions(organization_id);
CREATE INDEX idx_positions_reports_to_position_id ON positions(reports_to_position_id);
CREATE INDEX idx_positions_type ON positions(type);
CREATE INDEX idx_positions_category ON positions(category);
CREATE INDEX idx_positions_is_managerial ON positions(is_managerial);

CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_position_id ON appointments(position_id);
CREATE INDEX idx_appointments_organization_id ON appointments(organization_id);
CREATE INDEX idx_appointments_is_current ON appointments(is_current);
CREATE INDEX idx_appointments_appointment_date ON appointments(appointment_date);

CREATE INDEX idx_delegations_delegator_user_id ON delegations(delegator_user_id);
CREATE INDEX idx_delegations_delegate_user_id ON delegations(delegate_user_id);
CREATE INDEX idx_delegations_is_active ON delegations(is_active);
CREATE INDEX idx_delegations_date_range ON delegations(start_date, end_date);

-- Create updated_at trigger functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_government_structure_updated_at
  BEFORE UPDATE ON government_structure
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_positions_updated_at
  BEFORE UPDATE ON positions
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_delegations_updated_at
  BEFORE UPDATE ON delegations
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Add constraint to ensure only one current appointment per user
CREATE UNIQUE INDEX idx_appointments_user_current 
ON appointments(user_id) 
WHERE is_current = true;

-- Add constraint to prevent self-delegation
ALTER TABLE delegations 
ADD CONSTRAINT chk_delegations_no_self_delegation 
CHECK (delegator_user_id != delegate_user_id);

-- Add constraint for position hierarchy (prevent circular references)
ALTER TABLE positions 
ADD CONSTRAINT chk_positions_no_self_reports 
CHECK (id != reports_to_position_id);

-- Function to update materialized path
CREATE OR REPLACE FUNCTION update_government_structure_path()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a root node
  IF NEW.parent_id IS NULL THEN
    NEW.path = '/' || NEW.id::text;
  ELSE
    -- Get parent's path and append current id
    SELECT path || '/' || NEW.id::text
    INTO NEW.path
    FROM government_structure
    WHERE id = NEW.parent_id;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update path
CREATE TRIGGER trigger_update_government_structure_path
  BEFORE INSERT OR UPDATE OF parent_id ON government_structure
  FOR EACH ROW EXECUTE PROCEDURE update_government_structure_path();

-- Function to cascade path updates
CREATE OR REPLACE FUNCTION cascade_path_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- Update all children's paths when parent path changes
  WITH RECURSIVE children AS (
    SELECT id, parent_id, NEW.path || '/' || id::text as new_path
    FROM government_structure
    WHERE parent_id = NEW.id
    
    UNION ALL
    
    SELECT gs.id, gs.parent_id, c.new_path || '/' || gs.id::text
    FROM government_structure gs
    JOIN children c ON gs.parent_id = c.id
  )
  UPDATE government_structure
  SET path = children.new_path,
      updated_at = NOW()
  FROM children
  WHERE government_structure.id = children.id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for cascading path updates
CREATE TRIGGER trigger_cascade_path_updates
  AFTER UPDATE OF path ON government_structure
  FOR EACH ROW 
  WHEN (OLD.path IS DISTINCT FROM NEW.path)
  EXECUTE PROCEDURE cascade_path_updates();
