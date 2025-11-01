'use client';

import { useUser } from '@clerk/nextjs';
import { usePostHog } from 'posthog-js/react';
import { useEffect } from 'react';

/**
 * Component that automatically identifies users in PostHog when they sign in/up
 * Should be placed inside ClerkProvider
 */
export function PostHogIdentify() {
  const posthog = usePostHog();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !posthog) {
      return;
    }

    if (user) {
      // Identify the user in PostHog
      posthog.identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        createdAt: user.createdAt,
      });

      // Set user properties for better segmentation
      posthog.setPersonProperties({
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
      });
    } else {
      // Reset PostHog when user signs out
      posthog.reset();
    }
  }, [user, isLoaded, posthog]);

  return null;
}
