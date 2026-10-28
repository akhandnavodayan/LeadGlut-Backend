import axios from 'axios';

export interface Lead {
  businessName: string;
  phone: string;
  address: string;
  website: string;
}

interface ScraperResponse {
  leads?: unknown;
  data?: unknown;
}

const ZYTE_API_URL = 'https://api.zyte.com/v1/extract';

export class ScraperService {
  async fetchLeads(niche: string, location: string): Promise<Lead[]> {
    const apiKey = process.env.ZYTE_API_KEY;
    const endpoint = process.env.SCRAPER_API_URL ?? ZYTE_API_URL;

    if (!apiKey) {
      throw new Error('Scraper is not configured: ZYTE_API_KEY is missing.');
    }

    try {
      const response = await axios.post<ScraperResponse>(
        endpoint,
        {
          niche,
          location,
          query: `${niche} businesses in ${location}`,
        },
        {
          auth: {
            username: apiKey,
            password: '',
          },
          timeout: 15_000,
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      const payload = response.data.leads ?? response.data.data;
      if (!Array.isArray(payload)) {
        throw new Error('Scraper returned an invalid lead list.');
      }

      return payload.flatMap((item): Lead[] => {
        if (!item || typeof item !== 'object') {
          return [];
        }

        const lead = item as Record<string, unknown>;
        if (
          typeof lead.businessName !== 'string' ||
          typeof lead.phone !== 'string' ||
          typeof lead.address !== 'string' ||
          typeof lead.website !== 'string'
        ) {
          return [];
        }

        return [
          {
            businessName: lead.businessName,
            phone: lead.phone,
            address: lead.address,
            website: lead.website,
          },
        ];
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const detail = status ? ` (HTTP ${status})` : '';
        throw new Error(`Lead scraper request failed${detail}.`);
      }

      if (error instanceof Error) {
        throw new Error(`Lead scraper failed: ${error.message}`);
      }

      throw new Error('Lead scraper failed unexpectedly.');
    }
  }
}

export default ScraperService;
