import { PostHog } from 'posthog-node';

let posthogClient: PostHog | null = null;

/**
 * Get or create PostHog server-side client
 * Used for tracking events in API routes and server components
 */
export function getPostHogClient(): PostHog | null {
  if (posthogClient) {
    return posthogClient;
  }

  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!posthogKey || !posthogHost) {
    console.warn('PostHog environment variables not configured');
    return null;
  }

  posthogClient = new PostHog(posthogKey, {
    host: posthogHost,
    flushAt: 1, // Send events immediately in serverless
    flushInterval: 0, // Don't batch events
  });

  return posthogClient;
}

/**
 * Track an event on the server side
 * @param distinctId - Unique identifier (can be IP, session ID, or user ID)
 * @param event - Event name
 * @param properties - Event properties
 */
export async function trackServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, any>,
): Promise<void> {
  const client = getPostHogClient();

  if (!client) {
    return;
  }

  try {
    client.capture({
      distinctId,
      event,
      properties: {
        ...properties,
        $lib: 'posthog-node',
        timestamp: new Date().toISOString(),
      },
    });

    // Ensure events are sent before function terminates
    await client.shutdown();
  } catch (error) {
    console.error('PostHog tracking error:', error);
  }
}
