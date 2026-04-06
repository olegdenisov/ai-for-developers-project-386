import { PublicApi } from '@calendar-booking/api-client';
import { ENV } from '@shared/config';

// Export the API client
export const apiClient = new PublicApi(ENV.API_URL);

// Re-export for convenience
export { PublicApi } from '@calendar-booking/api-client';
