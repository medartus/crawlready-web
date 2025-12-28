// Client-side exports only
export { PostHogIdentify } from './PostHogIdentify';
export { PostHogPageView } from './PostHogPageView';
export { PostHogProvider } from './PostHogProvider';

// Server-side exports moved to './server' - import from there directly
// e.g., import { getPostHogClient, trackServerEvent } from '@/libs/posthog/server';
