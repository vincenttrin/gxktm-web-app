-- Migration Script: Migrate Legacy Academic Years to New School Year System
-- Database: Supabase (PostgreSQL)
-- Date: 2026-02-01
-- 
-- This script migrates the old academic_years table format to the new schema
-- with start_year, end_year, is_active, enrollment_open, transition_date, and created_at fields
--
-- IMPORTANT: Always backup your database before running migrations!
-- Run: pg_dump your_database > backup_before_migration.sql

-- ============================================================================
-- STEP 1: Add new columns if they don't exist
-- ============================================================================

-- Add start_year column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'academic_years' AND column_name = 'start_year'
    ) THEN
        ALTER TABLE academic_years ADD COLUMN start_year INTEGER;
        RAISE NOTICE 'Added column: start_year';
    ELSE
        RAISE NOTICE 'Column start_year already exists';
    END IF;
END $$;

-- Add end_year column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'academic_years' AND column_name = 'end_year'
    ) THEN
        ALTER TABLE academic_years ADD COLUMN end_year INTEGER;
        RAISE NOTICE 'Added column: end_year';
    ELSE
        RAISE NOTICE 'Column end_year already exists';
    END IF;
END $$;

-- Add is_active column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'academic_years' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE academic_years ADD COLUMN is_active BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added column: is_active';
    ELSE
        RAISE NOTICE 'Column is_active already exists';
    END IF;
END $$;

-- Add enrollment_open column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'academic_years' AND column_name = 'enrollment_open'
    ) THEN
        ALTER TABLE academic_years ADD COLUMN enrollment_open BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added column: enrollment_open';
    ELSE
        RAISE NOTICE 'Column enrollment_open already exists';
    END IF;
END $$;

-- Add transition_date column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'academic_years' AND column_name = 'transition_date'
    ) THEN
        ALTER TABLE academic_years ADD COLUMN transition_date DATE;
        RAISE NOTICE 'Added column: transition_date';
    ELSE
        RAISE NOTICE 'Column transition_date already exists';
    END IF;
END $$;

-- Add created_at column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'academic_years' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE academic_years ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added column: created_at';
    ELSE
        RAISE NOTICE 'Column created_at already exists';
    END IF;
END $$;

-- ============================================================================
-- STEP 2: Parse existing 'name' field to populate start_year and end_year
-- ============================================================================
-- This handles formats like:
--   "2025-2026" -> start_year=2025, end_year=2026
--   "2024-25"   -> start_year=2024, end_year=2025
--   "2025"      -> start_year=2025, end_year=2026

-- Update start_year from the name field
UPDATE academic_years
SET start_year = CASE
    -- Format: "2025-2026" or "2025-26" (extract first part)
    WHEN name ~ '^\d{4}-\d{2,4}$' THEN
        CAST(SPLIT_PART(name, '-', 1) AS INTEGER)
    -- Format: "2025" (single year)
    WHEN name ~ '^\d{4}$' THEN
        CAST(name AS INTEGER)
    -- Keep existing value if already set
    ELSE start_year
END
WHERE start_year IS NULL AND name IS NOT NULL;

-- Update end_year from the name field
UPDATE academic_years
SET end_year = CASE
    -- Format: "2025-2026" (full 4-digit end year)
    WHEN name ~ '^\d{4}-\d{4}$' THEN
        CAST(SPLIT_PART(name, '-', 2) AS INTEGER)
    -- Format: "2025-26" (2-digit end year, need to calculate full year)
    WHEN name ~ '^\d{4}-\d{2}$' THEN
        CAST(
            CONCAT(
                LEFT(SPLIT_PART(name, '-', 1), 2),  -- Century from start year (e.g., "20")
                SPLIT_PART(name, '-', 2)             -- Two-digit year (e.g., "26")
            ) AS INTEGER
        )
    -- Format: "2025" (single year, end year is start + 1)
    WHEN name ~ '^\d{4}$' THEN
        CAST(name AS INTEGER) + 1
    -- Keep existing value if already set
    ELSE end_year
END
WHERE end_year IS NULL AND name IS NOT NULL;

-- ============================================================================
-- STEP 3: Set is_active based on is_current (legacy field) or date logic
-- ============================================================================

-- First, copy is_current to is_active for any years marked as current
UPDATE academic_years
SET is_active = is_current
WHERE is_active = FALSE AND is_current = TRUE;

-- If no year is marked as active, determine based on current date (Feb 2026)
-- A school year is active if we're between its start (July of start_year) and end (June of end_year)
DO $$
DECLARE
    active_count INTEGER;
    current_date_val DATE := CURRENT_DATE;
    current_month INTEGER := EXTRACT(MONTH FROM CURRENT_DATE);
    current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
    target_start_year INTEGER;
BEGIN
    -- Count currently active years
    SELECT COUNT(*) INTO active_count FROM academic_years WHERE is_active = TRUE;
    
    IF active_count = 0 THEN
        -- Determine which school year should be active
        -- School years typically run from August/September to June
        -- If we're in Jan-June, we're in the year that started last year
        -- If we're in July-Dec, we're in the year that started this year
        IF current_month <= 6 THEN
            target_start_year := current_year - 1;
        ELSE
            target_start_year := current_year;
        END IF;
        
        -- Mark the appropriate year as active
        UPDATE academic_years
        SET is_active = TRUE
        WHERE start_year = target_start_year;
        
        RAISE NOTICE 'Marked school year starting % as active', target_start_year;
    ELSE
        RAISE NOTICE 'Found % active year(s), skipping auto-activation', active_count;
    END IF;
END $$;

-- ============================================================================
-- STEP 4: Set default transition_date (July 1 of start_year)
-- ============================================================================

UPDATE academic_years
SET transition_date = MAKE_DATE(start_year, 7, 1)
WHERE transition_date IS NULL AND start_year IS NOT NULL;

-- ============================================================================
-- STEP 5: Set created_at for existing records
-- ============================================================================

-- Use a deterministic timestamp based on start_year for older records
UPDATE academic_years
SET created_at = MAKE_TIMESTAMP(
    COALESCE(start_year, 2024),  -- Year
    1,                            -- Month (January)
    1,                            -- Day
    0,                            -- Hour
    0,                            -- Minute
    0                             -- Second
)
WHERE created_at IS NULL;

-- ============================================================================
-- STEP 6: Set enrollment_open based on year status
-- ============================================================================

-- Close enrollment for past years (archived)
UPDATE academic_years
SET enrollment_open = FALSE
WHERE end_year < EXTRACT(YEAR FROM CURRENT_DATE)
  AND enrollment_open = TRUE;

-- Keep enrollment open for current and upcoming years (can be adjusted manually)

-- ============================================================================
-- STEP 7: Ensure name field consistency
-- ============================================================================

-- Standardize name format to "YYYY-YYYY" for any records that might have inconsistent format
UPDATE academic_years
SET name = CONCAT(start_year::TEXT, '-', end_year::TEXT)
WHERE start_year IS NOT NULL 
  AND end_year IS NOT NULL
  AND name !~ '^\d{4}-\d{4}$';

-- ============================================================================
-- STEP 8: Verification queries
-- ============================================================================

-- Display migration results
DO $$
DECLARE
    total_count INTEGER;
    migrated_count INTEGER;
    active_count INTEGER;
    enrollment_open_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM academic_years;
    SELECT COUNT(*) INTO migrated_count FROM academic_years WHERE start_year IS NOT NULL AND end_year IS NOT NULL;
    SELECT COUNT(*) INTO active_count FROM academic_years WHERE is_active = TRUE;
    SELECT COUNT(*) INTO enrollment_open_count FROM academic_years WHERE enrollment_open = TRUE;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration Summary:';
    RAISE NOTICE '  Total academic years: %', total_count;
    RAISE NOTICE '  Successfully migrated: %', migrated_count;
    RAISE NOTICE '  Active years: %', active_count;
    RAISE NOTICE '  Years with enrollment open: %', enrollment_open_count;
    RAISE NOTICE '========================================';
END $$;

-- Show all migrated records (comment out in production)
SELECT 
    id,
    name,
    start_year,
    end_year,
    is_current AS legacy_is_current,
    is_active,
    enrollment_open,
    transition_date,
    created_at,
    CASE 
        WHEN end_year < EXTRACT(YEAR FROM CURRENT_DATE) THEN 'archived'
        WHEN is_active = TRUE THEN 'active'
        ELSE 'upcoming'
    END AS computed_status
FROM academic_years
ORDER BY start_year DESC;

-- ============================================================================
-- OPTIONAL: Create index for performance
-- ============================================================================

-- Index on start_year for faster "newest year" queries
CREATE INDEX IF NOT EXISTS idx_academic_years_start_year ON academic_years(start_year DESC);

-- Index on is_active for quick active year lookup
CREATE INDEX IF NOT EXISTS idx_academic_years_is_active ON academic_years(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- ROLLBACK SCRIPT (save separately in case needed)
-- ============================================================================
/*
-- To rollback this migration, run:

ALTER TABLE academic_years DROP COLUMN IF EXISTS start_year;
ALTER TABLE academic_years DROP COLUMN IF EXISTS end_year;
ALTER TABLE academic_years DROP COLUMN IF EXISTS is_active;
ALTER TABLE academic_years DROP COLUMN IF EXISTS enrollment_open;
ALTER TABLE academic_years DROP COLUMN IF EXISTS transition_date;
ALTER TABLE academic_years DROP COLUMN IF EXISTS created_at;

DROP INDEX IF EXISTS idx_academic_years_start_year;
DROP INDEX IF EXISTS idx_academic_years_is_active;
*/
