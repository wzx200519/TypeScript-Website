import { UI } from "./createUI"

type Sandbox = import("@typescript/sandbox").Sandbox
type CompilerOptions = import("monaco-editor").languages.typescript.CompilerOptions

export const createExporter = (sandbox: Sandbox, monaco: typeof import("monaco-editor"), ui: UI) => {
  function getScriptTargetText(option: any) {
    return monaco.languages.typescript.ScriptTarget[option]
  }

  function getJsxEmitText(option: any) {
    if (option === monaco.languages.typescript.JsxEmit.None) {
      return undefined
    }
    return monaco.languages.typescript.JsxEmit[option].toLowerCase()
  }

  function getModuleKindText(option: any) {
    if (option === monaco.languages.typescript.ModuleKind.None) {
      return undefined
    }
    return monaco.languages.typescript.ModuleKind[option]
  }

  function getModuleResolutionText(option: any) {
    return option === monaco.languages.typescript.ModuleResolutionKind.Classic ? "classic" : "node"
  }

  // These are the compiler's defaults, and we want a diff from
  // these before putting it in the issue
  const defaultCompilerOptionsForTSC: CompilerOptions = {
    esModuleInterop: false,
    strictNullChecks: false,
    strict: false,
    strictFunctionTypes: false,
    strictPropertyInitialization: false,
    strictBindCallApply: false,
    noImplicitAny: false,
    noImplicitThis: false,
    noImplicitReturns: false,
    checkJs: false,
    allowJs: false,
    experimentalDecorators: false,
    emitDecoratorMetadata: false,
  }

  function getValidCompilerOptions(options: CompilerOptions) {
    const {
      target: targetOption,
      jsx: jsxOption,
      module: moduleOption,
      moduleResolution: moduleResolutionOption,
      ...restOptions
    } = options

    const targetText = getScriptTargetText(targetOption)
    const jsxText = getJsxEmitText(jsxOption)
    const moduleKindText = getModuleKindText(moduleOption)
    const moduleResolutionText = getModuleResolutionText(moduleResolutionOption)

    const opts = {
      ...restOptions,
      ...(targetText && { target: targetText }),
      ...(jsxText && { jsx: jsxText }),
      ...(moduleKindText && { module: moduleKindText }),
      moduleResolution: moduleResolutionText,
    }

    const diffFromTSCDefaults = Object.entries(opts).reduce((acc, [key, value]) => {
      if ((opts as any)[key] && value != defaultCompilerOptionsForTSC[key]) {
        // @ts-ignore
        acc[key] = opts[key]
      }

      return acc
    }, {})

    return diffFromTSCDefaults
  }

  // Based on https://github.com/stackblitz/core/blob/master/sdk/src/generate.ts
  function createHiddenInput(name: string, value: string) {
    const input = document.createElement("input")
    input.type = "hidden"
    input.name = name
    input.value = value
    return input
  }

  function createProjectForm(project: any) {
    const form = document.createElement("form")

    form.method = "POST"
    form.setAttribute("style", "display:none;")

    form.appendChild(createHiddenInput("project[title]", project.title))
    form.appendChild(createHiddenInput("project[description]", project.description))
    form.appendChild(createHiddenInput("project[template]", project.template))

    if (project.tags) {
      project.tags.forEach((tag: string) => {
        form.appendChild(createHiddenInput("project[tags][]", tag))
      })
    }

    if (project.dependencies) {
      form.appendChild(createHiddenInput("project[dependencies]", JSON.stringify(project.dependencies)))
    }

    if (project.settings) {
      form.appendChild(createHiddenInput("project[settings]", JSON.stringify(project.settings)))
    }

    Object.keys(project.files).forEach(path => {
      form.appendChild(createHiddenInput(`project[files][${path}]`, project.files[path]))
    })

    return form
  }

  const typescriptVersion = sandbox.ts.version
  // prettier-ignore
  const stringifiedCompilerOptions = JSON.stringify({ compilerOptions: getValidCompilerOptions(sandbox.getCompilerOptions()) }, null, '  ')

  // TODO: pull deps
  function openProjectInStackBlitz() {
    const project = {
      title: "Playground Export - ",
      description: "123",
      template: "typescript",
      files: {
        "index.ts": sandbox.getText(),
        "tsconfig.json": stringifiedCompilerOptions,
      },
      dependencies: {
        typescript: typescriptVersion,
      },
    }
    const form = createProjectForm(project)
    form.action = "https://stackblitz.com/run?view=editor"
    // https://github.com/stackblitz/core/blob/master/sdk/src/helpers.ts#L9
    // + buildProjectQuery(options);
    form.target = "_blank"

    document.body.appendChild(form)
    form.submit()
    document.body.removeChild(form)
  }

  function openInBugWorkbench() {
    const hash = `#code/${sandbox.lzstring.compressToEncodedURIComponent(sandbox.getText())}`
    document.location.assign(`/dev/bug-workbench/${hash}`)
  }

  function openInTSAST() {
    const hash = `#code/${sandbox.lzstring.compressToEncodedURIComponent(sandbox.getText())}`
    document.location.assign(`https://ts-ast-viewer.com/${hash}`)
  }

  function openInVSCodeDev() {
    const search = document.location.search
    const hash = `#code/${sandbox.lzstring.compressToEncodedURIComponent(sandbox.getText())}`
    document.location.assign(`https://insiders.vscode.dev/tsplay/${search}${hash}`)
  }

  function openProjectInCodeSandbox() {
    const files = {
      "package.json": {
        content: {
          name: "TypeScript Playground Export",
          version: "0.0.0",
          description: "TypeScript playground exported Sandbox",
          dependencies: {
            typescript: typescriptVersion,
          },
        },
      },
      "index.ts": {
        content: sandbox.getText(),
      },
      "tsconfig.json": {
        content: stringifiedCompilerOptions,
      },
    }

    // Using the v1 get API
    const parameters = sandbox.lzstring
      .compressToBase64(JSON.stringify({ files }))
      .replace(/\+/g, "-") // Convert '+' to '-'
      .replace(/\//g, "_") // Convert '/' to '_'
      .replace(/=+$/, "") // Remove ending '='

    const url = `https://codesandbox.io/api/v1/sandboxes/define?view=editor&parameters=${parameters}`
    document.location.assign(url)

    // Alternative using the http URL API, which uses POST. This has the trade-off where
    // the async nature of the call means that the redirect at the end triggers
    // popup security mechanisms in browsers because the function isn't blessed as
    // being a direct result of a user action.

    // fetch("https://codesandbox.io/api/v1/sandboxes/define?json=1", {
    //   method: "POST",
    //   body: JSON.stringify({ files }),
    //   headers: {
    //     Accept: "application/json",
    //     "Content-Type": "application/json"
    //   }
    // })
    // .then(x => x.json())
    // .then(data => {
    //   window.open('https://codesandbox.io/s/' + data.sandbox_id, '_blank');
    // });
  }

  function codify(code: string, ext: string) {
    return "```" + ext + "\n" + code + "\n```\n"
  }

  async function makeMarkdown() {
    const query = sandbox.createURLQueryWithCompilerOptions(sandbox)
    const fullURL = `${document.location.protocol}//${document.location.host}${document.location.pathname}${query}`
    const jsSection =
      sandbox.config.filetype === "js"
        ? ""
        : `
<details><summary><b>Output</b></summary>

${codify(await sandbox.getRunnableJS(), "ts")}

</details>
`

    return `
${codify(sandbox.getText(), "ts")}

${jsSection}

<details><summary><b>Compiler Options</b></summary>

${codify(stringifiedCompilerOptions, "json")}

</details>

**Playground Link:** [Provided](${fullURL})
      `
  }
  async function copyAsMarkdownIssue(e: React.MouseEvent) {
    e.persist()

    const markdown = await makeMarkdown()
    ui.showModal(
      markdown,
      document.getElementById("exports-dropdown")!,
      "Markdown Version of Playground Code for GitHub Issue",
      undefined,
      e
    )
    return false
  }

  function copyForChat(e: React.MouseEvent) {
    const query = sandbox.createURLQueryWithCompilerOptions(sandbox)
    const fullURL = `${document.location.protocol}//${document.location.host}${document.location.pathname}${query}`
    const chat = `[Playground Link](${fullURL})`
    ui.showModal(chat, document.getElementById("exports-dropdown")!, "Markdown for chat", undefined, e)
    return false
  }

  function copyForChatWithPreview(e: React.MouseEvent) {
    e.persist()

    const query = sandbox.createURLQueryWithCompilerOptions(sandbox)
    const fullURL = `${document.location.protocol}//${document.location.host}${document.location.pathname}${query}`

    const ts = sandbox.getText()
    const preview = ts.length > 200 ? ts.substring(0, 200) + "..." : ts.substring(0, 200)

    const jsx = getJsxEmitText(sandbox.getCompilerOptions().jsx)
    const codeLanguage = jsx !== undefined ? "tsx" : "ts"
    const code = "```" + codeLanguage + "\n" + preview + "\n```\n"
    const chat = `${code}\n[Playground Link](${fullURL})`
    ui.showModal(chat, document.getElementById("exports-dropdown")!, "Markdown code", undefined, e)
    return false
  }

  function exportAsTweet() {
    const query = sandbox.createURLQueryWithCompilerOptions(sandbox)
    const fullURL = `${document.location.protocol}//${document.location.host}${document.location.pathname}${query}`

    document.location.assign(`http://www.twitter.com/share?url=${fullURL}`)
  }

  async function shareAsGist() {
    const modal = ui.createModalOverlay(document.getElementById("exports-dropdown")!)
    modal.classList.add("share-as-gist-modal")
    
    const title = document.createElement("h3")
    title.textContent = "Share as Gist"
    modal.appendChild(title)
    
    const content = document.createElement("div")
    content.id = "share-as-gist-content"
    modal.appendChild(content)
    
    let isLoading = false
    let gistUrl: string | null = null
    let errorMessage: string | null = null
    
    const render = () => {
      while (content.firstChild) {
        content.removeChild(content.firstChild)
      }
      
      if (isLoading) {
        const loading = document.createElement("div")
        loading.className = "share-as-gist-loading"
        loading.textContent = "Creating Gist..."
        content.appendChild(loading)
        return
      }
      
      if (gistUrl) {
        const success = document.createElement("div")
        success.className = "share-as-gist-success"
        
        const icon = document.createElement("div")
        icon.className = "success-icon"
        icon.innerHTML = "✓"
        success.appendChild(icon)
        
        const successTitle = document.createElement("h4")
        successTitle.textContent = "Gist Created!"
        success.appendChild(successTitle)
        
        const message = document.createElement("p")
        message.textContent = "Your gist has been created and the URL has been copied to your clipboard."
        success.appendChild(message)
        
        content.appendChild(success)
        
        const urlContainer = document.createElement("div")
        urlContainer.className = "share-as-gist-url"
        const link = document.createElement("a")
        link.href = gistUrl
        link.target = "_blank"
        link.rel = "noopener noreferrer"
        link.textContent = gistUrl
        urlContainer.appendChild(link)
        content.appendChild(urlContainer)
        
        const buttonContainer = document.createElement("div")
        buttonContainer.className = "share-as-gist-buttons"
        
        const createAnotherBtn = document.createElement("button")
        createAnotherBtn.textContent = "Create Another Gist"
        createAnotherBtn.className = "secondary"
        createAnotherBtn.onclick = () => {
          gistUrl = null
          errorMessage = null
          render()
        }
        buttonContainer.appendChild(createAnotherBtn)
        
        content.appendChild(buttonContainer)
        return
      }
      
      if (errorMessage) {
        const error = document.createElement("div")
        error.className = "share-as-gist-error"
        
        const icon = document.createElement("div")
        icon.className = "error-icon"
        icon.innerHTML = "✕"
        error.appendChild(icon)
        
        const errorTitle = document.createElement("h4")
        errorTitle.textContent = "Error Creating Gist"
        error.appendChild(errorTitle)
        
        const message = document.createElement("p")
        message.textContent = errorMessage
        error.appendChild(message)
        
        content.appendChild(error)
        
        const buttonContainer = document.createElement("div")
        buttonContainer.className = "share-as-gist-buttons"
        
        const tryAgainBtn = document.createElement("button")
        tryAgainBtn.textContent = "Try Again"
        tryAgainBtn.className = "secondary"
        tryAgainBtn.onclick = () => {
          errorMessage = null
          render()
        }
        buttonContainer.appendChild(tryAgainBtn)
        
        content.appendChild(buttonContainer)
        return
      }
      
      const description = document.createElement("p")
      description.className = "share-as-gist-description"
      description.textContent = "Share your code as a GitHub Gist. This will create a public gist with your code and a tsconfig.json file."
      content.appendChild(description)
      
      const buttonContainer = document.createElement("div")
      buttonContainer.className = "share-as-gist-buttons"
      
      const createBtn = document.createElement("button")
      createBtn.textContent = "Share as Gist"
      createBtn.onclick = async () => {
        isLoading = true
        render()
        
        try {
          const tsConfig = {
            compilerOptions: {
              target: "es2015",
              module: "esnext",
              strict: true,
              esModuleInterop: true,
              skipLibCheck: true,
              forceConsistentCasingInFileNames: true
            }
          }
          
          const gistData = {
            description: `TypeScript ${sandbox.ts.version} Playground Code`,
            public: true,
            files: {
              "index.ts": {
                content: sandbox.getText()
              },
              "tsconfig.json": {
                content: JSON.stringify(tsConfig, null, 2)
              },
              "README.md": {
                content: `# TypeScript Playground Code

This gist contains code shared from the TypeScript Playground, using TypeScript ${sandbox.ts.version}.

## Files
- \`index.ts\`: The main TypeScript code
- \`tsconfig.json\`: Recommended compiler configuration

## View in Playground
You can view this code in the TypeScript Playground at https://www.typescriptlang.org/play.
`
              }
            }
          }
          
          const response = await fetch("https://api.github.com/gists", {
            method: "POST",
            headers: {
              "Accept": "application/vnd.github.v3+json",
              "Content-Type": "application/json"
            },
            body: JSON.stringify(gistData)
          })
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            const errorMsg = errorData.message || `Failed to create gist: ${response.status} ${response.statusText}`
            
            if (response.status === 403) {
              throw new Error("GitHub API rate limit exceeded. Please try again later or use a personal access token.")
            }
            if (response.status === 422) {
              throw new Error("Invalid gist data. Please check your code and try again.")
            }
            
            throw new Error(errorMsg)
          }
          
          const data = await response.json()
          
          if (!data.html_url) {
            throw new Error("Gist created but no URL returned from GitHub.")
          }
          
          gistUrl = data.html_url
          
          try {
            await navigator.clipboard.writeText(data.html_url)
          } catch (clipboardError) {
            console.warn("Failed to copy to clipboard:", clipboardError)
          }
          
          ui.flashInfo("Gist created and URL copied to clipboard!")
        } catch (error) {
          errorMessage = error instanceof Error ? error.message : "An unknown error occurred while creating the gist."
        } finally {
          isLoading = false
          render()
        }
      }
      buttonContainer.appendChild(createBtn)
      content.appendChild(buttonContainer)
    }
    
    const style = document.createElement("style")
    style.textContent = `
      .share-as-gist-modal {
        max-width: 500px;
      }
      .share-as-gist-modal h3 {
        margin-top: 0;
        margin-bottom: 16px;
      }
      .share-as-gist-description {
        color: #666;
        margin-bottom: 16px;
        line-height: 1.5;
      }
      .share-as-gist-buttons {
        display: flex;
        gap: 12px;
        margin-top: 16px;
      }
      .share-as-gist-buttons button {
        background-color: #007acc;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s ease;
      }
      .share-as-gist-buttons button:hover:not(:disabled) {
        background-color: #005a9e;
      }
      .share-as-gist-buttons button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .share-as-gist-buttons button.secondary {
        background-color: #f0f0f0;
        color: #333;
      }
      .share-as-gist-buttons button.secondary:hover:not(:disabled) {
        background-color: #e0e0e0;
      }
      .share-as-gist-loading {
        text-align: center;
        padding: 24px;
        color: #666;
      }
      .share-as-gist-success {
        text-align: center;
        margin-bottom: 16px;
      }
      .success-icon {
        font-size: 48px;
        color: #28a745;
        margin: 0 auto 12px;
      }
      .share-as-gist-success h4 {
        margin: 0 0 8px;
        color: #333;
      }
      .share-as-gist-success p {
        margin: 0;
        color: #666;
        font-size: 14px;
      }
      .share-as-gist-url {
        background-color: #f5f5f5;
        padding: 12px;
        border-radius: 6px;
        margin-bottom: 16px;
        word-break: break-all;
      }
      .share-as-gist-url a {
        color: #007acc;
        text-decoration: none;
      }
      .share-as-gist-url a:hover {
        text-decoration: underline;
      }
      .share-as-gist-error {
        text-align: center;
        margin-bottom: 16px;
      }
      .error-icon {
        font-size: 48px;
        color: #dc3545;
        margin: 0 auto 12px;
      }
      .share-as-gist-error h4 {
        margin: 0 0 8px;
        color: #dc3545;
      }
      .share-as-gist-error p {
        margin: 0;
        color: #666;
        font-size: 14px;
        line-height: 1.5;
      }
    `
    modal.appendChild(style)
    
    render()
  }

  return {
    openProjectInStackBlitz,
    openProjectInCodeSandbox,
    copyAsMarkdownIssue,
    copyForChat,
    copyForChatWithPreview,
    openInTSAST,
    openInBugWorkbench,
    openInVSCodeDev,
    exportAsTweet,
    shareAsGist,
  }
}
