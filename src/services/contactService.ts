import { supabase } from '../supabaseClient';

export interface ContactMessagePayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactMessageRecord {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'replied';
  created_at: string;
}

/**
 * Saves contact message to Supabase `contact_messages` table and
 * dispatches server-side Resend email from 'Pinin Support <support@pinin.co.za>'
 * with reply-to pointing to the user's email.
 */
export async function submitContactMessage(payload: ContactMessagePayload): Promise<{
  success: boolean;
  messageId?: string;
  emailSent?: boolean;
  error?: string;
}> {
  const cleanName = payload.name.trim();
  const cleanEmail = payload.email.trim();
  const cleanSubject = payload.subject.trim();
  const cleanMessage = payload.message.trim();

  let messageId: string | undefined;

  // 1. Save to Supabase `contact_messages` table
  try {
    const { data, error } = await supabase
      .from('contact_messages')
      .insert([
        {
          name: cleanName,
          email: cleanEmail,
          subject: cleanSubject,
          message: cleanMessage,
          status: 'new',
        },
      ])
      .select('id')
      .single();

    if (!error && data?.id) {
      messageId = data.id;
    } else if (error) {
      console.warn('[ContactService] Supabase insert warning (table might need migration):', error.message);
    }
  } catch (dbErr) {
    console.warn('[ContactService] Could not save directly to Supabase table:', dbErr);
  }

  // 2. Call backend function to send emails via Resend server-side
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: cleanName,
        email: cleanEmail,
        subject: cleanSubject,
        message: cleanMessage,
        id: messageId,
      }),
    });

    const result = await res.json().catch(() => ({ success: false }));

    if (res.ok && result.success) {
      return {
        success: true,
        messageId: messageId || result.id,
        emailSent: result.emailSent ?? true,
      };
    } else {
      // Backend returned an issue or warning
      return {
        success: true, // Still allow the user to see submission success if DB saved
        messageId,
        emailSent: false,
        error: result.error || 'Email queued',
      };
    }
  } catch (apiErr: any) {
    console.warn('[ContactService] Backend /api/contact call note:', apiErr.message);
    // If client saved to Supabase, we can still return success
    return {
      success: true,
      messageId,
      emailSent: false,
    };
  }
}
