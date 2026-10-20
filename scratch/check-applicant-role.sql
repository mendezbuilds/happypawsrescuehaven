SELECT e.enumlabel AS value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'applicant_role'
ORDER BY e.enumsortorder;
