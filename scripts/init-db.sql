-- =============================================================================
-- Trax — Init Script PostgreSQL
-- Executado automaticamente pelo Docker na primeira inicialização.
-- =============================================================================

-- Extensão para UUIDs nativos
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extensão para busca em texto (futura feature de busca de relatórios)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Configurações de performance para desenvolvimento
-- (Em produção, ajustar via postgresql.conf gerenciado)
ALTER SYSTEM SET log_min_duration_statement = '200ms';
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
