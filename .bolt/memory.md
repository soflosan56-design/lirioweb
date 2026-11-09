# Project memory

## Product intent & audience

- Fashion platform ("lirioplatform") targeting users interested in sustainable fashion, independent designers, and editorial-style content.
- Core features: home page, clothing swap system, independent designer showroom, digital magazine (video + article sections).
- Includes an AI-powered chat/recommender system using OpenRouter free-tier models, now augmented with Tavily web search.

## Brand personality & voice

- Mixed-media scrapbook and Y2K editorial aesthetic — collage-like, layered, nostalgic early-2000s fashion magazine feel.
- User communicates in Spanish; UI copy and assistant responses should default to Spanish unless specified otherwise.

## Visual design & UX direction

- Aesthetic: mixed-media scrapbook + Y2K editorial — non-cookie-cutter, production-worthy designs expected.
- Framework: Vite + React with Tailwind CSS, Lucide React icons.
- Path alias `@/` maps to `src/` for imports.
- Avoid extra UI/theme/icon packages unless explicitly requested.

## Decisions, constraints & rationale

- Recommender uses OpenRouter free models with a 60-second timeout; shows a clear message instead of hanging indefinitely.
- OpenRouter free models require: (1) Model Training enabled in Settings > Privacy, (2) sufficient daily quota (~50 requests/day without credits).
- No additional UI packages beyond what the template provides (JSX, Tailwind, Lucide React, React hooks).
- Tavily API integrated into AI chat: performs web search before responding and cites sources when used.
- Tavily requires `TAVILY_API_KEY` secret configured in the project's Secrets screen; without it, chat falls back to non-search behavior.

## Open questions & assumptions

- Recommender reliability depends on OpenRouter account configuration (privacy settings, credits/quota).
- Tavily integration not yet tested live; needs verification with a current-events question after `TAVILY_API_KEY` is set.
- Exact Tailwind color palette, typography, and component patterns not yet specified — to be inferred from per-page requests.
- Clothing swap system workflow and designer showroom data model not yet detailed.