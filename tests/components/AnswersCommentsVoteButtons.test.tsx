import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Answers from '@/src/components/Answers';
import Comments from '@/src/components/Comments';
import VoteButtons from '@/src/components/VoteButtons';

const pushMock = jest.fn();
const listDocumentsMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock('@/src/components/RTE', () => {
  return function MockRTE({ value, onChange }: { value?: string; onChange: (value: string) => void }) {
    return <textarea aria-label="Answer editor" value={value || ''} onChange={(e) => onChange(e.target.value)} />;
  };
});

jest.mock('@/src/components/RTE', () => {
  const MockRTE = ({ value, onChange }: { value?: string; onChange: (value: string) => void }) => (
    <textarea aria-label="Answer editor" value={value || ''} onChange={(e) => onChange(e.target.value)} />
  );
  const MarkdownPreview = ({ source }: { source: string }) => <div>{source}</div>;
  return { __esModule: true, default: MockRTE, MarkdownPreview };
});

jest.mock('@/src/store/Auth', () => ({ useAuthStore: jest.fn() }));

jest.mock('@/src/models/client/config', () => ({
  avatars: { getInitials: () => 'https://example.test/avatar.png' },
  databases: {
    listDocuments: (...args: unknown[]) => listDocumentsMock(...args),
  },
}));

describe('components: Answers, Comments, VoteButtons', () => {
  const { useAuthStore } = jest.requireMock('@/src/store/Auth');

  beforeEach(() => {
    jest.clearAllMocks();
    listDocumentsMock.mockResolvedValue({ documents: [] });
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { voteCount: 3, vote: { $id: 'v1', voteStatus: 'upvoted' } } }),
    });
  });

  it('renders empty answers state', () => {
    useAuthStore.mockReturnValue({ user: null, jwt: null });
    render(<Answers answers={{ total: 0, documents: [] } as any} questionId="q1" />);
    expect(screen.getByText(/No answers yet/i)).toBeInTheDocument();
  });

  it('comments can be added when authenticated', async () => {
    useAuthStore.mockReturnValue({ user: { $id: 'u1', name: 'Test User' }, jwt: 'jwt' });
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ $id: 'c2', content: 'New comment', authorId: 'u1', $createdAt: new Date().toISOString() }),
    });

    render(
      <Comments
        comments={{
          total: 1,
          documents: [
            {
              $id: 'c1',
              content: 'Existing comment',
              authorId: 'u1',
              author: { name: 'Test User' },
              $createdAt: new Date().toISOString(),
            },
          ],
        } as any}
        type="question"
        typeId="q1"
      />
    );

    await userEvent.type(screen.getByPlaceholderText(/Add a comment/i), 'New comment');
    await userEvent.click(screen.getByRole('button', { name: /Add Comment/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/comment',
        expect.objectContaining({ method: 'POST' })
      );
      expect(screen.getByText(/New comment/i)).toBeInTheDocument();
    });
  });

  it('vote button redirects unauthenticated user to login', async () => {
    useAuthStore.mockReturnValue({ user: null, jwt: null });
    render(<VoteButtons type="question" id="q1" initialVoteCount={2} />);

    await userEvent.click(screen.getByRole('button', { name: /Upvote/i }));
    expect(pushMock).toHaveBeenCalledWith('/login');
  });

  it('vote button updates count after successful vote', async () => {
    useAuthStore.mockReturnValue({ user: { $id: 'u1' }, jwt: 'jwt' });

    render(<VoteButtons type="question" id="q1" initialVoteCount={2} />);
    await userEvent.click(screen.getByRole('button', { name: /Upvote/i }));

    await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument());
  });
});
