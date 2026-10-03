# angular-neon-agent-template

An Angular 22 starter that AI coding agents understand from the first minute.

| Part                                                                  | What you get                                                                                                                                                                   |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [App types](#choose-your-app-type)                                    | An onboarding that sets the app to be a classic SPA, an SSR app, a PWA with Ionic, or a native app with Angular Native                                                         |
| [Skills](#skills)                                                     | Angular's official skills, design skills from Anthropic and Impeccable, skills for each app type and for Angular Material, Tailwind, pen.dev, and Neon, and a clean-code skill |
| [MCP servers](#mcp-servers)                                           | Tools agents can call: the Angular CLI and your Neon Postgres database. pen.dev adds its own when you install it.                                                              |
| [Templates](#templates)                                               | A small Angular app, and a WebMCP template that lets agents in the browser use your app                                                                                        |
| [Prettier](#prettier)                                                 | Shared formatting rules                                                                                                                                                        |
| [Angular's AI resources](#angular-ai-guides-and-example-repositories) | Every Angular AI guide, and every example repository those guides link to                                                                                                      |

There are no API keys, tokens, or database passwords in this repository.

## Quick start

1. On GitHub, click **Use this template**, then **Create a new repository**. Clone your new repository.
2. Install dependencies. You need Node.js 22.22.3 or later 22.x, 24.15 or later 24.x, or 26+.

   ```sh
   npm install
   ```

3. Start the app, then open http://localhost:4200. The first time, it asks which type of app you're building ([Choose your app type](#choose-your-app-type)). Press Enter to decide later.

   ```sh
   npm start
   ```

4. Open the folder in your AI editor. When it asks, approve the `angular-cli` and `Neon` MCP servers.

To build, run `npm run build`. To run the tests, run `npm test`, and `npm run test:scripts` for the scripts in `scripts/`.

## Choose your app type

The template starts as a classic Angular single-page app, and it can become any of these four:

| Type           | `appType`        | What you get                                                                                       | Skill               |
| -------------- | ---------------- | -------------------------------------------------------------------------------------------------- | ------------------- |
| Classic SPA    | `spa`            | An app that runs in the browser: the template as it is                                             | `angular-developer` |
| Modern SSR     | `ssr`            | Pages rendered on a Node server, then hydrated in the browser, for a fast first paint and good SEO | `angular-ssr`       |
| PWA with Ionic | `ionic-pwa`      | Ionic's mobile-style components, in an app that installs to a home screen and works offline        | `ionic-pwa`         |
| Angular Native | `angular-native` | A real iOS and Android app, which you open on your phone with [Expo Go](https://expo.dev/go)       | `angular-native`    |

Your choice is saved in `preferences.json`, and agents read it before they build anything. There are three ways to choose:

- **The onboarding.** `npm start` and `npm run build` ask until you choose. To choose again later, run `npm run onboarding`, or `npm run onboarding -- ionic-pwa` to skip the question.
- **Your prompt.** Name the type, for example: "Build an Ionic PWA for tracking expenses." The agent saves it for next time.
- **The agent asks.** If `preferences.json` is empty and your prompt doesn't name a type, the agent asks which of the four you want before it writes any code.

The first time it builds, the agent sets the type up with the Angular CLI (`ng add @angular/ssr`, `ng add @ionic/angular` and `ng add @angular/pwa`, or `ng add @ng-native/schematics`), then follows that type's skill. Each setup was tried on this template on 2026-10-03, with Angular 22.2, Ionic 9.0, and Angular Native 0.3. The builds and tests passed, axe found no problems in light or dark mode, the PWA reloaded while offline, and the native app bundled for iOS and Android. The skills say what had to be fixed along the way.

## How the repository is organized

| Path                                                 | What it holds                                                              |
| ---------------------------------------------------- | -------------------------------------------------------------------------- |
| `.agents/skills/`                                    | The skills. These are the real files.                                      |
| `.claude/skills/`                                    | Links to the skills, for Claude Code                                       |
| `.mcp.json`                                          | MCP server settings for Claude Code and GitHub Copilot CLI                 |
| `.vscode/mcp.json`                                   | The same MCP servers in VS Code's format                                   |
| `.cursor/mcp.json`, `.antigravity/mcp.json`          | Links to `.mcp.json`, for Cursor and Antigravity                           |
| `AGENTS.md`                                          | Angular's official rules for agents                                        |
| `PROJECT.md`                                         | The template's rules for agents                                            |
| `APP.md`                                             | This app's own rules for agents. Template updates never replace it.        |
| `CLAUDE.md`, `GEMINI.md`                             | Entry points for Claude Code and for Gemini. Both lead to `AGENTS.md`.     |
| `src/`                                               | The Angular app                                                            |
| `templates/webmcp.example.ts`                        | The WebMCP template                                                        |
| `.prettierrc`, `.prettierignore`                     | Prettier settings                                                          |
| `preferences.json`, `scripts/onboarding.mjs`         | Your app type, and the onboarding that asks for it                         |
| `scripts/update-agent-files.sh`                      | Updates the skills and Angular's rules in the template                     |
| `scripts/update-from-template.mjs`                   | Brings the template's updates into an app made from it                     |
| `SKILLS.lock.md`, `skills-lock.json`, `third_party/` | Where each skill came from, and the license files that must ship with them |

**Each file exists once.** Some editors only look in their own folder, so those paths are links (symlinks) to the real file. On Windows, turn on symlinks before you clone: enable Developer Mode, then run `git config --global core.symlinks true`. Otherwise the links arrive as small text files.

## Skills

Skills are the most important part of this template. A skill is a folder of expert instructions that an agent loads when a task needs it, so the agent works the way the skill's authors would.

| Skill                                                       | Use it for                                                                                                   | Made by          |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------- |
| [`angular-developer`](https://github.com/angular/skills)    | All Angular work: components, signals, forms, routing, testing, accessibility                                | The Angular team |
| [`angular-new-app`](https://github.com/angular/skills)      | Creating a new Angular app with the Angular CLI                                                              | The Angular team |
| [`frontend-design`](https://github.com/anthropics/skills)   | Choosing a look that doesn't feel templated: color, type, layout                                             | Anthropic        |
| [`impeccable`](https://github.com/pbakaus/impeccable)       | Critiquing, auditing, and polishing a UI                                                                     | Paul Bakaus      |
| [`clean-code`](https://github.com/markoa/clean-code-skill)  | Keeping every code change readable and tested                                                                | Marko Anastasov  |
| [`neon-auth`](https://github.com/neondatabase/agent-skills) | Adding sign-up and sign-in with Neon Auth                                                                    | Neon             |
| `neon-data-api-rls`                                         | Reading and writing Neon tables from Angular, with row-level security rules for owners, admins, and managers | This repository  |
| `pen-dev-angular`                                           | Designing screens on the pen.dev canvas, and turning designs into Angular components and back                | This repository  |
| `angular-ssr`                                               | Server-side rendering and hydration, and code that runs on both the server and the browser                   | This repository  |
| `ionic-pwa`                                                 | An installable, offline-ready app built with Ionic components                                                | This repository  |
| `angular-native`                                            | A native iOS and Android app with Angular Native, opened in Expo Go                                          | This repository  |
| `angular-material`                                          | Angular Material components, themed with the project's design tokens                                         | This repository  |
| `tailwind-angular`                                          | Tailwind CSS utilities that use the project's design tokens                                                  | This repository  |

**Using them.** An agent picks a skill when your request matches it, and `PROJECT.md` tells agents which skill to load for which task. You can also name one: "Use the angular-developer skill to add a settings page."

**Where agents find them.** GitHub Copilot, Cursor, Codex, Gemini CLI, Antigravity, and OpenCode read `.agents/skills/`. Claude Code reads `.claude/skills/`, which links to the same folders.

**UI libraries are opt-in.** Agents add Angular Material or Tailwind only when you ask for one, and theme it with the tokens in `src/styles.scss`, so dark mode and color contrast keep working. Otherwise they style with component SCSS.

**Set up Impeccable once.** Run `/impeccable init` in your agent. It asks a few questions about your product and writes `PRODUCT.md`.

**Read Impeccable's scripts before your agent runs them.** They are in `.agents/skills/impeccable/scripts/`:

- `impeccable` (and `impeccable.cmd` on Windows) downloads a program, engine 0.1.11, from the project's GitHub releases into `~/.impeccable/`. It checks the download against a checksum published in the same release, then runs it.
- `live-browser*.js` is injected into your running app when you use Impeccable's live mode.
- `modern-screenshot.umd.js` is a minified third-party screenshot library.

### Secure data with Neon Auth, the Data API, and RLS

`neon-data-api-rls` teaches agents to let the browser query Neon directly through the Data API, while Postgres row-level security (RLS) decides what each signed-in user may see and change. It covers three rules you can combine:

| Rule    | Who sees what                                                                                    |
| ------- | ------------------------------------------------------------------------------------------------ |
| Owner   | Users see and change only their own rows, for example their own products                         |
| Admin   | Admins see and change everything                                                                 |
| Manager | Managers see the people below them in the reporting lines, at any depth, and those people's rows |

Roles and reporting lines live in a private database schema that users can't read or change. Every policy is checked by a persona test the agent runs on a Neon branch.

Neon's own skills recommend a server (Neon Functions) for new apps, because RLS that faces the browser is easy to get wrong. This skill follows Neon's security checklist for the Data API, and sends anything a policy can't express, such as payments or emails, to a Function.

### Design with pen.dev

[pen.dev](https://www.pen.dev/) is a design canvas that agents can draw on. Designs are `.pen` files that live in your repository next to the code. With `pen-dev-angular`, an agent can:

- design screens and components on the canvas, with this project's colors and spacing
- turn a design into Angular components
- redraw an existing Angular screen on the canvas
- keep pen.dev's variables and the tokens in `src/styles.scss` the same

The skill loads pen.dev's own instructions from pen.dev's MCP server, so they always match the pen.dev version you have. It adds this project's rules on top: Angular components instead of pen.dev's React examples, component SCSS instead of Tailwind, and accessibility checks.

To set it up:

1. Install the [pen.dev desktop app](https://www.pen.dev/downloads), or the pen.dev extension for VS Code or Cursor. VS Code suggests the extension when you open this folder.
2. Create or open a `.pen` file in a `design/` folder, for example `design/home.pen`.
3. In pen.dev, open **Settings → MCP** and turn on your agent. The list shows which agents your pen.dev version supports.
4. Restart your agent, then ask:

   > Use the pen-dev-angular skill to design a settings page in design/settings.pen, then build it in Angular.

Change `.pen` files only in pen.dev or through its MCP tools, never as text. Save and close a design before you switch branches or pull. If Git reports a conflict in a `.pen` file, keep both versions, start from one, and redo the other's changes in pen.dev.

[SKILLS.lock.md](SKILLS.lock.md) records the exact commit each skill came from. The skills made by this repository have no upstream source: each one is written from the official docs it links to, and its setup steps were run on this template.

## MCP servers

Skills tell agents how to work. MCP servers give them tools to act. This repository sets up two, and pen.dev adds a third when you install it.

### Angular CLI

Runs locally with `npx -y @angular/cli mcp`. Docs: https://angular.dev/ai/mcp

| Tool                        | What it does                                                       |
| --------------------------- | ------------------------------------------------------------------ |
| `get_best_practices`        | Returns Angular's rules for the installed version                  |
| `search_documentation`      | Searches angular.dev                                               |
| `list_projects`             | Lists the projects in `angular.json`                               |
| `run_target`                | Runs `build`, `test`, or another target                            |
| `devserver.start`           | Starts `ng serve` in the background                                |
| `devserver.wait_for_build`  | Returns the latest build output                                    |
| `devserver.stop`            | Stops the dev server                                               |
| `onpush_zoneless_migration` | Plans a move to OnPush and zoneless change detection, step by step |
| `ai_tutor`                  | Starts the [Angular AI tutor](#angular-ai-tutor)                   |

Angular CLI 22.2 names the three dev server tools `devserver_start`, `devserver_wait_for_build`, and `devserver_stop`.

### Neon

A remote server at `https://mcp.neon.tech/mcp`. It lets agents create tables and run queries in your Neon Postgres database. You sign in through your browser (OAuth), so there is no API key to store. Docs: https://neon.com/docs/ai/neon-mcp-server

### pen.dev

pen.dev's server, `pencil`, runs on your computer and works on the `.pen` file open in the pen.dev app or editor extension. It connects only while pen.dev is running with a `.pen` file open. Turning on your agent in pen.dev's **Settings → MCP** adds the server to that agent's own settings. It isn't in this repository's MCP files, because its command is a path on your computer. Docs: https://docs.pen.dev/getting-started/ai-integration

| Tool            | What it does                                                                                        |
| --------------- | --------------------------------------------------------------------------------------------------- |
| `get_app_state` | Shows which `.pen` file is open, what is selected, and which components it has                      |
| `read_skill`    | Returns pen.dev's instructions for agents                                                           |
| `execute`       | Runs a short script that reads or changes the design, takes screenshots, and exports images or HTML |
| `get_style`     | Lists and loads visual styles (fonts, colors, imagery) to start a design from                       |

The desktop app adds a `browser` tool, which can bring a running web page onto the canvas as editable layers.

### Which file each editor reads

| Editor                          | File                                                                              |
| ------------------------------- | --------------------------------------------------------------------------------- |
| Claude Code, GitHub Copilot CLI | `.mcp.json`                                                                       |
| VS Code                         | `.vscode/mcp.json` (VS Code's own format, with `servers` instead of `mcpServers`) |
| Cursor                          | `.cursor/mcp.json`, a link to `.mcp.json`                                         |
| Antigravity                     | `.antigravity/mcp.json`, a link to `.mcp.json`                                    |

Editors don't start a project's MCP servers until you approve them, and this repository approves nothing for you. In VS Code, open `.vscode/mcp.json` and click **Start**.

### Optional settings

None of these are turned on:

- Add `--read-only` to the Angular CLI `args` to allow only tools that don't change files. This removes `run_target` and the dev server start and stop tools.
- Add `--local-only` to allow only tools that work offline. This removes `search_documentation`.
- Use `https://mcp.neon.tech/mcp?readonly=true` as the Neon URL to allow only reading.

### Connect Neon

1. Approve the `Neon` server when your editor asks.
2. Sign in when your browser opens. In Claude Code, run `/mcp`, select **Neon**, and choose **Authenticate**. Then pick the Neon project the agent may use.
3. Ask your agent to create the table and its access rules:

   > Use the neon-data-api-rls skill to create a `notes` table that matches `src/app/features/notes/note.model.ts`, where each user sees only their own notes. Work on a Neon branch and run the persona test.

4. Ask it to connect the app:

   > Implement `NotesRepository` with the Neon Data API, following the neon-data-api-rls skill.

   The browser sends each query with the signed-in user's token and never holds a connection string.

Neon recommends its MCP server for development and testing, not for production data. `PROJECT.md` tells agents how to use it safely.

## Agent rules

| File         | What it is                                                                                                                                                                                                                               | Read by                                                               |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `AGENTS.md`  | Angular's official rules, unchanged, followed by a pointer to `PROJECT.md` and `APP.md`                                                                                                                                                  | GitHub Copilot, Cursor, Codex, JetBrains Junie, and most other agents |
| `PROJECT.md` | The template's rules: the app type, which skill to use for what, how to use the MCP servers, Neon safety, secrets, and AI features. Updating an app from the template replaces it.                                                       | Every agent, through `AGENTS.md`                                      |
| `APP.md`     | Rules for this app alone: what it is, the decisions made, and its conventions. It wins where it differs from `PROJECT.md`, except on secrets and Neon safety, and agents add lasting decisions to it. Template updates never replace it. | Every agent, through `AGENTS.md`                                      |
| `CLAUDE.md`  | Imports `AGENTS.md`, `PROJECT.md`, and `APP.md`                                                                                                                                                                                          | Claude Code                                                           |
| `GEMINI.md`  | A link to `AGENTS.md`                                                                                                                                                                                                                    | Gemini CLI, Antigravity                                               |

Angular publishes the same rules text under three names (`AGENTS.md`, `GEMINI.md`, and `guidelines.md` for Copilot), so one copy serves every editor. Angular's Cursor file, `angular-20.mdc`, is an older version of the same rules, so Cursor reads `AGENTS.md` instead.

## Templates

### App template (`src/`)

| Folder                    | What's there                                                             |
| ------------------------- | ------------------------------------------------------------------------ |
| `src/app/layout/`         | The header, a skip link, the main area, and focus handling between pages |
| `src/app/pages/home/`     | The home page, loaded only when visited                                  |
| `src/app/features/notes/` | A notes list with in-memory data, ready to switch to Neon                |

It uses Angular 22's defaults: standalone components, signals, Signal Forms, `@Service()`, zoneless change detection, and Vitest for tests. It passes axe accessibility checks in light and dark mode.

### WebMCP template (`templates/webmcp.example.ts`)

[WebMCP](https://angular.dev/ai/webmcp) lets an AI agent running in the browser call tools that your app provides, such as "add a note", instead of clicking through the page. Use this template to give every app made from this repository its own tools.

It is off by default: the file sits outside `src/`, so the app never loads it. To turn a piece on, copy it into `src/`:

| You want                                     | Copy                                                                                                                                                             | Into                                                |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| A tool the whole app offers                  | `provideExperimentalWebMcpTools([...])`                                                                                                                          | `providers` in `src/app/app.config.ts`              |
| A tool that exists only while a page is open | `provideExperimentalWebMcpTools([...])` in that route's `providers`, plus `withAutoCleanupInjectors()` in `provideRouter()` so the tool goes away when you leave | `src/app/app.routes.ts` and `src/app/app.config.ts` |
| A tool owned by a service                    | `declareExperimentalWebMcpTool({...})` inside a `@Service()`                                                                                                     | A root service                                      |
| A form that agents can fill in               | `experimentalWebMcpTool` in the `form()` options, plus `provideExperimentalWebMcpForms()`                                                                        | The form's component, and `src/app/app.config.ts`   |

Things to know:

- **WebMCP is experimental.** The [WebMCP spec](https://github.com/webmachinelearning/webmcp) changes often, and Angular can change these APIs in any release, not only in major versions.
- Tool names must be unique. Register tools in the app, a route, or a root service, not in a component that can appear twice.
- Angular does not check what an agent sends, so validate the input inside each tool.
- A form tool's input schema comes from the form's starting values, so use real values (`''`, `0`, a non-empty array), never `null`.
- In unit tests, use a mock such as [`@mcp-b/webmcp-polyfill`](https://www.npmjs.com/package/@mcp-b/webmcp-polyfill).

## Prettier

| File              | What it does                                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| `.prettierrc`     | The Angular CLI's default style: 100-character lines, single quotes, and the Angular parser for HTML |
| `.prettierignore` | Skips files copied from Angular and the skill authors, so updates stay exact                         |

To format the project, run `npx prettier --write .`

## Angular AI guides and example repositories

### The guides

Every page under https://angular.dev/ai:

| Guide                                                                  | What it covers                                                       |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [Build with AI](https://angular.dev/ai)                                | Adding AI features with Genkit, Firebase AI Logic, or the Gemini API |
| [LLM prompts and AI IDE setup](https://angular.dev/ai/develop-with-ai) | Angular's rules files for each editor                                |
| [Agent Skills](https://angular.dev/ai/agent-skills)                    | The two official Angular skills                                      |
| [Angular CLI MCP Server setup](https://angular.dev/ai/mcp)             | The MCP server and its tools                                         |
| [Angular AI Tutor](https://angular.dev/ai/ai-tutor)                    | An interactive tutor that teaches Angular                            |
| [Design patterns](https://angular.dev/ai/design-patterns)              | Using `resource`, `linkedSignal`, and streaming with LLM calls       |
| [WebMCP](https://angular.dev/ai/webmcp)                                | Giving in-browser agents tools                                       |

To give an AI tool more Angular context, point it at [llms.txt](https://angular.dev/llms.txt) (an index) or [llms-full.txt](https://angular.dev/assets/context/llms-full.txt) (the full guide, about 850 KB).

### Example repositories

These are the example apps the Build with AI guide links to. They are linked here, not copied.

| Example                                                                                                                  | What it shows                                              | Approach                          |
| ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- | --------------------------------- |
| [genkit-angular-starter-kit](https://github.com/angular/examples/tree/main/genkit-angular-starter-kit)                   | A first agentic app. The guide's suggested starting point. | Genkit, server-side               |
| [genkit-angular-story-generator](https://github.com/angular/examples/tree/main/genkit-angular-story-generator)           | A story generator with AI images                           | Genkit, server-side               |
| [dynamic-sdui-app](https://github.com/angular/examples/tree/main/dynamic-sdui-app)                                       | Screens generated at runtime from what the user asks       | Genkit, server-side               |
| [firebase-ai-logic-angular-example](https://github.com/angular/examples/tree/main/firebase-ai-logic-angular-example)     | A store with a chat agent that performs tasks              | Firebase AI Logic, in the browser |
| [ai-text-editor](https://github.com/FirebaseExtended/firebase-framework-tools/tree/main/starters/angular/ai-text-editor) | A text editor that refines, expands, and formalizes text   | Gemini API over HTTP              |
| [ai-chatbot](https://github.com/FirebaseExtended/firebase-framework-tools/tree/main/starters/angular/ai-chatbot)         | A chatbot                                                  | Gemini API over HTTP              |

Genkit runs on a server, so it needs a Node server or Angular SSR. This template is browser-only. The guide also links Genkit's step-by-step [Angular walkthrough](https://genkit.dev/docs/frameworks/angular/) and an [agentic barista app](https://developers.google.com/solutions/learn/agentic-barista).

### Rules for AI features

- **Keep keys off the client.** Never put an API key in `environments.ts` or in anything else the browser downloads. Use Firebase AI Logic for Google models in the browser. Send other providers through your own server, and keep server keys in environment variables or a secrets manager.
- **Tool calling stays in your code.** You decide which of your functions a model may ask to run. See [ai.service.ts](https://github.com/angular/examples/blob/main/firebase-ai-logic-angular-example/src/app/ai.service.ts) in the Firebase AI Logic example.
- **Expect varying answers.** Tune temperature and prompts ([prompting strategies](https://ai.google.dev/gemini-api/docs/prompting-strategies)). Keep a human in the loop, or constrain answers with a schema, before anyone acts on them. If the provider is down, keep the user's input, say what failed, and let them retry.

### Angular AI tutor

The tutor is opt-in. With the `angular-cli` MCP server running, prompt:

```text
launch the Angular AI tutor
```

If nothing happens, type `#angular-cli`, then paste `https://angular.dev/ai/ai-tutor`. The tutor teaches Angular by having you build a "Smart Recipe Box" app over 5 phases and 21 modules. That app is not the product of this template, so use a separate project or a throwaway branch. Report tutor bugs at https://github.com/angular/angular-cli/issues.

## Use this repository as a GitHub template

No file can mark a repository as a template. Open **Settings → General** and check **Template repository**, or run:

```sh
gh repo edit OWNER/REPO --template
```

**Use this template** copies files, not settings. **Settings → Copilot → MCP servers**, the MCP setup for Copilot's cloud agent, does not travel, so enter it again in each new repository. That agent runs tools without asking you, and it can't sign in to Neon. Start it with the Angular CLI server in read-only mode:

```json
{
  "mcpServers": {
    "angular-cli": {
      "type": "local",
      "command": "npx",
      "args": ["-y", "@angular/cli", "mcp", "--read-only"],
      "tools": ["*"]
    }
  }
}
```

## Keep everything up to date

Update the template first, then bring its updates into each app made from it.

### In the template

```sh
sh scripts/update-agent-files.sh
```

The script reinstalls the skills from their sources, refreshes Angular's rules at the top of `AGENTS.md`, and rewrites `SKILLS.lock.md`. It leaves the skills written for this repository alone. It also warns you if Angular ever stops publishing the same text for `GEMINI.md` and Copilot. Read `git diff` before you commit: these files steer what agents do.

### In an app made from the template

An app gets a copy of the template as it was on the day you made it. To bring in what changed in the template since, run this in the app:

```sh
npm run update-from-template
```

- **What it changes:** only the files the template owns: the skills, `AGENTS.md`, `CLAUDE.md`, `PROJECT.md`, the MCP settings, `scripts/`, and a few settings files. The list is `TEMPLATE_PATHS` at the top of `scripts/update-from-template.mjs`.
- **What it never changes:** the app's code, `package.json`, `angular.json`, `README.md`, `APP.md`, `preferences.json`, and any skill or script you added to the app. If the template added npm scripts, it lists them so you can copy the ones you want into `package.json`.
- **When both changed a file:** it merges the two. If the same lines changed on both sides, it marks them in the file, and you choose what to keep.
- **Nothing is committed.** Review the changes with `git diff --staged`, keep them with `git commit`, or undo the whole update with `git reset --hard`. It only runs when the app has no uncommitted changes, so that undo is safe.

The first time, it adds the template as a git remote called `template`. It remembers which template version each update brought in, in `.template-version`, so commit that file too.

An app made before this command existed doesn't have it yet. Run it once from the template's folder, for example `node ../angular-ai-template/scripts/update-from-template.mjs` inside the app. After that, the app has the script too; add the `update-from-template` line it lists to the app's `package.json`.

On 2026-10-03, all of Angular's official rules files downloaded without errors (no 404s).
