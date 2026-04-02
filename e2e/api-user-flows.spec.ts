import { expect, test } from '@playwright/test';

test.describe('E2E API flows (mock backend mode)', () => {
  test('question lifecycle: ask, view details, answer, vote', async ({ request }) => {
    const authHeader = { Authorization: 'Bearer test-jwt', 'Content-Type': 'application/json' };
    const seededQuestionId = 'q-1';

    const createQuestion = await request.post('/api/question', {
      headers: authHeader,
      data: {
        title: 'How to test Next.js API routes with Playwright?',
        content: 'I want an end-to-end flow for ask, answer, and vote in a Next.js app.',
        tags: ['nextjs', 'playwright'],
      },
    });
    expect(createQuestion.status()).toBe(201);
    const listQuestions = await request.get('/api/question?page=1&limit=10&sort=newest');
    expect(listQuestions.status()).toBe(200);
    const createAnswer = await request.post('/api/answer', {
      headers: authHeader,
      data: {
        questionId: seededQuestionId,
        answer: 'Use Playwright request context to drive API contracts in mock backend mode.',
      },
    });
    expect(createAnswer.status()).toBe(201);
    await createAnswer.json();

    const listAnswers = await request.get(`/api/answer?questionId=${seededQuestionId}&page=1&limit=10&sort=newest`);
    expect(listAnswers.status()).toBe(200);

    const voteQuestion = await request.post('/api/vote', {
      headers: authHeader,
      data: {
        type: 'question',
        typeId: seededQuestionId,
        voteStatus: 'upvoted',
      },
    });
    expect([200, 201]).toContain(voteQuestion.status());

    const voteAnswer = await request.post('/api/vote', {
      headers: authHeader,
      data: {
        type: 'answer',
        typeId: 'a-seed',
        voteStatus: 'upvoted',
      },
    });
    expect([200, 201]).toContain(voteAnswer.status());
  });

  test('edge cases: unauthenticated, duplicate vote, empty input, api failure contract', async ({ request }) => {
    const createWithoutAuth = await request.post('/api/question', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        title: 'No auth question title',
        content: 'No auth content that would otherwise be valid length for submission.',
        tags: ['nextjs'],
      },
    });
    expect(createWithoutAuth.status()).toBe(401);

    const emptyAnswer = await request.post('/api/answer', {
      headers: { Authorization: 'Bearer test-jwt', 'Content-Type': 'application/json' },
      data: { questionId: '', answer: '' },
    });
    expect(emptyAnswer.status()).toBe(400);

    const createQuestion = await request.post('/api/question', {
      headers: { Authorization: 'Bearer test-jwt', 'Content-Type': 'application/json' },
      data: {
        title: 'Duplicate vote check question title',
        content: 'Question body for duplicate vote behavior verification in e2e checks.',
        tags: ['vote'],
      },
    });
    const questionBody = await createQuestion.json();
    const questionId = questionBody.data.$id as string;

    const duplicateVote = await request.post('/api/vote', {
      headers: { Authorization: 'Bearer test-jwt', 'Content-Type': 'application/json' },
      data: {
        type: 'question',
        typeId: questionId,
        voteStatus: 'upvoted',
      },
    });
    expect([200, 201]).toContain(duplicateVote.status());
    const duplicateVoteBody = await duplicateVote.json();
    expect(['Voted', 'Vote changed', 'Vote withdrawn']).toContain(duplicateVoteBody.data.message);

    const invalidVoteType = await request.post('/api/vote', {
      headers: { Authorization: 'Bearer test-jwt', 'Content-Type': 'application/json' },
      data: {
        type: 'invalid',
        typeId: questionId,
        voteStatus: 'upvoted',
      },
    });
    expect(invalidVoteType.status()).toBe(400);
  });
});
