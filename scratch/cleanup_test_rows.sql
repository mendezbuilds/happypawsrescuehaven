-- Removes the throwaway rows created while diagnosing the adopters RLS/unique-email issue.
-- Anon key couldn't delete these itself (blocked by RLS), run as postgres in the SQL Editor.

DELETE FROM public.adoption_applications WHERE id = '220876d3-4183-48cc-8278-b13d1363f65a';
DELETE FROM public.adopters WHERE id = '71e21f3a-405a-480b-a351-dd6afd960079';
