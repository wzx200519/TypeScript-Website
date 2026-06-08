import { ScriptTarget } from "typescript"
import { SandboxConfig } from "."

type CompilerOptions = import("monaco-editor").languages.typescript.CompilerOptions
type Monaco = typeof import("monaco-editor")
type TS = typeof import("typescript")
type CommandLineOption = {
  name: string
  type?: string | Map<string, string | number | boolean>
}

const normalizeCompilerOptionValue = (value: string) => value.toLowerCase().replace(/[-_\s]/g, "")

const getCommandLineOption = (ts: TS, key: string) => {
  const optionDeclarations = ((ts as any).optionDeclarations || []) as CommandLineOption[]
  return optionDeclarations.find(option => option.name === key)
}

const getEnumCompilerOptionValue = (option: CommandLineOption, value: string) => {
  if (!(option.type instanceof Map)) return undefined

  const normalizedValue = normalizeCompilerOptionValue(value)
  const matchedEntry = Array.from(option.type.entries()).find(([name]) => {
    return normalizeCompilerOptionValue(name) === normalizedValue
  })

  return matchedEntry?.[1]
}

const getCompilerOptionValue = (option: CommandLineOption, value: string) => {
  if (value === "true") return true
  if (value === "false") return false

  const numericValue = parseInt(value, 10)
  if (!Number.isNaN(numericValue)) return numericValue

  const enumValue = getEnumCompilerOptionValue(option, value)
  if (enumValue !== undefined) return enumValue

  if (option.name === "target" && normalizeCompilerOptionValue(value) === "esnext") {
    return ScriptTarget.ESNext
  }

  if (option.type === "string") return value

  return undefined
}

/**
 * These are the defaults, but they also act as the list of all compiler options
 * which are parsed in the query params.
 */
export function getDefaultSandboxCompilerOptions(
  config: SandboxConfig,
  monaco: Monaco,
  ts: { versionMajorMinor: string }
) {
  const [major] = ts.versionMajorMinor.split(".").map(v => parseInt(v)) as [number, number]
  const useJavaScript = config.filetype === "js"
  const settings: CompilerOptions = {
    strict: true,

    noImplicitAny: true,
    strictNullChecks: !useJavaScript,
    strictFunctionTypes: true,
    strictPropertyInitialization: true,
    strictBindCallApply: true,
    noImplicitThis: true,
    noImplicitReturns: true,
    noUncheckedIndexedAccess: false,

    useDefineForClassFields: false,

    alwaysStrict: true,
    allowUnreachableCode: false,
    allowUnusedLabels: false,

    downlevelIteration: false,
    noEmitHelpers: false,
    noLib: false,
    noStrictGenericChecks: false,
    noUnusedLocals: false,
    noUnusedParameters: false,

    esModuleInterop: true,
    preserveConstEnums: false,
    removeComments: false,
    skipLibCheck: false,

    checkJs: useJavaScript,
    allowJs: useJavaScript,
    declaration: true,

    importHelpers: false,

    experimentalDecorators: true,
    emitDecoratorMetadata: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,

    target: monaco.languages.typescript.ScriptTarget.ES2017,
    jsx: monaco.languages.typescript.JsxEmit.React,
    module: monaco.languages.typescript.ModuleKind.ESNext,
  }

  if (major >= 5) {
    settings.experimentalDecorators = false
    settings.emitDecoratorMetadata = false
  }

  return { ...settings, ...config.compilerOptions }
}

/**
 * Loop through all of the entries in the existing compiler options then compare them with the
 * query params and return an object which is the changed settings via the query params
 */
export const getCompilerOptionsFromParams = (
  playgroundDefaults: CompilerOptions,
  ts: typeof import("typescript"),
  params: URLSearchParams
): CompilerOptions => {
  const returnedOptions: CompilerOptions = {}
  const defaultOptions = playgroundDefaults as Record<string, unknown>
  const parsedOptions = returnedOptions as Record<string, unknown>

  params.forEach((val, key) => {
    const option = getCommandLineOption(ts, key)
    if (!option) return

    const parsedValue = getCompilerOptionValue(option, val)
    if (parsedValue === undefined) return

    const hasDefaultValue = Object.prototype.hasOwnProperty.call(defaultOptions, key)
    if (!hasDefaultValue || defaultOptions[key] !== parsedValue) {
      parsedOptions[key] = parsedValue
    }
  })

  return returnedOptions
}

export const createURLQueryWithCompilerOptions = (_sandbox: any, paramOverrides?: any): string => {
  const sandbox = _sandbox as import("./index").Sandbox
  const initialOptions = new URLSearchParams(document.location.search)

  const compilerOptions = sandbox.getCompilerOptions()
  const compilerDefaults = sandbox.compilerDefaults
  const diff = Object.entries(compilerOptions).reduce((acc, [key, value]) => {
    if (value !== compilerDefaults[key]) {
      // @ts-ignore
      acc[key] = compilerOptions[key]
    }

    return acc
  }, {})

  const hash = `code/${sandbox.lzstring.compressToEncodedURIComponent(sandbox.getText())}`

  let urlParams: any = Object.assign({}, diff)
  for (const param of ["lib", "ts"]) {
    const params = new URLSearchParams(location.search)
    if (params.has(param)) {
      if (param === "ts" && (params.get(param) === "Nightly" || params.get(param) === "next")) {
        urlParams["ts"] = sandbox.ts.version
      } else {
        urlParams["ts"] = params.get(param)
      }
    }
  }

  const s = sandbox.editor.getSelection()

  const isNotEmpty =
    (s && s.selectionStartLineNumber !== s.positionLineNumber) || (s && s.selectionStartColumn !== s.positionColumn)

  const range = sandbox.editor.getModel()!.getFullModelRange()
  const isFull =
    s &&
    s.selectionStartLineNumber === range.startLineNumber &&
    s.selectionStartColumn === range.startColumn &&
    s.positionColumn === range.endColumn &&
    s.positionLineNumber === range.endLineNumber

  if (s && isNotEmpty && !isFull) {
    urlParams["ssl"] = s.selectionStartLineNumber
    urlParams["ssc"] = s.selectionStartColumn
    urlParams["pln"] = s.positionLineNumber
    urlParams["pc"] = s.positionColumn
  } else {
    urlParams["ssl"] = undefined
    urlParams["ssc"] = undefined
    urlParams["pln"] = undefined
    urlParams["pc"] = undefined
  }

  if (sandbox.config.filetype !== "ts") urlParams["filetype"] = sandbox.config.filetype

  if (paramOverrides) {
    urlParams = { ...urlParams, ...paramOverrides }
  }

  // @ts-ignore - this is in MDN but not libdom
  const hasInitialOpts = initialOptions.keys().length > 0

  if (Object.keys(urlParams).length > 0 || hasInitialOpts) {
    let queryString = Object.entries(urlParams)
      .filter(([_k, v]) => v !== undefined)
      .filter(([_k, v]) => v !== null)
      .map(([key, value]) => {
        return `${key}=${encodeURIComponent(value as string)}`
      })
      .join("&")

    initialOptions.forEach((value, key) => {
      const skip = ["ssl", "ssc", "pln", "pc"]
      if (skip.includes(key)) return
      if (queryString.includes(key)) return
      if (compilerOptions[key]) return

      queryString += `&${key}=${value}`
    })

    return `?${queryString}#${hash}`
  } else {
    return `#${hash}`
  }
}
