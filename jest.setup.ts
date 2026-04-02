import '@testing-library/jest-dom';

process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ??= 'https://example.test/v1';
process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ??= 'test-project';
process.env.APPWRITE_API_KEY ??= 'test-api-key';

if (typeof window !== 'undefined' && !window.requestAnimationFrame) {
  window.requestAnimationFrame = () => 0;
}
