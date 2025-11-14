/**
 * Keka API Configuration
 * 
 * Handles authentication and base configuration for Keka HRIS/PSA integration
 * Uses OAuth2 authentication with Client ID, Client Secret, and API Key
 * 
 * Company: Dynamicelements
 * Documentation: https://apidocs.keka.com/
 */

import dotenv from 'dotenv';

dotenv.config();

export interface KekaConfig {
  companyName: string;
  clientId: string;
  clientSecret: string;
  apiKey: string;
  hrisBearerToken?: string;
  psaBaseUrl: string;
  hrisBaseUrl: string;
  timeout: number;
}

/**
 * Keka configuration from environment variables
 * Falls back to provided values if env vars not set
 * 
 * API Endpoints:
 * - PSA Clients: https://dynamicelements.keka.com/api/v1/psa/clients
 * - PSA Projects: https://dynamicelements.keka.com/api/v1/psa/projects
 * - HRIS Employees: https://dynamicelements.keka.com/api/v1/hris/employees
 */
export const kekaConfig: KekaConfig = {
  companyName: process.env.KEKA_COMPANY_NAME || 'dynamicelements',
  clientId: process.env.KEKA_CLIENT_ID || 'ad066272-fc26-4cb6-8013-0c917b338282',
  clientSecret: process.env.KEKA_CLIENT_SECRET || 'L0lrngtVKLGBMimNzYNk',
  apiKey: process.env.KEKA_API_KEY || '_fofSwKapMl6SJsizaEsxNhzZJrYrJHta4n55YJ3b2M=',
  psaBaseUrl: 'https://dynamicelements.keka.com/api/v1/psa',
  hrisBaseUrl: 'https://dynamicelements.keka.com/api/v1/hris',
  hrisBearerToken: process.env.KEKA_HRIS_BEARER || '',
  timeout: parseInt(process.env.KEKA_TIMEOUT || '30000', 10),
};

/**
 * Validate Keka configuration
 */
export const validateKekaConfig = (): boolean => {
  if (!kekaConfig.clientId || !kekaConfig.clientSecret || !kekaConfig.apiKey) {
    console.warn('⚠️  Keka configuration incomplete. Some features may not work.');
    return false;
  }
  console.log('✅ Keka configuration validated');
  return true;
};

export default kekaConfig;
