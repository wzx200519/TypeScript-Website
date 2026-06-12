import { getHandbookHeadings } from '../utils/handbook-helpers';

const VALID_HEADING_LEVELS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
const SUBSECTION_LEVELS = ['h2', 'h3'];

describe('Handbook heading structure', () => {
  it('should have a valid heading level for Truthiness narrowing', () => {
    const headings = getHandbookHeadings();
    const target = headings.find(h => h.title === 'Truthiness narrowing');

    expect(target).toBeDefined();
    expect(target!.level).toBeTruthy();
    expect(VALID_HEADING_LEVELS).toContain(target!.level);
    expect(SUBSECTION_LEVELS).toContain(target!.level);
  });
});
