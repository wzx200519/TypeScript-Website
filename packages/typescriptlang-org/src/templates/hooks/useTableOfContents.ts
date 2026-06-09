import { useMemo } from "react"
import { createTableOfContents, DocumentationHeading } from "../utils/documentationPage"

export const useTableOfContents = (
  headings: readonly DocumentationHeading[] | null | undefined,
  disableTableOfContents: boolean | null | undefined
) => {
  return useMemo(
    () => ({
      items: createTableOfContents(headings ?? []),
      showTableOfContents: !disableTableOfContents,
    }),
    [disableTableOfContents, headings]
  )
}
