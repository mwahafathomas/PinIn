# Resend SMTP Configuration for Supabase Auth

Your domain `pinin.co.za` is verified in Resend. To ensure all Supabase Auth verification codes and transactional emails are sent from `Pinin Marketplace <noreply@pinin.co.za>`, update your Supabase project settings:

---

### Step 1: Open Supabase Dashboard
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project (`ygkyxxrrfcvypcvmnzke`).
3. In the left sidebar, navigate to **Project Settings** (gear icon) &rarr; **Authentication** (or **Authentication** &rarr; **Email** / **Providers**).

---

### Step 2: Configure SMTP Settings
Scroll down to **SMTP Settings** (or **Custom SMTP**) and verify/update:

- **Sender Email**: `noreply@pinin.co.za` *(Change from `onboarding@resend.dev`)*
- **Sender Name**: `Pinin Marketplace`
- **Host**: `smtp.resend.com`
- **Port**: `465` (SSL) or `587` (TLS)
- **User**: `resend`
- **Password**: `re_...` *(Your Resend API Key)*

> **Important**: Setting **Sender Name** to `Pinin Marketplace` and **Sender Email** to `noreply@pinin.co.za` ensures all outgoing emails display:  
> `Pinin Marketplace <noreply@pinin.co.za>`.

---

### Step 3: Check Email Templates
In **Authentication** &rarr; **Email Templates**:
1. Confirm signup
2. Magic Link
3. Reset Password
4. Reauthentication

Ensure each template's **Subject** and header reflects **PinIn**, and that the Sender fields reflect `Pinin Marketplace <noreply@pinin.co.za>`.

---

### Step 4: Client & API Integration
The application's `src/services/emailService.ts` is configured with:
```typescript
export const RESEND_FROM_ADDRESS = 'Pinin Marketplace <noreply@pinin.co.za>';
export const RESEND_NOREPLY_EMAIL = 'noreply@pinin.co.za';
export const RESEND_SUPPORT_EMAIL = 'support@pinin.co.za';
```

If sending custom emails directly via Resend API from the application, add your key to `.env`:
```env
VITE_RESEND_API_KEY=re_your_api_key_here
```
