-- =================================================================
--  MIRRA CLAIMS DASHBOARD - DATABASE SCHEMA
--  Target Dialect: PostgreSQL (for Neon)
-- =================================================================

-- Drop tables in reverse order of creation to handle dependencies
DROP TABLE IF EXISTS team_report_configurations;
DROP TABLE IF EXISTS claim_note_rules;
DROP TABLE IF EXISTS claim_edit_rules;
DROP TABLE IF EXISTS client_team_associations;
DROP TABLE IF EXISTS column_configurations;
DROP TABLE IF EXISTS claim_categories;
DROP TABLE IF EXISTS teams;

-- =================================================================
--  TABLE: teams
--  Stores the operational teams.
-- =================================================================
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    team_name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =================================================================
--  TABLE: claim_categories
--  Stores work categories, linked to a team.
-- =================================================================
CREATE TABLE claim_categories (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL,
    team_id INT,
    send_to_l1_monitor BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- If a team is deleted, the category becomes unassigned (team_id = NULL).
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
);

-- =================================================================
--  TABLE: column_configurations
--  Stores the master configuration for each client, including mappings.
-- =================================================================
CREATE TABLE column_configurations (
    id SERIAL PRIMARY KEY,
    config_name VARCHAR(255) NOT NULL UNIQUE,
    config_data JSONB, -- JSONB is more efficient for querying than JSON
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =================================================================
--  TABLE: client_team_associations
--  Many-to-many link between clients (configurations) and teams.
-- =================================================================
CREATE TABLE client_team_associations (
    config_id INT NOT NULL,
    team_id INT NOT NULL,
    
    -- Ensures a client can only be associated with a team once.
    PRIMARY KEY (config_id, team_id),
    
    -- If a configuration is deleted, all its associations are removed.
    FOREIGN KEY (config_id) REFERENCES column_configurations(id) ON DELETE CASCADE,
    
    -- If a team is deleted, all its associations are removed.
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- =================================================================
--  TABLE: claim_edit_rules
--  Stores categorization rules based on 'claim edits'.
-- =================================================================
CREATE TABLE claim_edit_rules (
    id SERIAL PRIMARY KEY,
    config_id INT NOT NULL,
    category_id INT NOT NULL,
    edit_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- A single edit text can only map to one category per client config.
    UNIQUE (config_id, edit_text),
    
    -- If a configuration is deleted, all its rules are deleted.
    FOREIGN KEY (config_id) REFERENCES column_configurations(id) ON DELETE CASCADE,
    
    -- If a category is deleted, all rules pointing to it are deleted.
    FOREIGN KEY (category_id) REFERENCES claim_categories(id) ON DELETE CASCADE
);

-- =================================================================
--  TABLE: claim_note_rules
--  Stores categorization rules based on 'claim note keywords'.
-- =================================================================
CREATE TABLE claim_note_rules (
    id SERIAL PRIMARY KEY,
    config_id INT NOT NULL,
    category_id INT NOT NULL,
    note_keyword TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- A single note keyword can only map to one category per client config.
    UNIQUE (config_id, note_keyword),

    -- If a configuration is deleted, all its rules are deleted.
    FOREIGN KEY (config_id) REFERENCES column_configurations(id) ON DELETE CASCADE,
    
    -- If a category is deleted, all rules pointing to it are deleted.
    FOREIGN KEY (category_id) REFERENCES claim_categories(id) ON DELETE CASCADE
);

-- =================================================================
--  TABLE: team_report_configurations
--  Stores custom report layouts for a specific team/category combo.
-- =================================================================
CREATE TABLE team_report_configurations (
    id SERIAL PRIMARY KEY,
    team_id INT NOT NULL,
    category_id INT NOT NULL,
    report_config_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- A team/category pair can only have one report layout.
    UNIQUE (team_id, category_id),
    
    -- If a team is deleted, its report layouts are deleted.
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    
    -- If a category is deleted, its report layouts are deleted.
    FOREIGN KEY (category_id) REFERENCES claim_categories(id) ON DELETE CASCADE
);


-- =================================================================
--  INDEXES
--  Create indexes on foreign keys and commonly queried columns for performance.
-- =================================================================
CREATE INDEX idx_claim_categories_team_id ON claim_categories(team_id);
CREATE INDEX idx_client_team_associations_config_id ON client_team_associations(config_id);
CREATE INDEX idx_client_team_associations_team_id ON client_team_associations(team_id);
CREATE INDEX idx_claim_edit_rules_config_id ON claim_edit_rules(config_id);
CREATE INDEX idx_claim_edit_rules_category_id ON claim_edit_rules(category_id);
CREATE INDEX idx_claim_note_rules_config_id ON claim_note_rules(config_id);
CREATE INDEX idx_claim_note_rules_category_id ON claim_note_rules(category_id);
CREATE INDEX idx_team_report_configurations_team_id ON team_report_configurations(team_id);
CREATE INDEX idx_team_report_configurations_category_id ON team_report_configurations(category_id);

-- =================================================================
--  END OF SCHEMA
-- =================================================================
