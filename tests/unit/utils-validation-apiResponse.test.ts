import slugify from '@/src/utils/slugify';
import convertDateToRelativeTime from '@/src/utils/relativeTime';
import { validateQuestion, validateVote } from '@/src/lib/validation';
import { errors, paginatedResponse, successResponse } from '@/src/lib/apiResponse';

describe('unit: utilities, validation and api helpers', () => {
  it('slugify normalizes titles', () => {
    expect(slugify('  Hello World! Next.js  ')).toBe('hello-world-nextjs');
  });

  it('relativeTime returns human-readable value', () => {
    const oneMinuteAgo = new Date(Date.now() - 60_000);
    expect(convertDateToRelativeTime(oneMinuteAgo)).toMatch(/minute/);
  });

  it('question validation rejects empty payload', () => {
    const result = validateQuestion({ title: '', content: '', tags: [] });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('vote validation rejects invalid vote status', () => {
    const result = validateVote({ type: 'question', typeId: 'q1', voteStatus: 'invalid' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid vote status');
  });

  it('successResponse returns consistent success body', async () => {
    const res = successResponse({ id: '123' }, 201);
    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toMatchObject({ success: true, data: { id: '123' } });
  });

  it('paginatedResponse includes hasMore metadata', async () => {
    const res = paginatedResponse([{ id: 1 }], { page: 1, limit: 10, total: 15 });
    await expect(res.json()).resolves.toMatchObject({
      success: true,
      meta: { page: 1, limit: 10, total: 15, hasMore: true },
    });
  });

  it('errors.unauthorized returns 401 response', async () => {
    const res = errors.unauthorized('Login required');
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Login required' },
    });
  });
});
