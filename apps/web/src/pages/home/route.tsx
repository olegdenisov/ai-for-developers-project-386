import { reatomRoute, wrap } from '@reatom/core';
import type { RouteChild } from '@reatom/core';
import { PublicApi } from '@calendar-booking/api-client';
import { HomePage } from './HomePage';

const api = new PublicApi(import.meta.env.VITE_API_URL || 'http://localhost:3000');

// ============================================
// HOME ROUTE
// ============================================

/**
 * Home route - displays list of available event types
 * Path: /
 */
export const homeRoute = reatomRoute({
  path: '/',
  
  /**
   * Loader fetches event types when route is matched
   * Returns array of event types
   */
  async loader() {
    const response = await wrap(api.listPublicEventTypes());
    if (!response.ok) {
      throw new Error('Failed to fetch event types');
    }
    const data = await wrap(response.json());
    return data.eventTypes || [];
  },
  
  /**
   * Render function returns React component
   * Receives route self with access to loader data
   */
  render(self): RouteChild {
    const { isPending, data: eventTypes, error } = self.status();
    
    return (
      <HomePage 
        eventTypes={eventTypes || []} 
        isLoading={isPending}
        error={error?.message}
      />
    );
  },
});

// ============================================
// EXPORTS
// ============================================

export type HomeRoute = typeof homeRoute;
