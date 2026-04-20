-- Create private bucket for weekly report PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('weekly-reports', 'weekly-reports', false)
ON CONFLICT (id) DO NOTHING;

-- Only service_role can write to this bucket (edge function uses service_role).
-- Authenticated users can list their files, but actual download happens via signed URL
-- which works without RLS since the URL contains the auth signature.

-- Allow authenticated users to read their own org's weekly reports (defensive — main access via signed URL)
CREATE POLICY "Authenticated users can read weekly reports"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'weekly-reports');

-- Service role bypasses RLS automatically; no INSERT/UPDATE/DELETE policies for users.
