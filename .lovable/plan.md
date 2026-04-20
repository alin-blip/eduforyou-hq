
User said "go" after the status update — they want to continue with the next feature. The recommended next step was **Avatar upload pe Settings** (rapid, vizibil, no external dependencies).

Plan:

## Avatar Upload pe Settings

### Backend (migration)
1. Create public storage bucket `avatars` (5MB limit, image mime types)
2. RLS policies on `storage.objects`:
   - Public SELECT (avatars vizibile pentru toți)
   - INSERT/UPDATE/DELETE doar pe folder propriu (`auth.uid()::text = (storage.foldername(name))[1]`)

### Frontend (`src/pages/Settings.tsx`)
3. Înlocuiește input-ul `avatar_url` cu uploader:
   - Buton "Încarcă avatar" cu `<input type="file" accept="image/*">`
   - Validare client: max 5MB, doar imagini
   - Upload la `avatars/{user.id}/avatar-{timestamp}.{ext}` (timestamp evită cache)
   - `getPublicUrl` → setează `profile.avatar_url` automat și salvează în `profiles`
   - Loading state pe buton, toast success/error
   - Buton "Șterge avatar" dacă există unul
4. Păstrează preview-ul cu `Avatar` + fallback initials existente

### Tehnic
- Folosește `supabase.storage.from('avatars').upload()` cu `upsert: false` și nume unic
- Un singur fișier activ per user; la upload nou se șterge cel vechi opțional
- Avatar URL salvat în tabela `profiles` (rămâne flow-ul existent)

Estimat: 1 migration + 1 fișier editat (Settings.tsx).
