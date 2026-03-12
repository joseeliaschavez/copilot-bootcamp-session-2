# Coding Guidelines

This project values clarity over cleverness. Code should be easy to read, easy to change, and easy to verify. Every implementation choice should support long-term maintainability for both the backend and frontend packages.

Write small, focused modules with clear responsibilities. Prefer simple control flow, descriptive naming, and predictable function behavior. Keep business logic separated from framework and UI wiring so that logic can be tested independently and changed with confidence.

Consistency is a core quality goal. Follow existing project conventions for file organization, naming, and code structure before introducing new patterns. Match the style already present in a package unless there is a strong, documented reason to improve it.

Design code to be testable from the start. New features should include appropriate tests at the right level (unit, integration, or end-to-end) based on risk and behavior. Tests should be deterministic, isolated, and readable, with setup and teardown that support repeatable runs in local and CI environments.

Favor explicit error handling and user-friendly failure behavior. Validate inputs early, fail safely, and return actionable messages in API responses and UI feedback. Avoid hidden side effects and avoid swallowing errors that should be surfaced.

Use clear interfaces and stable contracts between layers. Backend endpoints should be predictable and version-friendly, and frontend code should consume data through well-defined adapter or service boundaries rather than spreading request logic across components.

Keep components and functions cohesive. If a file becomes difficult to scan or a function does more than one conceptual task, refactor into smaller units. Reuse shared utilities where appropriate, but avoid over-abstraction that makes common workflows harder to understand.

Code review quality is measured by behavior, safety, and maintainability. Changes should preserve existing functionality unless intentional, include tests for meaningful behavior, and document important decisions when tradeoffs exist.

Performance and accessibility are part of quality, not afterthoughts. Prefer efficient rendering patterns in the frontend, avoid unnecessary backend work, and ensure UI interactions remain usable across common devices and input methods.

Finally, optimize for teamwork. Leave the codebase easier to navigate than you found it by choosing clear names, removing dead code, and writing concise comments only where intent is not obvious from the code itself.
