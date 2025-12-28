'use client';

import Link from 'next/link';
import { useState } from 'react';

/**
 * Admin Dashboard
 *
 * Minimal MVP admin interface for:
 * - API key generation
 * - Usage stats overview
 * - Link to detailed stats page
 */

type ApiKey = {
  key: string;
  tier: string;
  name: string;
  createdAt: string;
};

export default function AdminDashboard() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newKeyEmail, setNewKeyEmail] = useState('');
  const [newKeyTier, setNewKeyTier] = useState<'free' | 'pro' | 'enterprise'>('free');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const loadApiKeys = async () => {
    try {
      const response = await fetch('/api/admin/keys');
      if (!response.ok) {
        throw new Error('Failed to load API keys');
      }
      const data = await response.json();
      setApiKeys(data.keys);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys');
    }
  };

  const generateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setGeneratedKey(null);

    try {
      const response = await fetch('/api/admin/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerEmail: newKeyEmail,
          tier: newKeyTier,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate API key');
      }

      const data = await response.json();
      setGeneratedKey(data.key);
      setNewKeyEmail('');
      loadApiKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate API key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">CrawlReady Admin</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage API keys and monitor usage
          </p>
        </div>

        {/* Navigation */}
        <div className="mb-8 flex gap-4">
          <Link
            href="/admin"
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            API Keys
          </Link>
          <Link
            href="/admin/stats"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Usage Stats
          </Link>
        </div>

        {/* Generate API Key Form */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Generate New API Key</h2>

          <form onSubmit={generateApiKey} className="space-y-4">
            <div>
              <label htmlFor="keyEmail" className="block text-sm font-medium text-gray-700">
                Customer Email
              </label>
              <input
                id="keyEmail"
                type="email"
                value={newKeyEmail}
                onChange={e => setNewKeyEmail(e.target.value)}
                placeholder="customer@example.com"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="tier" className="block text-sm font-medium text-gray-700">
                Tier
              </label>
              <select
                id="tier"
                value={newKeyTier}
                onChange={e => setNewKeyTier(e.target.value as any)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="free">Free (100 renders/day)</option>
                <option value="pro">Pro (1,000 renders/day)</option>
                <option value="enterprise">Enterprise (Unlimited)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {loading ? 'Generating...' : 'Generate API Key'}
            </button>
          </form>

          {error && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {generatedKey && (
            <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-4">
              <p className="mb-2 text-sm font-medium text-green-900">
                ✓ API Key Generated Successfully
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded border border-gray-300 bg-white px-3 py-2 font-mono text-sm">
                  {generatedKey}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(generatedKey);
                  }}
                  className="rounded-md bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
                >
                  Copy
                </button>
              </div>
              <p className="mt-2 text-xs text-green-800">
                ⚠️ Save this key now. You won't be able to see it again!
              </p>
            </div>
          )}
        </div>

        {/* API Keys List */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">API Keys</h2>
            <button
              type="button"
              onClick={loadApiKeys}
              className="rounded-md bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200"
            >
              Refresh
            </button>
          </div>

          {apiKeys.length === 0
            ? (
                <p className="py-8 text-center text-gray-500">
                  No API keys yet. Generate one to get started!
                </p>
              )
            : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Customer Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Tier
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Key Prefix
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {apiKeys.map(key => (
                        <tr key={key.key}>
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                            {key.name}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold leading-5 ${
                                key.tier === 'free'
                                  ? 'bg-gray-100 text-gray-800'
                                  : key.tier === 'pro'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {key.tier}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-gray-500">
                            {key.key}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            {new Date(key.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
        </div>
      </div>
    </div>
  );
}
