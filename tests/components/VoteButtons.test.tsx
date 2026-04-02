import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VoteButtons from '@/src/components/VoteButtons';

const pushMock = jest.fn();
const listDocumentsMock = jest.fn();

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }));
jest.mock('@/src/store/Auth', () => ({ useAuthStore: jest.fn() }));
jest.mock('@/src/models/client/config', () => ({
  databases: { listDocuments: (...args: unknown[]) => listDocumentsMock(...args) },
}));

describe('component: VoteButtons', () => {
  const { useAuthStore } = jest.requireMock('@/src/store/Auth');

  beforeEach(() => {
    jest.clearAllMocks();
    listDocumentsMock.mockResolvedValue({ documents: [] });
  });

  it('blocks action with expired jwt and shows alert', async () => {
    useAuthStore.mockReturnValue({ user: { $id: 'u1' }, jwt: null });
    window.alert = jest.fn();

    render(<VoteButtons type="question" id="q1" initialVoteCount={1} />);
    await userEvent.click(screen.getByRole('button', { name: /Upvote/i }));

    expect(window.alert).toHaveBeenCalledWith('Session expired. Please log in again.');
  });

  it('sends downvote request', async () => {
    useAuthStore.mockReturnValue({ user: { $id: 'u1' }, jwt: 'jwt' });
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { voteCount: 0, vote: { $id: 'v1', voteStatus: 'downvoted' } } }),
    });

    render(<VoteButtons type="question" id="q1" initialVoteCount={1} />);
    await userEvent.click(screen.getByRole('button', { name: /Downvote/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/vote',
        expect.objectContaining({ method: 'POST' })
      );
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });
});
