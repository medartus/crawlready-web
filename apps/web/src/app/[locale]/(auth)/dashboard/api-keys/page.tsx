'use client';

import { Copy, Eye, EyeOff, Key, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

/**
 * API Keys Management Dashboard
 *
 * Allows users to:
 * - View their API keys
 * - Generate new API keys
 * - Copy keys to clipboard
 * - Revoke keys
 */

type ApiKey = {
  id: string;
  keyPrefix: string;
  tier: 'free' | 'pro' | 'enterprise';
  createdAt: string;
  lastUsedAt: string | null;
  isActive: boolean;
  rateLimitDaily: number;
};

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch keys on mount
  useState(() => {
    fetchKeys();
  });

  async function fetchKeys() {
    try {
      setIsLoading(true);
      const response = await fetch('/api/user/keys');

      if (!response.ok) {
        throw new Error('Failed to fetch API keys');
      }

      const data = await response.json();
      setKeys(data.keys || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load keys');
    } finally {
      setIsLoading(false);
    }
  }

  async function generateKey() {
    try {
      setIsGenerating(true);
      setError(null);

      const response = await fetch('/api/user/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'free' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate key');
      }

      const data = await response.json();
      setNewKey(data.key);
      setShowKey(true);

      // Refresh keys list
      await fetchKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate key');
    } finally {
      setIsGenerating(false);
    }
  }

  async function revokeKey(keyId: string) {
    if (
      // eslint-disable-next-line no-alert
      !window.confirm(
        'Are you sure you want to revoke this API key? This action cannot be undone.',
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/user/keys/${keyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to revoke key');
      }

      // Refresh keys list
      await fetchKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke key');
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  }

  function closeNewKeyModal() {
    setNewKey(null);
    setShowKey(false);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 size-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <p className="text-gray-600">Loading API keys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API Keys</h1>
          <p className="mt-2 text-gray-600">
            Manage your API keys for CrawlReady integration
          </p>
        </div>
        <button
          type="button"
          onClick={generateKey}
          disabled={isGenerating || keys.length >= 10}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="size-5" />
          {isGenerating ? 'Generating...' : 'Generate Key'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Key Limit Warning */}
      {keys.length >= 10 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-yellow-800">
            You've reached the maximum of 10 API keys. Please revoke an existing
            key to generate a new one.
          </p>
        </div>
      )}

      {/* API Keys List */}
      {keys.length === 0
        ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <Key className="mx-auto size-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                No API keys yet
              </h3>
              <p className="mt-2 text-gray-600">
                Generate your first API key to start using CrawlReady
              </p>
              <button
                type="button"
                onClick={generateKey}
                disabled={isGenerating}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                <Plus className="size-5" />
                Generate Your First Key
              </button>
            </div>
          )
        : (
            <div className="grid gap-4">
              {keys.map(key => (
                <div
                  key={key.id}
                  className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <code className="rounded bg-gray-100 px-3 py-1 font-mono text-sm">
                          {key.keyPrefix}
                          ...
                        </code>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            key.tier === 'free'
                              ? 'bg-gray-100 text-gray-700'
                              : key.tier === 'pro'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {key.tier.toUpperCase()}
                        </span>
                        {!key.isActive && (
                          <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                            REVOKED
                          </span>
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Created:</span>
                          <p className="mt-1 font-medium text-gray-900">
                            {new Date(key.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Last Used:</span>
                          <p className="mt-1 font-medium text-gray-900">
                            {key.lastUsedAt
                              ? new Date(key.lastUsedAt).toLocaleDateString()
                              : 'Never'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Rate Limit:</span>
                          <p className="mt-1 font-medium text-gray-900">
                            {key.rateLimitDaily.toLocaleString()}
                            {' '}
                            / day
                          </p>
                        </div>
                      </div>
                    </div>

                    {key.isActive && (
                      <button
                        type="button"
                        onClick={() => revokeKey(key.id)}
                        className="ml-4 rounded-lg p-2 text-red-600 hover:bg-red-50"
                        title="Revoke key"
                      >
                        <Trash2 className="size-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

      {/* New Key Modal */}
      {newKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900">
              API Key Generated!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Save this key now. You won't be able to see it again!
            </p>

            <div className="mt-4">
              <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 p-3">
                <code className="flex-1 overflow-x-auto font-mono text-sm">
                  {showKey ? newKey : '•'.repeat(40)}
                </code>
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1 hover:text-blue-600"
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey
                    ? (
                        <EyeOff className="size-5" />
                      )
                    : (
                        <Eye className="size-5" />
                      )}
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(newKey)}
                  className="p-1 hover:text-blue-600"
                  title="Copy to clipboard"
                >
                  <Copy className="size-5" />
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeNewKeyModal}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Documentation */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
        <h3 className="font-semibold text-gray-900">Using Your API Key</h3>
        <p className="mt-2 text-sm text-gray-600">
          Include your API key in the Authorization header of your requests:
        </p>
        <pre className="mt-3 overflow-x-auto rounded bg-gray-900 p-4 text-sm text-gray-100">
          {`curl -X POST https://api.crawlready.com/api/render \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}'`}
        </pre>
      </div>
    </div>
  );
}
