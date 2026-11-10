// The server owns both deletions. Never fall back to Firebase-only deletion.
export async function deleteAccount(idToken, fetcher = fetch) {
  const response = await fetcher(
    'https://home.broad-credit-18fd.workers.dev/account/delete',
    {
      method: 'POST', headers: { Authorization: `Bearer ${idToken}` },
      credentials: 'omit', cache: 'no-store', redirect: 'error',
      signal: AbortSignal.timeout(35000),
    },
  );
  const result = await response.json();
  if (!response.ok || result.code !== 'deleted') {
    const message = result.code === 'recent_sign_in_required' || result.code === 'sign_in_required'
      ? 'Please verify your Google account again and retry.'
      : result.code === 'account_deletion_incomplete'
        ? 'Billing data was removed, but account deletion is incomplete. Please retry.'
        : 'Deletion could not be confirmed. Please retry or contact hello@tigerstorm.dev.';
    throw new Error(message);
  }
}
