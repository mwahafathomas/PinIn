import { supabase } from '../supabaseClient';

export interface BusinessInfo {
  id?: string;
  app_icon_url?: string;
  business_name: string;
  address: string;
  telephone_number: string;
  vat_no: string;
  reg_no: string;
  website: string;
  updated_at?: string;
}

const BUSINESS_INFO_STORAGE_KEY = 'pinin_business_info_cache_v1';

export const DEFAULT_BUSINESS_INFO: BusinessInfo = {
  app_icon_url: '/PinIn-app-icon.png',
  business_name: 'PinIn (Pty) Ltd',
  address: '100 West Street, Sandton, Johannesburg, 2196',
  telephone_number: '+27 (0) 11 883 0000',
  vat_no: '4920192834',
  reg_no: '2023/123456/07',
  website: 'www.pinin.co.za',
};

export function getCachedBusinessInfo(): BusinessInfo {
  try {
    const raw = localStorage.getItem(BUSINESS_INFO_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_BUSINESS_INFO, ...parsed };
      }
    }
  } catch {}
  return DEFAULT_BUSINESS_INFO;
}

export function saveCachedBusinessInfo(info: BusinessInfo): void {
  try {
    localStorage.setItem(BUSINESS_INFO_STORAGE_KEY, JSON.stringify(info));
  } catch {}
}

export async function fetchBusinessInfo(): Promise<BusinessInfo> {
  const cached = getCachedBusinessInfo();

  try {
    const { data, error } = await supabase
      .from('business_info')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      const resolved: BusinessInfo = {
        app_icon_url: data.app_icon_url || cached.app_icon_url || DEFAULT_BUSINESS_INFO.app_icon_url,
        business_name: data.business_name || cached.business_name || DEFAULT_BUSINESS_INFO.business_name,
        address: data.address || cached.address || DEFAULT_BUSINESS_INFO.address,
        telephone_number: data.telephone_number || cached.telephone_number || DEFAULT_BUSINESS_INFO.telephone_number,
        vat_no: data.vat_no || cached.vat_no || DEFAULT_BUSINESS_INFO.vat_no,
        reg_no: data.reg_no || cached.reg_no || DEFAULT_BUSINESS_INFO.reg_no,
        website: data.website || cached.website || DEFAULT_BUSINESS_INFO.website,
      };
      saveCachedBusinessInfo(resolved);
      return resolved;
    }
  } catch (e) {
    console.warn('[BusinessInfo] Notice loading business info:', e);
  }

  return cached;
}
