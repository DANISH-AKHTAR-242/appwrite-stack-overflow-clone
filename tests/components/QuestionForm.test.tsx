import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuestionForm from '@/src/components/QuestionForm';

const pushMock = jest.fn();
const createFileMock = jest.fn();
const deleteFileMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock('@/src/components/RTE', () => {
  return function MockRTE({ value, onChange }: { value?: string; onChange: (value: string) => void }) {
    return (
      <textarea
        aria-label="Editor"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  };
});

jest.mock('@/src/components/magicui/meteors', () => () => null);
jest.mock('@/src/components/magicui/confetti', () => ({ Confetti: jest.fn() }));

jest.mock('@/src/store/Auth', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/src/models/client/config', () => ({
  storage: {
    createFile: (...args: unknown[]) => createFileMock(...args),
    deleteFile: (...args: unknown[]) => deleteFileMock(...args),
  },
  databases: {},
}));

describe('component: QuestionForm', () => {
  const { useAuthStore } = jest.requireMock('@/src/store/Auth');

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.mockReturnValue({
      user: { $id: 'user-1' },
      jwt: 'jwt-token',
    });
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ $id: 'q-1' }),
    });
    createFileMock.mockResolvedValue({ $id: 'file-1' });
  });

  it('submits question and redirects after success', async () => {
    const user = userEvent.setup();
    render(<QuestionForm />);

    await user.type(screen.getByLabelText(/Title Address/i), 'How to use React Testing Library?');
    await user.type(screen.getByLabelText('Editor'), 'This content has enough characters to pass validation.');

    await user.type(screen.getByLabelText(/Tags/i), 'react');
    await user.click(screen.getByRole('button', { name: /Add/i }));

    const file = new File(['img'], 'image.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText(/Image/i), { target: { files: [file] } });

    await user.click(screen.getByRole('button', { name: /Publish/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/question',
        expect.objectContaining({ method: 'POST' })
      );
      expect(pushMock).toHaveBeenCalledWith(expect.stringContaining('/questions/q-1/'));
    });
  });

  it('shows auth error for unauthenticated submit', async () => {
    useAuthStore.mockReturnValue({ user: null, jwt: null });
    const user = userEvent.setup();

    render(<QuestionForm />);
    await user.click(screen.getByRole('button', { name: /Publish/i }));

    expect(screen.getByText(/Please log in to continue/i)).toBeInTheDocument();
  });
});
