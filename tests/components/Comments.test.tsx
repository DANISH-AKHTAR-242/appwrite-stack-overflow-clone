import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Comments from '@/src/components/Comments';

jest.mock('@/src/store/Auth', () => ({ useAuthStore: jest.fn() }));

describe('component: Comments', () => {
  const { useAuthStore } = jest.requireMock('@/src/store/Auth');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders list and supports delete for comment owner', async () => {
    useAuthStore.mockReturnValue({ user: { $id: 'u1', name: 'Owner' }, jwt: 'jwt' });
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ deleted: true }) });

    render(
      <Comments
        comments={{
          total: 1,
          documents: [
            {
              $id: 'c1',
              content: 'Owner comment',
              authorId: 'u1',
              author: { name: 'Owner' },
              $createdAt: new Date().toISOString(),
            },
          ],
        } as any}
        type="question"
        typeId="q1"
      />
    );

    expect(screen.getByText(/Owner comment/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Delete comment/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/comment',
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(screen.queryByText(/Owner comment/i)).not.toBeInTheDocument();
    });
  });
});
