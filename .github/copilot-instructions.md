# Copilot instructions for this repository

This file guides AI coding agents (Copilot-style) to be immediately productive in this workspace. The repository currently has no detected project manifests or README files; use the steps below to discover missing details and then iterate on these instructions.

1. Workspace overview
- Root: the workspace root may be at the VS Code workspace folder (for me: c:/Users/Personal/.vscode/Marketing Suite).
- If present, prioritize these files (in order) to infer architecture and workflows: `README.md`, `package.json`, `pyproject.toml`, `setup.py`, `go.mod`, `Cargo.toml`, `*.sln`, `.vscode/settings.json`.

2. Initial discovery steps (what the agent should run)
- Search for manifests and entrypoints: `**/package.json`, `**/pyproject.toml`, `**/README.md`, `**/src/**`, `**/cmd/**`.
- If none found, ask the repo owner these targeted questions:
  - What language(s) and runtime(s) power this project?
  - What commands build, test, and run the project locally?
  - Where are services, APIs, or deployment manifests located?

3. Architecture guidance (how to infer and document)
- Look for top-level folders named `src`, `api`, `backend`, `frontend`, `services`, `infrastructure` to identify service boundaries.
- Use manifest files to map packages to runtimes (e.g., package.json -> Node; pyproject.toml -> Python).

4. Developer workflows to capture
- Build: find the canonical build command in manifest scripts or CI workflows (search `.github/workflows/**`).
- Tests: find test commands in manifest scripts or common patterns (`npm test`, `pytest`, `go test`).
- Debugging: check for `.vscode/launch.json` or Dockerfiles for containerized debug flows.

5. Project-specific conventions to document (example checklist)
- Preferred lint/formatter and invocation (e.g., `eslint --ext .ts` or `black .`).
- Test naming/location conventions (e.g., `tests/` or `__tests__` folders).
- API contract patterns (OpenAPI files in `api/` or `spec/`) and typical client generation commands.

6. Integration points and external deps
- Search for env files, `.env`, `docker-compose.yml`, or `k8s/` to learn external services (databases, queues).
- When found, extract connection env var names (e.g., DATABASE_URL, REDIS_URL) and note required local services for development.

7. When merging existing Copilot/agent docs
- Preserve any existing `.github/copilot-instructions.md` content; merge only by:
  1. Keeping any explicit commands or workflows verbatim.
  2. Consolidating duplicates and adding missing discovery steps above.

8. What to include in a follow-up update once more files are discovered
- Concrete build/test commands with examples.
- Key files and their roles (e.g., `api/handlers.py` implements HTTP routes).
- One-line description of each top-level folder.

9. If uncertain, prefer short clarifying questions over guesses
- Example: "Is this repository a Node app providing an API, or a static website? Which command starts the dev server?"

---
If you (the human maintainer) want a more specific Copilot guide, please add at least one project manifest (package.json, pyproject.toml, README.md) or provide the build/test commands and I will update this file to include exact examples and references.
