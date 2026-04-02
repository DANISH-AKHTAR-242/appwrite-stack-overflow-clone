/** @jest-environment node */

import { DELETE, POST } from '@/src/app/api/comment/route';

const verifyAuthMock = jest.fn();
const checkRateLimitMock = jest.fn();
const createDocumentMock = jest.fn();
const getDocumentMock = jest.fn();
const deleteDocumentMock = jest.fn();

jest.mock('@/src/lib/auth', () => ({ verifyAuth: (...args: unknown[]) => verifyAuthMock(...args) }));
jest.mock('@/src/lib/rateLimit', () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimitMock(...args),
  RATE_LIMITS: { comments: { limit: 30, windowSeconds: 3600 } },
}));
jest.mock('@/src/models/server/config', () => ({
  databases: {
    createDocument: (...args: unknown[]) => createDocumentMock(...args),
    getDocument: (...args: unknown[]) => getDocumentMock(...args),
    deleteDocument: (...args: unknown[]) => deleteDocumentMock(...args),
  },
}));

describe('api route: comment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    verifyAuthMock.mockResolvedValue({ success: true, user: { $id: 'u1' } });
    checkRateLimitMock.mockReturnValue({ allowed: true, resetTime: Date.now() + 60_000 });
  });

  it('creates a comment', async () => {
    getDocumentMock.mockResolvedValue({ $id: 'q1' });
    createDocumentMock.mockResolvedValue({ $id: 'c1', content: 'A comment' });

    const req = new Request('http://localhost/api/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'A comment', type: 'question', typeId: 'q1' }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(201);
  });

  it('returns validation error for empty comment input', async () => {
    const req = new Request('http://localhost/api/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '', type: 'question', typeId: 'q1' }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it('prevents deleting another user comment', async () => {
    getDocumentMock.mockResolvedValue({ $id: 'c1', authorId: 'u2' });

    const req = new Request('http://localhost/api/comment', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId: 'c1' }),
    });

    const res = await DELETE(req as any);
    expect(res.status).toBe(403);
  });
});
