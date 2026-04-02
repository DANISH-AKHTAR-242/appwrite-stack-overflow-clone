/** @jest-environment node */

import { DELETE } from '@/src/app/api/answer/route';

const verifyAuthMock = jest.fn();
const getDocumentMock = jest.fn();
const deleteDocumentMock = jest.fn();
const updateDocumentMock = jest.fn();
const getPrefsMock = jest.fn();
const updatePrefsMock = jest.fn();

jest.mock('@/src/lib/auth', () => ({ verifyAuth: (...args: unknown[]) => verifyAuthMock(...args) }));
jest.mock('@/src/models/server/config', () => ({
  databases: {
    getDocument: (...args: unknown[]) => getDocumentMock(...args),
    deleteDocument: (...args: unknown[]) => deleteDocumentMock(...args),
    updateDocument: (...args: unknown[]) => updateDocumentMock(...args),
  },
  users: {
    getPrefs: (...args: unknown[]) => getPrefsMock(...args),
    updatePrefs: (...args: unknown[]) => updatePrefsMock(...args),
  },
}));

describe('api route: answer delete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    verifyAuthMock.mockResolvedValue({ success: true, user: { $id: 'u1' } });
    getPrefsMock.mockResolvedValue({ reputation: 5 });
  });

  it('deletes answer for owner', async () => {
    getDocumentMock
      .mockResolvedValueOnce({ $id: 'a1', authorId: 'u1', questionId: 'q1' })
      .mockResolvedValueOnce({ $id: 'q1', answerCount: 1 });

    const req = new Request('http://localhost/api/answer', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answerId: 'a1' }),
    });

    const res = await DELETE(req as any);
    expect(res.status).toBe(200);
    expect(deleteDocumentMock).toHaveBeenCalled();
    expect(updateDocumentMock).toHaveBeenCalled();
    expect(updatePrefsMock).toHaveBeenCalled();
  });

  it('rejects answer delete for unauthenticated user', async () => {
    verifyAuthMock.mockResolvedValue({ success: false, error: 'No authentication token provided' });

    const req = new Request('http://localhost/api/answer', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answerId: 'a1' }),
    });

    const res = await DELETE(req as any);
    expect(res.status).toBe(401);
  });
});
