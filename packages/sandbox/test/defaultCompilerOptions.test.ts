import { getCompilerOptionsFromParams, getDefaultSandboxCompilerOptions } from "../src/compilerOptions"
import ts from "typescript"

const fauxMonaco: any = {
  languages: {
    typescript: {
      ModuleResolutionKind: ts.ModuleResolutionKind,
      ScriptTarget: ts.ScriptTarget,
      JsxEmit: ts.JsxEmit,
      ModuleKind: ts.ModuleKind,
    },
  },
}

describe(getCompilerOptionsFromParams, () => {
  it("ignores compiler flags which are the same as the defaults", () => {
    // noImplicitReturns=true is the default, and shouldn't be in the object
    const params = new URLSearchParams("?noImplicitThis=false&noImplicitReturns=true#code/JYOw")
    const defaults = getDefaultSandboxCompilerOptions({ filetype: "js" } as any, fauxMonaco, {
      versionMajorMinor: "4.9",
    })

    expect(getCompilerOptionsFromParams(defaults, ts, params)).toMatchInlineSnapshot(`
      {
        "noImplicitThis": false,
      }
    `)
  })

  it("ignores non-compiler flags", () => {
    const params = new URLSearchParams("?asdasdasdasd=false")
    const defaults = getDefaultSandboxCompilerOptions({ filetype: "js" } as any, fauxMonaco, {
      versionMajorMinor: "4.9",
    })

    expect(getCompilerOptionsFromParams(defaults, ts, params)).toMatchInlineSnapshot(`{}`)
  })

  it("handles mapped types like target et", () => {
    const params = new URLSearchParams("?target=6")
    const defaults = getDefaultSandboxCompilerOptions({ filetype: "js" } as any, fauxMonaco, {
      versionMajorMinor: "4.9",
    })

    expect(getCompilerOptionsFromParams(defaults, ts, params)).toMatchInlineSnapshot(`
      {
        "target": 6,
      }
    `)
  })

  it("handles string enum values like target=ESNext", () => {
    const params = new URLSearchParams("?target=ESNext")
    const defaults = getDefaultSandboxCompilerOptions({ filetype: "js" } as any, fauxMonaco, {
      versionMajorMinor: "4.9",
    })

    expect(getCompilerOptionsFromParams(defaults, ts, params)).toEqual({
      "target": ts.ScriptTarget.ESNext,
    })
  })

  it("handles string enum values like module=ESNext", () => {
    const params = new URLSearchParams("?module=ESNext")
    const defaults = getDefaultSandboxCompilerOptions({ filetype: "js" } as any, fauxMonaco, {
      versionMajorMinor: "4.9",
    })

    expect(getCompilerOptionsFromParams(defaults, ts, params)).toEqual({
      "module": ts.ModuleKind.ESNext,
    })
  })

  it("handles string enum values like jsx=React", () => {
    const params = new URLSearchParams("?jsx=React")
    const defaults = getDefaultSandboxCompilerOptions({ filetype: "js" } as any, fauxMonaco, {
      versionMajorMinor: "4.9",
    })

    expect(getCompilerOptionsFromParams(defaults, ts, params)).toEqual({
      "jsx": ts.JsxEmit.React,
    })
  })

  it("handles settings options which haven't been given defaults in the monaco defaults", () => {
    const search = "?ts=4.4.0-beta&exactOptionalPropertyTypes=true#code/JYOw"
    const params = new URLSearchParams(search)
    expect(params.has("exactOptionalPropertyTypes")).toBeTruthy()

    const defaults = getDefaultSandboxCompilerOptions({ filetype: "js" } as any, fauxMonaco, {
      versionMajorMinor: "4.9",
    })

    expect(getCompilerOptionsFromParams(defaults, ts, params)).toMatchInlineSnapshot(`
      {
        "exactOptionalPropertyTypes": true,
      }
    `)
  })

  it("handles TS >= 5.0", () => {
    const params = new URLSearchParams("?target=6")
    const defaults = getDefaultSandboxCompilerOptions({ filetype: "js" } as any, fauxMonaco, {
      versionMajorMinor: "5.0",
    } as any)

    expect(getCompilerOptionsFromParams(defaults, ts, params)).toMatchInlineSnapshot(`
      {
        "target": 6,
      }
    `)
  })
})
