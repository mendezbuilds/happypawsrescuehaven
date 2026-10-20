SELECT column_name, udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('foster_volunteer_applications', 'foster_assignments')
  AND data_type = 'USER-DEFINED';
