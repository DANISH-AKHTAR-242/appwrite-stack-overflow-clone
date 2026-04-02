import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Answers from '@/src/components/Answers';

jest.mock('@/src/components/RTE', () => {
  const MockRTE = ({ value, onChange }: { value?: string; onChange: (value: string) => void }) => (
    <textarea aria-label="Answer editor" value={value || ''} onChange={(e) => onChange(e.target.value)} />
  );
  const MarkdownPreview = ({ source }: { source: string }) => <div>{source}</div>;
  return { __esModule: true, default: MockRTE, MarkdownPreview };
});

jest.mock('@/src/components/VoteButtons', () => () => <div>VoteButtons</div>);
jest.mock('@/src/store/Auth', () => ({ useAuthStore: jest.fn() }));
jest.mock('@/src/models/client/config', () => ({ avatars: { getInitials: () => 'avatar' } }));

describe('component: Answers', () => {
  const { useAuthStore } = jest.requireMock('@/src/store/Auth');

  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { $id: 'a2', content: 'valid answer content' } }),
    });
  });

  it('posts a new answer and updates count', async () => {
    useAuthStore.mockReturnValue({ user: { $id: 'u1', name: 'Owner', reputation: 1 }, jwt: 'jwt' });

    render(
      <Answers
        questionId="q1"
        answers={{
          total: 1,
          documents: [
            {
              $id: 'a1',
              content: 'existing answer',
              authorId: 'u1',
              author: { $id: 'u1', name: 'Owner', reputation: 1 },
              voteCount: 0,
              comments: { total: 0, documents: [] },
            },
          ],
        } as any}
      />
    );

    await userEvent.type(screen.getByLabelText('Answer editor'), 'This is a valid answer content.');
    await userEvent.click(screen.getByRole('button', { name: /Post Your Answer/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/answer', expect.objectContaining({ method: 'POST' }));
      expect(screen.getByText(/2 Answers/i)).toBeInTheDocument();
    });
  });

  it('shows api error when posting answer fails', async () => {
    useAuthStore.mockReturnValue({ user: { $id: 'u1', name: 'Owner', reputation: 1 }, jwt: 'jwt' });
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: 'Answer API failed' } }),
    });

    render(<Answers questionId="q1" answers={{ total: 0, documents: [] } as any} />);
    await userEvent.type(screen.getByLabelText('Answer editor'), 'This is a valid answer content.');
    await userEvent.click(screen.getByRole('button', { name: /Post Your Answer/i }));

    await waitFor(() => {
      expect(screen.getByText(/Answer API failed/i)).toBeInTheDocument();
    });
  });
});
