-- Critical Database Performance Indexes for Smart Task Management System
-- These indexes will dramatically improve query performance for task statistics and listing

-- Index for task stats query: (creator_id OR assignee_id) AND is_deleted = false
CREATE INDEX IF NOT EXISTS idx_tasks_user_access_deleted 
ON tasks (creator_id, is_deleted) 
WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_tasks_assignee_deleted 
ON tasks (assignee_id, is_deleted) 
WHERE is_deleted = false AND assignee_id IS NOT NULL;

-- Composite index for task listing with common filters
CREATE INDEX IF NOT EXISTS idx_tasks_creator_status_priority 
ON tasks (creator_id, status, priority, is_deleted, created_at DESC) 
WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status_priority 
ON tasks (assignee_id, status, priority, is_deleted, created_at DESC) 
WHERE is_deleted = false AND assignee_id IS NOT NULL;

-- Index for project-based queries
CREATE INDEX IF NOT EXISTS idx_tasks_project_deleted_created 
ON tasks (project_id, is_deleted, created_at DESC) 
WHERE is_deleted = false;

-- Covering index for task stats - includes all needed columns
CREATE INDEX IF NOT EXISTS idx_tasks_stats_covering 
ON tasks (creator_id, assignee_id, is_deleted) 
INCLUDE (completed, status)
WHERE is_deleted = false;

-- Index for project members lookup (critical for JOIN performance)
CREATE INDEX IF NOT EXISTS idx_project_members_project_user 
ON project_members (project_id, user_id);

-- Index for projects owner lookup
CREATE INDEX IF NOT EXISTS idx_projects_owner_active 
ON projects (owner_id, is_active) 
WHERE is_active = true;

-- Update table statistics
ANALYZE tasks;
ANALYZE projects;
ANALYZE project_members;
ANALYZE users;
ANALYZE categories;