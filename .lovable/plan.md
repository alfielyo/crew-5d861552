

## Problem

The "Forgot password?" link on `/login` currently links to `/login` (itself), so nothing happens. There's no forgot password flow or reset password page.

## Plan

### 1. Create `/forgot-password` page
A simple page with an email input that calls `supabase.auth.resetPasswordForEmail()` with `redirectTo` pointing to `/reset-password`. Matches the app's minimalistic style (PageShell, same form styling).

### 2. Create `/reset-password` page
A public page where users land after clicking the reset link in their email. It:
- Listens for the `PASSWORD_RECOVERY` auth event via `onAuthStateChange`
- Shows a new password form (with confirmation field)
- Calls `supabase.auth.updateUser({ password })` to set the new password
- Enforces the existing password complexity rules (8+ chars, uppercase, lowercase, number, special char)
- Redirects to `/login` on success

### 3. Update Login page
Change the "Forgot password?" `<Link to="/login">` to `<Link to="/forgot-password">`.

### 4. Add routes in App.tsx
Add two public routes: `/forgot-password` and `/reset-password`.

