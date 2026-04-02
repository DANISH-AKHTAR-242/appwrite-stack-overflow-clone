/** @jest-environment node */

import { POST as questionPOST } from '@/src/app/api/question/route';
import { POST as answerPOST } from '@/src/app/api/answer/route';
import { POST as votePOST } from '@/src/app/api/vote/route';

const verifyAuthMock = jest.fn();
const checkRateLimitMock = jest.fn();
const createDocumentMock = jest.fn();
const getDocumentMock = jest.fn();
const updateDocumentMock = jest.fn();
const deleteDocumentMock = jest.fn();
const listDocumentsMock = jest.fn();
const getPrefsMock = jest.fn();
const updatePrefsMock = jest.fn();

jest.mock('@/src/lib/auth', () => ({ verifyAuth: (...args: unknown[]) => verifyAuthMock(...args) }));
jest.mock('@/src/lib/rateLimit', () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimitMock(...args),
  RATE_LIMITS: {
    questions: { limit: 5, windowSeconds: 3600 },
    answers: { limit: 20, windowSeconds: 3600 },
    votes: { limit: 60, windowSeconds: 3600 },
  },
}));

jest.mock('@/src/models/server/config', () => ({
  databases: {
    createDocument: (...args: unknown[]) => createDocumentMock(...args),
    getDocument: (...args: unknown[]) => getDocumentMock(...args),
    updateDocument: (...args: unknown[]) => updateDocumentMock(...args),
    deleteDocument: (...args: unknown[]) => deleteDocumentMock(...args),
    listDocuments: (...args: unknown[]) => listDocumentsMock(...args),
  },
  users: {
    getPrefs: (...args: unknown[]) => getPrefsMock(...args),
    updatePrefs: (...args: unknown[]) => updatePrefsMock(...args),
  },
  storage: {
    deleteFile: jest.fn(),
  },
}));

describe('api routes: question/answer/vote', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    verifyAuthMock.mockResolvedValue({ success: true, user: { $id: 'u1' } });
    checkRateLimitMock.mockReturnValue({ allowed: true, resetTime: Date.now() + 60_000 });
    getPrefsMock.mockResolvedValue({ reputation: 10 });
    updatePrefsMock.mockResolvedValue({});
  });

  it('creates a question', async () => {
    createDocumentMock.mockResolvedValue({ $id: 'q1', title: 'Valid title question' });

    const req = new Request('http://localhost/api/question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Valid title question',
        content: 'This is a long enough content to satisfy validation.',
        tags: ['nextjs'],
      }),
    });

    const res = await questionPOST(req as any);
    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toMatchObject({ success: true, data: { $id: 'q1' } });
  });

  it('returns unauthorized when posting answer without auth', async () => {
    verifyAuthMock.mockResolvedValue({ success: false, error: 'No authentication token provided' });

    const req = new Request('http://localhost/api/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: 'q1', answer: 'This answer is valid enough' }),
    });

    const res = await answerPOST(req as any);
    expect(res.status).toBe(401);
  });

  it('posts answer and increments question answer count', async () => {
    getDocumentMock.mockResolvedValueOnce({ $id: 'q1', answerCount: 2 });
    createDocumentMock.mockResolvedValue({ $id: 'a1', content: 'A valid answer content' });

    const req = new Request('http://localhost/api/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: 'q1', answer: 'A valid answer content with enough size.' }),
    });

    const res = await answerPOST(req as any);
    expect(res.status).toBe(201);
    expect(updateDocumentMock).toHaveBeenCalled();
  });

  it('handles duplicate vote toggle-off and returns vote withdrawn', async () => {
    getDocumentMock.mockResolvedValue({ $id: 'q1', authorId: 'author-1', voteCount: 5 });
    listDocumentsMock.mockResolvedValue({
      documents: [{ $id: 'v-1', voteStatus: 'upvoted' }],
    });
    deleteDocumentMock.mockResolvedValue({});
    getPrefsMock.mockResolvedValue({ reputation: 50 });

    const req = new Request('http://localhost/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'question', typeId: 'q1', voteStatus: 'upvoted' }),
    });

    const res = await votePOST(req as any);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      success: true,
      data: { message: 'Vote withdrawn', voteCount: 4, vote: null },
    });
  });

  it('returns internal error on question create failure', async () => {
    createDocumentMock.mockRejectedValue(new Error('database down'));

    const req = new Request('http://localhost/api/question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Valid title question',
        content: 'This is a long enough content to satisfy validation.',
        tags: ['nextjs'],
      }),
    });

    const res = await questionPOST(req as any);
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toMatchObject({ success: false });
  });
});
