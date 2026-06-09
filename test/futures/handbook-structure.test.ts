import { getHandbookHeadings } from '../utils/handbook-helpers';

describe('Handbook heading structure', () => {
  it('should have correct heading level for Truthiness narrowing', () => {
    const headings = getHandbookHeadings();
    const target = headings.find(h => h.title === 'Truthiness narrowing');

    expect(target).toBeDefined();
    expect(target!.level).toBeTruthy();
    expect(target!.level).toMatch(/^h[1-6]$/);
    expect(target!.level).toBe('h2');
  });

  it('should surface every heading with a non-empty, well-formed level', () => {
    const headings = getHandbookHeadings();
    expect(headings.length).toBeGreaterThan(0);

    for (const heading of headings) {
      expect(heading.title).toBeTruthy();
      expect(heading.level).toMatch(/^h[1-6]$/);
    }
  });
});
