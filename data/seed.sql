-- Seed data for Smart Task Management System
-- This script populates the database with sample data for development and testing

-- Insert sample organization
INSERT INTO organizations (id, name, slug, description, is_active, created_at, updated_at) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Demo Organization', 'demo-org', 'A demo organization for testing the task management system', true, NOW(), NOW());

-- Insert sample users
INSERT INTO users (id, supabase_id, email, username, full_name, avatar_url, bio, timezone, is_active, is_verified, is_superuser, created_at, updated_at, last_login_at, last_activity_at) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'demo-user-1', 'john.doe@example.com', 'johndoe', 'John Doe', 'https://api.dicebear.com/7.x/avataaars/svg?seed=john', 'Product Manager with 5+ years of experience', 'America/New_York', true, true, false, NOW(), NOW(), NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'demo-user-2', 'jane.smith@example.com', 'janesmith', 'Jane Smith', 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane', 'Senior Developer specializing in full-stack development', 'America/Los_Angeles', true, true, false, NOW(), NOW(), NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'demo-user-3', 'mike.wilson@example.com', 'mikewilson', 'Mike Wilson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike', 'UX Designer focused on user-centered design', 'Europe/London', true, true, false, NOW(), NOW(), NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'demo-user-4', 'sarah.brown@example.com', 'sarahbrown', 'Sarah Brown', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah', 'QA Engineer ensuring product quality', 'Asia/Tokyo', true, true, false, NOW(), NOW(), NOW(), NOW());

-- Add users to organization
INSERT INTO organization_users (id, organization_id, user_id, role, invited_by_id, joined_at, is_active) VALUES 
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'owner', NULL, NOW(), true),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002', 'admin', '550e8400-e29b-41d4-a716-446655440001', NOW(), true),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440003', 'member', '550e8400-e29b-41d4-a716-446655440001', NOW(), true),
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440004', 'member', '550e8400-e29b-41d4-a716-446655440001', NOW(), true);

-- Insert sample projects
INSERT INTO projects (id, organization_id, owner_id, name, slug, description, status, color, icon, start_date, due_date, is_public, is_archived, created_at, updated_at) VALUES 
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'Task Management App', 'task-management-app', 'Development of a modern task management application with real-time collaboration features', 'active', '#3B82F6', 'computer', NOW() - INTERVAL '30 days', NOW() + INTERVAL '60 days', false, false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002', 'Marketing Website', 'marketing-website', 'Company marketing website redesign with improved user experience', 'planning', '#10B981', 'globe', NOW() - INTERVAL '10 days', NOW() + INTERVAL '45 days', false, false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440003', 'Mobile App', 'mobile-app', 'Native mobile application for iOS and Android platforms', 'planning', '#F59E0B', 'smartphone', NOW() - INTERVAL '5 days', NOW() + INTERVAL '90 days', false, false, NOW(), NOW());

-- Add project members
INSERT INTO project_members (id, project_id, user_id, role, added_at) VALUES 
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440001', 'owner', NOW()),
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440002', 'admin', NOW()),
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440003', 'member', NOW()),
('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440004', 'member', NOW()),
('550e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440002', 'owner', NOW()),
('550e8400-e29b-41d4-a716-446655440035', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440003', 'admin', NOW()),
('550e8400-e29b-41d4-a716-446655440036', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440003', 'owner', NOW()),
('550e8400-e29b-41d4-a716-446655440037', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440002', 'member', NOW());

-- Insert sample categories
INSERT INTO categories (id, project_id, created_by_id, name, color, icon, description, position, created_at, updated_at) VALUES 
-- Task Management App categories
('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440001', 'Frontend', '#3B82F6', 'code', 'Frontend development tasks', 1, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440001', 'Backend', '#EF4444', 'server', 'Backend API and database tasks', 2, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440001', 'Design', '#8B5CF6', 'palette', 'UI/UX design tasks', 3, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440001', 'Testing', '#10B981', 'bug', 'Quality assurance and testing', 4, NOW(), NOW()),
-- Marketing Website categories
('550e8400-e29b-41d4-a716-446655440044', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440002', 'Content', '#F59E0B', 'file-text', 'Content creation and copywriting', 1, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440045', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440002', 'Development', '#3B82F6', 'code', 'Website development tasks', 2, NOW(), NOW()),
-- Mobile App categories
('550e8400-e29b-41d4-a716-446655440046', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440003', 'iOS', '#000000', 'smartphone', 'iOS development tasks', 1, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440047', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440003', 'Android', '#10B981', 'android', 'Android development tasks', 2, NOW(), NOW());

-- Insert sample tasks
INSERT INTO tasks (id, project_id, category_id, creator_id, assignee_id, parent_task_id, title, description, status, priority, start_date, due_date, estimated_hours, actual_hours, completed, completed_percentage, position, tags_json, created_at, updated_at, completed_at, started_at, first_assigned_at, last_activity_at, is_deleted, deleted_at, deleted_by_id, subtask_count, completed_subtasks, comment_count, attachment_count, watcher_count, view_count, version) VALUES 

-- Task Management App tasks
('550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', NULL, 'Implement Task Creation Modal', 'Create a modal component for adding new tasks with form validation and proper error handling', 'done', 'high', NOW() - INTERVAL '15 days', NOW() - INTERVAL '10 days', 8.0, 7.5, true, 100, 1.0, '["frontend", "modal", "forms"]', NOW() - INTERVAL '15 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '8 days', false, NULL, NULL, 0, 0, 3, 0, 2, 15, 1),

('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', NULL, 'Design Task Card Component', 'Design and implement reusable task card component with drag-and-drop functionality', 'in_progress', 'high', NOW() - INTERVAL '12 days', NOW() + INTERVAL '3 days', 12.0, 8.0, false, 65, 2.0, '["frontend", "component", "design"]', NOW() - INTERVAL '12 days', NOW() - INTERVAL '1 days', NULL, NOW() - INTERVAL '10 days', NOW() - INTERVAL '12 days', NOW() - INTERVAL '1 days', false, NULL, NULL, 2, 1, 5, 1, 3, 28, 2),

('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', NULL, 'API Endpoint for Task CRUD', 'Implement RESTful API endpoints for task creation, reading, updating, and deletion', 'done', 'critical', NOW() - INTERVAL '20 days', NOW() - INTERVAL '15 days', 16.0, 18.0, true, 100, 3.0, '["backend", "api", "crud"]', NOW() - INTERVAL '20 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '14 days', false, NULL, NULL, 4, 4, 7, 0, 4, 42, 1),

('550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', NULL, 'Database Schema Migration', 'Create and run database migrations for task management tables with proper indexes', 'done', 'urgent', NOW() - INTERVAL '25 days', NOW() - INTERVAL '20 days', 6.0, 5.5, true, 100, 4.0, '["backend", "database", "migration"]', NOW() - INTERVAL '25 days', NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days', NOW() - INTERVAL '19 days', false, NULL, NULL, 0, 0, 2, 0, 2, 18, 1),

('550e8400-e29b-41d4-a716-446655440104', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', NULL, 'User Interface Mockups', 'Create high-fidelity mockups for all main application screens including mobile responsiveness', 'in_progress', 'medium', NOW() - INTERVAL '8 days', NOW() + INTERVAL '7 days', 20.0, 12.0, false, 60, 5.0, '["design", "mockups", "ui"]', NOW() - INTERVAL '8 days', NOW() - INTERVAL '2 days', NULL, NOW() - INTERVAL '7 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '2 days', false, NULL, NULL, 3, 2, 4, 2, 2, 22, 1),

('550e8400-e29b-41d4-a716-446655440105', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', NULL, 'End-to-End Testing Setup', 'Set up Playwright for end-to-end testing with CI/CD integration', 'todo', 'medium', NOW() + INTERVAL '2 days', NOW() + INTERVAL '14 days', 10.0, 0.0, false, 0, 6.0, '["testing", "e2e", "playwright"]', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NULL, NULL, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', false, NULL, NULL, 0, 0, 1, 0, 1, 8, 1),

('550e8400-e29b-41d4-a716-446655440106', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', NULL, 'Real-time Updates with WebSocket', 'Implement WebSocket connection for real-time task updates across all connected clients', 'todo', 'high', NOW() + INTERVAL '5 days', NOW() + INTERVAL '18 days', 14.0, 0.0, false, 0, 7.0, '["frontend", "websocket", "realtime"]', NOW() - INTERVAL '1 days', NOW() - INTERVAL '1 days', NULL, NULL, NOW() - INTERVAL '1 days', NOW() - INTERVAL '1 days', false, NULL, NULL, 0, 0, 0, 0, 1, 5, 1),

-- Marketing Website tasks
('550e8400-e29b-41d4-a716-446655440107', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440044', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', NULL, 'Homepage Content Strategy', 'Develop content strategy and write copy for the new homepage design', 'in_progress', 'high', NOW() - INTERVAL '5 days', NOW() + INTERVAL '10 days', 8.0, 3.0, false, 40, 1.0, '["content", "strategy", "homepage"]', NOW() - INTERVAL '5 days', NOW(), NULL, NOW() - INTERVAL '3 days', NOW() - INTERVAL '5 days', NOW(), false, NULL, NULL, 0, 0, 2, 1, 1, 12, 1),

('550e8400-e29b-41d4-a716-446655440108', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440045', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', NULL, 'Responsive Landing Page', 'Build responsive landing page with modern design and optimized performance', 'todo', 'medium', NOW() + INTERVAL '3 days', NOW() + INTERVAL '20 days', 15.0, 0.0, false, 0, 2.0, '["development", "responsive", "landing"]', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NULL, NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', false, NULL, NULL, 0, 0, 0, 0, 1, 3, 1),

-- Mobile App tasks
('550e8400-e29b-41d4-a716-446655440109', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440046', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', NULL, 'iOS App Architecture Setup', 'Set up the iOS project structure with MVVM architecture and SwiftUI', 'todo', 'high', NOW() + INTERVAL '7 days', NOW() + INTERVAL '21 days', 12.0, 0.0, false, 0, 1.0, '["ios", "architecture", "swiftui"]', NOW(), NOW(), NULL, NULL, NOW(), NOW(), false, NULL, NULL, 0, 0, 0, 0, 1, 2, 1),

('550e8400-e29b-41d4-a716-446655440110', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440047', '550e8400-e29b-41d4-a716-446655440003', NULL, NULL, 'Android Development Planning', 'Research and plan Android development approach with Kotlin and Jetpack Compose', 'todo', 'medium', NOW() + INTERVAL '10 days', NOW() + INTERVAL '17 days', 6.0, 0.0, false, 0, 2.0, '["android", "planning", "kotlin"]', NOW(), NOW(), NULL, NULL, NULL, NOW(), false, NULL, NULL, 0, 0, 0, 0, 0, 1, 1);

-- Insert subtasks for some parent tasks
INSERT INTO tasks (id, project_id, category_id, creator_id, assignee_id, parent_task_id, title, description, status, priority, start_date, due_date, estimated_hours, actual_hours, completed, completed_percentage, position, tags_json, created_at, updated_at, completed_at, started_at, first_assigned_at, last_activity_at, is_deleted, deleted_at, deleted_by_id, subtask_count, completed_subtasks, comment_count, attachment_count, watcher_count, view_count, version) VALUES 

-- Subtasks for 'Design Task Card Component' (task 101)
('550e8400-e29b-41d4-a716-446655440200', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440101', 'Create wireframes for task card', 'Design low-fidelity wireframes for the task card layout and interactions', 'done', 'medium', NOW() - INTERVAL '12 days', NOW() - INTERVAL '9 days', 3.0, 2.5, true, 100, 1.0, '["design", "wireframe"]', NOW() - INTERVAL '12 days', NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days', NOW() - INTERVAL '9 days', false, NULL, NULL, 0, 0, 1, 0, 1, 8, 1),

('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440101', 'Implement drag and drop functionality', 'Add drag and drop behavior to task cards using react-beautiful-dnd', 'in_progress', 'high', NOW() - INTERVAL '6 days', NOW() + INTERVAL '2 days', 5.0, 3.0, false, 60, 2.0, '["frontend", "dnd"]', NOW() - INTERVAL '6 days', NOW() - INTERVAL '1 days', NULL, NOW() - INTERVAL '5 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '1 days', false, NULL, NULL, 0, 0, 2, 0, 2, 12, 1),

-- Subtasks for 'API Endpoint for Task CRUD' (task 102)
('550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440102', 'Create Task model and schema', 'Define SQLModel schema for tasks with proper relationships', 'done', 'critical', NOW() - INTERVAL '20 days', NOW() - INTERVAL '18 days', 4.0, 4.0, true, 100, 1.0, '["backend", "model"]', NOW() - INTERVAL '20 days', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '18 days', false, NULL, NULL, 0, 0, 1, 0, 1, 6, 1),

('550e8400-e29b-41d4-a716-446655440203', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440102', 'Implement GET /tasks endpoint', 'Create API endpoint to retrieve tasks with filtering and pagination', 'done', 'high', NOW() - INTERVAL '18 days', NOW() - INTERVAL '16 days', 3.0, 3.5, true, 100, 2.0, '["backend", "api", "get"]', NOW() - INTERVAL '18 days', NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days', NOW() - INTERVAL '16 days', false, NULL, NULL, 0, 0, 1, 0, 1, 4, 1),

('550e8400-e29b-41d4-a716-446655440204', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440102', 'Implement POST /tasks endpoint', 'Create API endpoint for task creation with validation', 'done', 'high', NOW() - INTERVAL '17 days', NOW() - INTERVAL '15 days', 4.0, 4.5, true, 100, 3.0, '["backend", "api", "post"]', NOW() - INTERVAL '17 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '17 days', NOW() - INTERVAL '17 days', NOW() - INTERVAL '15 days', false, NULL, NULL, 0, 0, 2, 0, 1, 7, 1),

('550e8400-e29b-41d4-a716-446655440205', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440102', 'Implement PUT and DELETE endpoints', 'Create API endpoints for task updates and deletion', 'done', 'medium', NOW() - INTERVAL '16 days', NOW() - INTERVAL '14 days', 5.0, 6.0, true, 100, 4.0, '["backend", "api", "put", "delete"]', NOW() - INTERVAL '16 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days', NOW() - INTERVAL '14 days', false, NULL, NULL, 0, 0, 3, 0, 1, 9, 1),

-- Subtasks for 'User Interface Mockups' (task 104)
('550e8400-e29b-41d4-a716-446655440206', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440104', 'Dashboard layout mockup', 'Create high-fidelity mockup for the main dashboard view', 'done', 'high', NOW() - INTERVAL '8 days', NOW() - INTERVAL '5 days', 6.0, 5.5, true, 100, 1.0, '["design", "dashboard"]', NOW() - INTERVAL '8 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '5 days', false, NULL, NULL, 0, 0, 2, 1, 1, 10, 1),

('550e8400-e29b-41d4-a716-446655440207', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440104', 'Task list view mockup', 'Design mockup for the kanban board and list view of tasks', 'done', 'high', NOW() - INTERVAL '6 days', NOW() - INTERVAL '3 days', 7.0, 6.5, true, 100, 2.0, '["design", "kanban"]', NOW() - INTERVAL '6 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '3 days', false, NULL, NULL, 0, 0, 1, 1, 1, 8, 1),

('550e8400-e29b-41d4-a716-446655440208', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440104', 'Mobile responsive mockups', 'Create mobile-first responsive mockups for all main screens', 'in_progress', 'medium', NOW() - INTERVAL '4 days', NOW() + INTERVAL '7 days', 7.0, 0.0, false, 0, 3.0, '["design", "mobile", "responsive"]', NOW() - INTERVAL '4 days', NOW() - INTERVAL '2 days', NULL, NOW() - INTERVAL '3 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '2 days', false, NULL, NULL, 0, 0, 1, 0, 1, 4, 1);

-- Update parent task counters
UPDATE tasks SET subtask_count = 2, completed_subtasks = 1 WHERE id = '550e8400-e29b-41d4-a716-446655440101';
UPDATE tasks SET subtask_count = 4, completed_subtasks = 4 WHERE id = '550e8400-e29b-41d4-a716-446655440102';
UPDATE tasks SET subtask_count = 3, completed_subtasks = 2 WHERE id = '550e8400-e29b-41d4-a716-446655440104';

-- Insert sample task comments
INSERT INTO task_comments (id, task_id, user_id, activity_type, content, field_name, old_value, new_value, parent_comment_id, bulk_operation_id, created_at, updated_at, is_deleted, deleted_at) VALUES 
('550e8400-e29b-41d4-a716-446655440300', '550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440002', 'comment', 'Great work on the modal implementation! The form validation is working perfectly.', NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '8 days', NULL, false, NULL),
('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440001', 'comment', 'Thanks! I also added some additional accessibility features for screen readers.', NULL, NULL, NULL, '550e8400-e29b-41d4-a716-446655440300', NULL, NOW() - INTERVAL '8 days', NULL, false, NULL),
('550e8400-e29b-41d4-a716-446655440302', '550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440003', 'status_change', NULL, 'status', 'in_progress', 'done', NULL, NULL, NOW() - INTERVAL '8 days', NULL, false, NULL),
('550e8400-e29b-41d4-a716-446655440303', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440003', 'comment', 'Working on the drag and drop functionality. Should have it ready by end of week.', NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '3 days', NULL, false, NULL),
('550e8400-e29b-41d4-a716-446655440304', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440001', 'comment', 'The design looks great so far! Love the hover effects you added.', NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '2 days', NULL, false, NULL),
('550e8400-e29b-41d4-a716-446655440305', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440001', 'comment', 'All CRUD endpoints are now implemented and tested. Ready for frontend integration.', NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '14 days', NULL, false, NULL);

-- Insert sample task watchers
INSERT INTO task_watchers (id, task_id, user_id, added_by_id, notify_on_comments, notify_on_status_change, notify_on_assignment, created_at) VALUES 
('550e8400-e29b-41d4-a716-446655440400', '550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', true, true, true, NOW() - INTERVAL '15 days'),
('550e8400-e29b-41d4-a716-446655440401', '550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', true, false, true, NOW() - INTERVAL '12 days'),
('550e8400-e29b-41d4-a716-446655440402', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', true, true, false, NOW() - INTERVAL '10 days'),
('550e8400-e29b-41d4-a716-446655440403', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', false, true, true, NOW() - INTERVAL '8 days'),
('550e8400-e29b-41d4-a716-446655440404', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', true, true, true, NOW() - INTERVAL '18 days');

-- Insert sample time entries
INSERT INTO time_entries (id, task_id, user_id, start_time, end_time, duration_minutes, description, is_billable, hourly_rate, created_at) VALUES 
('550e8400-e29b-41d4-a716-446655440500', '550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days' + INTERVAL '4 hours', 240, 'Initial modal component setup and structure', true, 85.00, NOW() - INTERVAL '15 days'),
('550e8400-e29b-41d4-a716-446655440501', '550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days' + INTERVAL '3 hours 30 minutes', 210, 'Form validation and error handling implementation', true, 85.00, NOW() - INTERVAL '12 days'),
('550e8400-e29b-41d4-a716-446655440502', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440003', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days' + INTERVAL '2 hours', 120, 'Design system research and component planning', false, 75.00, NOW() - INTERVAL '10 days'),
('550e8400-e29b-41d4-a716-446655440503', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days' + INTERVAL '6 hours', 360, 'Database schema design and API planning', true, 95.00, NOW() - INTERVAL '18 days');

-- Update task comment counts to match inserted comments
UPDATE tasks SET comment_count = 3 WHERE id = '550e8400-e29b-41d4-a716-446655440100';
UPDATE tasks SET comment_count = 2 WHERE id = '550e8400-e29b-41d4-a716-446655440101';
UPDATE tasks SET comment_count = 1 WHERE id = '550e8400-e29b-41d4-a716-446655440102';

-- Update task watcher counts
UPDATE tasks SET watcher_count = 2 WHERE id = '550e8400-e29b-41d4-a716-446655440100';
UPDATE tasks SET watcher_count = 2 WHERE id = '550e8400-e29b-41d4-a716-446655440101';
UPDATE tasks SET watcher_count = 1 WHERE id = '550e8400-e29b-41d4-a716-446655440102';

-- Update last activity timestamps for active tasks
UPDATE tasks SET last_activity_at = NOW() - INTERVAL '1 days' WHERE status = 'in_progress';
UPDATE tasks SET last_activity_at = NOW() - INTERVAL '3 hours' WHERE id = '550e8400-e29b-41d4-a716-446655440107';