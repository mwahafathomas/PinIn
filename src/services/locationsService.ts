import { supabase } from '../supabaseClient';

export interface LocationItem {
  id: string;
  name: string;
  region: string;
  latitude?: number | null;
  longitude?: number | null;
}

export const DEFAULT_GAUTENG_LOCATIONS: string[] = [
  'Akasia',
  'Alberton',
  'Alexandra',
  'Atteridgeville',
  'Bedfordview',
  'Benoni',
  'Birchleigh',
  'Boksburg',
  'Brakpan',
  'Bronkhorstspruit',
  'Carletonville',
  'Centurion',
  'Clayville',
  'Cullinan',
  'Daveyton',
  'De Deur/Walkerville',
  'Devon',
  'Diepkloof',
  'Diepsloot',
  'Dunnottar',
  'Edenvale',
  'Eikenhof',
  'Ekangala',
  'Ennerdale',
  'Evaton',
  'Fochville',
  'Ga-Rankuwa',
  'Garsfontein',
  'Geduld',
  'Germiston',
  'Hammanskraal',
  'Heidelberg',
  'Irene',
  'Johannesburg',
  'Johannesburg South',
  'Katlehong',
  'Kempton Park',
  'Krugersdorp',
  'Kudube',
  'Kwa-Thema',
  'Lawley',
  'Lenasia',
  'Lenasia South',
  'Mabopane',
  'Machenzieville',
  'Magaliesburg',
  'Mamelodi',
  'Meadowlands East',
  'Meadowlands West',
  'Meyerton',
  'Midrand',
  'Muldersdrift',
  'Nigel',
  'Olifantsfontein',
  'Orange Farm',
  'Pimville',
  'Pretoria',
  'Pretoria North',
  'Randburg',
  'Randfontein',
  'Rayton',
  'Refilwe',
  'Roodeplaat',
  'Roodepoort',
  'Sandton',
  'Sebokeng',
  'Soshanguve',
  'Soweto',
  'Springs',
  'Temba',
  'Tembisa',
  'Tokoza',
  'Vaal Marina',
  'Vaal Oewer',
  'Vanderbijlpark',
  'Vereeniging',
  'Vischkuil',
  'Vorsterkroon',
  'Vosloorus',
  'Wedela',
  'Westonaria',
  'Winterveldt',
];

// Fetch locations from Supabase 'locations' table
export async function fetchLocationsFromSupabase(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('name, region')
      .order('name', { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_GAUTENG_LOCATIONS;
    }

    const fetchedNames = data
      .map((row: { name: string }) => row.name?.trim())
      .filter((name: string) => Boolean(name));

    return fetchedNames.length > 0 ? fetchedNames : DEFAULT_GAUTENG_LOCATIONS;
  } catch (err) {
    console.warn('fetchLocationsFromSupabase fallback:', err);
    return DEFAULT_GAUTENG_LOCATIONS;
  }
}
