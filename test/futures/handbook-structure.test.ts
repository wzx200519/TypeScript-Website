import { getHandbookHeadings } from '../utils/handbook-helpers';

describe('Handbook heading structure', () => {
  it('should have a valid heading level for Truthiness narrowing', () => {
    const headings = getHandbookHeadings();
    const target = headings.find(h => h.title === 'Truthiness narrowing');

    expect(target).toBeDefined();

    expect(target?.level).toMatch(/^h[1-6]$/);
  });
});
