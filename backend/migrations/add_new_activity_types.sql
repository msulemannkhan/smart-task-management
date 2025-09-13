-- Migration to add new activity action types to the enum
-- This script adds the new activity types we introduced in the application

-- Add new values to the activity_action_type enum
-- Note: PostgreSQL doesn't allow direct modification of enums, so we need to use ALTER TYPE

-- First, check if the enum values already exist before adding them
DO $$ 
BEGIN
    -- Add CATEGORY_CREATED if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'category_created' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'activity_action_type')) THEN
        ALTER TYPE activity_action_type ADD VALUE IF NOT EXISTS 'category_created';
    END IF;

    -- Add CATEGORY_UPDATED if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'category_updated' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'activity_action_type')) THEN
        ALTER TYPE activity_action_type ADD VALUE IF NOT EXISTS 'category_updated';
    END IF;

    -- Add CATEGORY_DELETED if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'category_deleted' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'activity_action_type')) THEN
        ALTER TYPE activity_action_type ADD VALUE IF NOT EXISTS 'category_deleted';
    END IF;

    -- Add USER_SIGNED_IN if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'user_signed_in' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'activity_action_type')) THEN
        ALTER TYPE activity_action_type ADD VALUE IF NOT EXISTS 'user_signed_in';
    END IF;

    -- Add USER_SIGNED_OUT if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'user_signed_out' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'activity_action_type')) THEN
        ALTER TYPE activity_action_type ADD VALUE IF NOT EXISTS 'user_signed_out';
    END IF;

    -- Add USER_REGISTERED if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'user_registered' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'activity_action_type')) THEN
        ALTER TYPE activity_action_type ADD VALUE IF NOT EXISTS 'user_registered';
    END IF;

    -- Add USER_PROFILE_UPDATED if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'user_profile_updated' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'activity_action_type')) THEN
        ALTER TYPE activity_action_type ADD VALUE IF NOT EXISTS 'user_profile_updated';
    END IF;

    -- Add USER_AVATAR_UPDATED if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'user_avatar_updated' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'activity_action_type')) THEN
        ALTER TYPE activity_action_type ADD VALUE IF NOT EXISTS 'user_avatar_updated';
    END IF;

    -- Add PROJECT_DELETED if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'project_deleted' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'activity_action_type')) THEN
        ALTER TYPE activity_action_type ADD VALUE IF NOT EXISTS 'project_deleted';
    END IF;
END $$;

-- Verify the enum values were added
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'activity_action_type')
ORDER BY enumsortorder;