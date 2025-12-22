-- This SQL script fixes mismatches between the attendance and attendance_history tables
-- Run this script whenever you notice that students marked as "Late" in the attendance table
-- cannot be marked as arrived because their status in the attendance_history table is not "late"

-- First, display the mismatch count
SELECT 'Mismatches found before fix: ' || COUNT(*) AS mismatch_count
FROM attendance a
LEFT JOIN attendance_history h ON a.user_id = h.student_id 
     AND h.attendance_date = CURRENT_DATE
WHERE a.today != 'Pending' 
  AND (h.status IS NULL OR LOWER(a.today) != h.status);

-- Fix the mismatches by updating attendance_history to match attendance
UPDATE attendance_history 
SET status = LOWER(a.today)
FROM attendance a
WHERE attendance_history.student_id = a.user_id
  AND attendance_history.attendance_date = CURRENT_DATE
  AND LOWER(a.today) != attendance_history.status
  AND a.today != 'Pending';

-- Insert missing records in attendance_history
INSERT INTO attendance_history (student_id, status, attendance_date, arrived_at, created_at)
SELECT a.user_id, LOWER(a.today), CURRENT_DATE, NULL, NOW()
FROM attendance a
LEFT JOIN attendance_history h ON a.user_id = h.student_id 
     AND h.attendance_date = CURRENT_DATE
WHERE h.id IS NULL AND a.today != 'Pending';

-- Verify the fix was successful
SELECT 'Mismatches remaining after fix: ' || COUNT(*) AS remaining_mismatches
FROM attendance a
LEFT JOIN attendance_history h ON a.user_id = h.student_id 
     AND h.attendance_date = CURRENT_DATE
WHERE a.today != 'Pending' 
  AND (h.status IS NULL OR LOWER(a.today) != h.status);

-- Show the final counts for today's attendance statuses
SELECT 'Current attendance counts by status:' AS info;

SELECT status, COUNT(*) 
FROM attendance_history 
WHERE attendance_date = CURRENT_DATE
GROUP BY status
ORDER BY status; 