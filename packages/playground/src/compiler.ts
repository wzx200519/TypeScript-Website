import * as ts from "typescript"

export function getCompilerOptions(searchParams: URLSearchParams): ts.CompilerOptions {
  const options: ts.CompilerOptions = {}

  const target = searchParams.get("target")
  if (target) {
    const targetMap: Record<string, ts.ScriptTarget> = {
      es3: ts.ScriptTarget.ES3,
      es5: ts.ScriptTarget.ES5,
      es2015: ts.ScriptTarget.ES2015,
      es2016: ts.ScriptTarget.ES2016,
      es2017: ts.ScriptTarget.ES2017,
      es2018: ts.ScriptTarget.ES2018,
      es2019: ts.ScriptTarget.ES2019,
      es2020: ts.ScriptTarget.ES2020,
      es2021: ts.ScriptTarget.ES2021,
      es2022: ts.ScriptTarget.ES2022,
      esnext: ts.ScriptTarget.ESNext,
    }
    options.target = targetMap[target.toLowerCase()] ?? ts.ScriptTarget.ESNext
  }

  const module = searchParams.get("module")
  if (module) {
    const moduleMap: Record<string, ts.ModuleKind> = {
      none: ts.ModuleKind.None,
      commonjs: ts.ModuleKind.CommonJS,
      amd: ts.ModuleKind.AMD,
      umd: ts.ModuleKind.UMD,
      system: ts.ModuleKind.System,
      es2015: ts.ModuleKind.ES2015,
      es2020: ts.ModuleKind.ES2020,
      es2022: ts.ModuleKind.ES2022,
      esnext: ts.ModuleKind.ESNext,
      node16: ts.ModuleKind.Node16,
      nodenext: ts.ModuleKind.NodeNext,
    }
    options.module = moduleMap[module.toLowerCase()] ?? ts.ModuleKind.ESNext
  }

  const strict = searchParams.get("strict")
  if (strict === "true") {
    options.strict = true
  }

  const jsx = searchParams.get("jsx")
  if (jsx) {
    const jsxMap: Record<string, ts.JsxEmit> = {
      none: ts.JsxEmit.None,
      preserve: ts.JsxEmit.Preserve,
      react: ts.JsxEmit.React,
      reactnative: ts.JsxEmit.ReactNative,
      reactjsx: ts.JsxEmit.ReactJSX,
      reactjsxd: ts.JsxEmit.ReactJSXDev,
    }
    options.jsx = jsxMap[jsx.toLowerCase()] ?? ts.JsxEmit.React
  }

  const moduleResolution = searchParams.get("moduleResolution")
  if (moduleResolution) {
    const moduleResolutionMap: Record<string, ts.ModuleResolutionKind> = {
      classic: ts.ModuleResolutionKind.Classic,
      node: ts.ModuleResolutionKind.NodeJs,
      node16: ts.ModuleResolutionKind.Node16,
      nodenext: ts.ModuleResolutionKind.NodeNext,
      bundler: ts.ModuleResolutionKind.Bundler,
    }
    options.moduleResolution =
      moduleResolutionMap[moduleResolution.toLowerCase()] ?? ts.ModuleResolutionKind.NodeJs
  }

  return options
}
