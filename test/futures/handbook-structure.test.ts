import { readFileSync } from "node:fs"
import path from "node:path"

declare const describe: (name: string, fn: () => void) => void
declare const it: (name: string, fn: () => void) => void
declare const expect: any

type HandbookHeading = {
  title: string
  level: string
}

const getHandbookHeadings = (): HandbookHeading[] => {
  const handbookPath = path.join(
    __dirname,
    "..",
    "..",
    "packages",
    "documentation",
    "copy",
    "en",
    "handbook-v2",
    "Narrowing.md"
  )
  const source = readFileSync(handbookPath, "utf8")

  return source.split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^(#{1,6})\s+(.*)$/)

    if (!match) {
      return []
    }

    return [{ title: match[2].trim(), level: `h${match[1].length}` }]
  })
}

describe("Handbook heading structure", () => {
  it("should expose Truthiness narrowing as a section heading", () => {
    const headings = getHandbookHeadings()
    const target = headings.find((heading) => heading.title === "Truthiness narrowing")

    expect(target).toEqual(
      expect.objectContaining({
        title: "Truthiness narrowing",
        level: expect.stringMatching(/^h[1-6]$/),
      })
    )

    const levelNumber = Number(target!.level.slice(1))
    expect(levelNumber).toBeLessThanOrEqual(2)
  })
})
