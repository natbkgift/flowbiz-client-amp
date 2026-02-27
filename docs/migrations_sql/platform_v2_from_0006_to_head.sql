-- Running upgrade 0006_property_local_media -> 0007_identity_roles_refresh_tokens

CREATE TABLE roles (
    id CHAR(32) NOT NULL, 
    name VARCHAR(64) NOT NULL, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
    PRIMARY KEY (id), 
    CONSTRAINT uq_roles_name UNIQUE (name)
);

CREATE TABLE user_roles (
    id CHAR(32) NOT NULL, 
    user_id CHAR(32) NOT NULL, 
    role_id CHAR(32) NOT NULL, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
    FOREIGN KEY(role_id) REFERENCES roles (id) ON DELETE CASCADE, 
    CONSTRAINT uq_user_roles_user_role UNIQUE (user_id, role_id)
);

CREATE INDEX ix_user_roles_user_id ON user_roles (user_id);

CREATE INDEX ix_user_roles_role_id ON user_roles (role_id);

CREATE TABLE refresh_tokens (
    id CHAR(32) NOT NULL, 
    user_id CHAR(32) NOT NULL, 
    token_hash VARCHAR(64) NOT NULL, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
    expires_at DATETIME NOT NULL, 
    revoked_at DATETIME, 
    replaced_by_token_id CHAR(32), 
    PRIMARY KEY (id), 
    FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
    FOREIGN KEY(replaced_by_token_id) REFERENCES refresh_tokens (id), 
    CONSTRAINT uq_refresh_tokens_token_hash UNIQUE (token_hash)
);

CREATE INDEX ix_refresh_tokens_user_id ON refresh_tokens (user_id);

CREATE INDEX ix_refresh_tokens_expires_at ON refresh_tokens (expires_at);

UPDATE alembic_version SET version_num='0007_identity_roles_refresh_tokens' WHERE alembic_version.version_num = '0006_property_local_media';

-- Running upgrade 0007_identity_roles_refresh_tokens -> 0008_crm_inquiries_viewings

CREATE TABLE inquiries (
    id CHAR(32) NOT NULL, 
    property_id CHAR(32), 
    name VARCHAR(200) NOT NULL, 
    email VARCHAR(255), 
    phone VARCHAR(50), 
    message TEXT NOT NULL, 
    source_page VARCHAR(500), 
    status VARCHAR(32) DEFAULT 'new' NOT NULL, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(property_id) REFERENCES properties (id) ON DELETE SET NULL
);

CREATE INDEX ix_inquiries_property_id ON inquiries (property_id);

CREATE INDEX ix_inquiries_email ON inquiries (email);

CREATE INDEX ix_inquiries_created_at ON inquiries (created_at);

CREATE TABLE viewings (
    id CHAR(32) NOT NULL, 
    inquiry_id CHAR(32) NOT NULL, 
    scheduled_at DATETIME NOT NULL, 
    status VARCHAR(32) DEFAULT 'scheduled' NOT NULL, 
    notes VARCHAR(500), 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(inquiry_id) REFERENCES inquiries (id) ON DELETE CASCADE
);

CREATE INDEX ix_viewings_inquiry_id ON viewings (inquiry_id);

CREATE INDEX ix_viewings_scheduled_at ON viewings (scheduled_at);

UPDATE alembic_version SET version_num='0008_crm_inquiries_viewings' WHERE alembic_version.version_num = '0007_identity_roles_refresh_tokens';

-- Running upgrade 0008_crm_inquiries_viewings -> 0009_domain_agents_developers_areas

CREATE TABLE areas (
    id CHAR(32) NOT NULL, 
    name VARCHAR(200) NOT NULL, 
    slug VARCHAR(200) NOT NULL, 
    city VARCHAR(200), 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
    PRIMARY KEY (id), 
    CONSTRAINT uq_areas_slug UNIQUE (slug)
);

CREATE UNIQUE INDEX ix_areas_slug ON areas (slug);

CREATE TABLE developers (
    id CHAR(32) NOT NULL, 
    name VARCHAR(200) NOT NULL, 
    slug VARCHAR(200) NOT NULL, 
    website VARCHAR(500), 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
    PRIMARY KEY (id), 
    CONSTRAINT uq_developers_slug UNIQUE (slug)
);

CREATE UNIQUE INDEX ix_developers_slug ON developers (slug);

CREATE TABLE agents (
    id CHAR(32) NOT NULL, 
    name VARCHAR(200) NOT NULL, 
    email VARCHAR(255), 
    phone VARCHAR(50), 
    line_id VARCHAR(100), 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
    PRIMARY KEY (id)
);

CREATE INDEX ix_agents_email ON agents (email);

UPDATE alembic_version SET version_num='0009_domain_agents_developers_areas' WHERE alembic_version.version_num = '0008_crm_inquiries_viewings';

-- Running upgrade 0009_domain_agents_developers_areas -> 0010_investment_area_statistics

CREATE TABLE area_statistics (
    id CHAR(32) NOT NULL, 
    area_id CHAR(32) NOT NULL, 
    avg_price NUMERIC(14, 2), 
    avg_rent NUMERIC(14, 2), 
    roi_percent NUMERIC(8, 2), 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(area_id) REFERENCES areas (id) ON DELETE CASCADE, 
    CONSTRAINT uq_area_statistics_area_id UNIQUE (area_id)
);

CREATE UNIQUE INDEX ix_area_statistics_area_id ON area_statistics (area_id);

UPDATE alembic_version SET version_num='0010_investment_area_statistics' WHERE alembic_version.version_num = '0009_domain_agents_developers_areas';

-- Running upgrade 0010_investment_area_statistics -> 0011_compare_comparisons

CREATE TABLE comparisons (
    id CHAR(32) NOT NULL, 
    property_ids JSON NOT NULL, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
    PRIMARY KEY (id)
);

CREATE INDEX ix_comparisons_created_at ON comparisons (created_at);

UPDATE alembic_version SET version_num='0011_compare_comparisons' WHERE alembic_version.version_num = '0010_investment_area_statistics';

-- Running upgrade 0011_compare_comparisons -> 0012_analytics_events

CREATE TABLE analytics_events (
    id CHAR(32) NOT NULL, 
    event_type VARCHAR(64) NOT NULL, 
    payload JSON, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
    PRIMARY KEY (id)
);

CREATE INDEX ix_analytics_events_event_type ON analytics_events (event_type);

CREATE INDEX ix_analytics_events_created_at ON analytics_events (created_at);

UPDATE alembic_version SET version_num='0012_analytics_events' WHERE alembic_version.version_num = '0011_compare_comparisons';

