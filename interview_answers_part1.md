# Interview Preparation: AI Legal Summarizer (Answers - Part 1)

This document provides detailed, professional answers to the potential interview questions for the AI Legal Summarizer project.

---

## 🏛️ Architecture & System Design (15 Questions)

1.  **Give a high-level overview of the project architecture.**
    *   **Answer:** The project uses a modern full-stack architecture: a **React 18 SPA** for the frontend, an **Express (Node.js)** server for orchestration, and a **FastAPI (Python)** backend for the AI/RAG heavy lifting. Data is persisted in **SQLite** using **SQLAlchemy** (backend) and accessed via **Axios** on the frontend. The AI logic uses **LangChain** to interface with **OpenRouter (LLMs)**.

2.  **Why did you choose a monolithic repository (Monorepo) structure versus separate microservices?**
    *   **Answer:** A monorepo simplifies dependency management and allows for "Shared Types" (`shared/api.ts`). This ensures that if the API response changes in the backend, the frontend types update immediately, preventing runtime errors. It also makes deployment to platforms like Netlify/Render easier to coordinate for an MVP.

3.  **Explain the data flow from the moment a user uploads a PDF to the final summary display.**
    *   **Answer:** User uploads PDF → React sends `FormData` to Express → Express proxies/routes to FastAPI → FastAPI saves to a `NamedTemporaryFile` → RAGManager extracts text and chunks it → LLM generates summary → Result is saved to SQLite and returned to Frontend → Frontend updates state via React Query and displays the data.

4.  **How do you handle communication between the React frontend and the Express backend?**
    *   **Answer:** We use **Axios** with a specialized configuration (`client/lib/axios.ts`) that handles base URLs, headers, and error interceptors. This ensures consistent communication and easy token management for authenticated requests.

5.  **What were the biggest architectural challenges you faced when building this?**
    *   **Answer:** Coordinating two different backends (Express and FastAPI) while maintaining a seamless developer experience (Vite dev server) was a challenge. Also, optimizing the RAG pipeline to run on Render's 512MB RAM free tier required careful memory management (No local Vector DB).

6.  **How would you scale this application to handle 10,000 concurrent users?**
    *   **Answer:** 1. Move to a managed database like **Supabase/PostgreSQL**. 2. Use **Redis** for caching frequent summaries. 3. Implement a **Task Queue (Celery/RabbitMQ)** for PDF processing so the API remains responsive. 4. Scale the FastAPI worker nodes horizontally.

7.  **Why did you choose the "@shared" path alias for types?**
    *   **Answer:** It provides a "Single Source of Truth." Both frontend and backend developers use the exact same TypeScript interfaces, reducing bugs caused by mismatched API contracts.

8.  **If you had to replace Express with a serverless architecture (like AWS Lambda), how would it change the system?**
    *   **Answer:** The API would become stateless. We'd need to move local file storage to **AWS S3** and handle authentication via **AWS Cognito** or a third-party like Auth0. Cold starts might impact the "snappiness" of the UI.

9.  **How is state managed in the frontend? Why did you pick that approach?**
    *   **Answer:** Local state via `useState`, Global Auth/Theme via `Context API`, and Server state via **React Query**. This separation prevents "Prop Drilling" and ensures that data is cached and synchronized with the backend automatically.

10. **Explain the decision-edge between running logic on the client versus the server in this app.**
    *   **Answer:** Security and Complexity. Logic requiring private API keys (OpenRouter) or heavy computation (PDF extraction) stays on the server. UI-related logic (animations, input validation) stays on the client for immediate feedback.

11. **How does the application handle large file uploads without crashing the server?**
    *   **Answer:** We use FastAPI's `UploadFile` which is a **SpooledTemporaryFile**. It stores files in RAM for small uploads and rolls over to disk for larger ones, preventing RAM exhaustion.

12. **What database would you choose for storing these summaries and why?**
    *   **Answer:** For the MVP, **SQLite** for its simplicity. For production, **PostgreSQL** due to its robust support for JSONB (storing AI results) and full-text search capabilities.

13. **How do you ensure the system is "production-ready"?**
    *   **Answer:** 1. Environment variable isolation. 2. Comprehensive error handling (Try/Catch + Interceptors). 3. Type safety. 4. Automated Vitest suite. 5. Secure CORS and Session management.

14. **Explain the role of Vite in your development and build process.**
    *   **Answer:** Vite acts as the build tool and development server. It provides **HMR (Hot Module Replacement)** for rapid UI development and uses Rollup for optimized production builds (Tree-shaking, minification).

15. **How would you implement a "Revision History" feature for documents?**
    *   **Answer:** I would add a `revisions` table in the database linked to the `document_id`, storing timestamps and the full summary JSON for each "snapshot" taken during the user's workflow.

---

## 🧠 AI, RAG & LLM Engineering (20 Questions)

16. **What is RAG (Retrieval-Augmented Generation) and how is it used here?**
    *   **Answer:** Retrieval-Augmented Generation. Instead of the AI "guessing" facts, we **retrieve** relevant text from the uploaded PDF, **augment** the prompt with that text, and then have the AI **generate** a summary based *only* on that verified content.

17. **Explain your "Semantic Chunking" strategy. Why not just send the whole PDF?**
    *   **Answer:** Documents are split into segments that capture "complete thoughts." We use `RecursiveCharacterTextSplitter` with specialized delimiters (like double newlines) to ensure legal clauses aren't cut in half. Whole PDFs often exceed the AI's "Context Window" limit.

18. **How do you handle the context window limits of the LLM?**
    *   **Answer:** By using chunking. We analyze the document in segments (max 7000 chars) and then perform a **final synthesis pass** where the AI summarizes the intelligence gathered from all segments into one coherent report.

19. **What is "Token Overlap" in chunking, and why is it critical for legal documents?**
    *   **Answer:** It's the practice of repeating a small portion of the previous chunk in the next one. This ensures that context (like the subject of a sentence) isn't lost when a document is sliced into pieces.

20. **How do you prevent "hallucinations" in the legal summaries?**
    *   **Answer:** 1. Temperature set to 0.1 (low randomness). 2. Strict system prompts telling the AI "Answer only based on the provided text." 3. Including source citations to allow human verification.

21. **How did you design the prompts for components like the "Legal Timeline"?**
    *   **Answer:** The prompt instructs the AI to search specifically for dates and associated events, then return them as a structured JSON array (`[{date, event, importance}]`) for the frontend to render.

22. **Explain the difference between "executive summary" and "page-wise intelligence" in your prompt architecture.**
    *   **Answer:** Executive summary is a high-level narrative. Page-wise intelligence is a granular extraction of specific risks and obligations found on every single page, providing a "Deep Dive" view.

23. **How does the system extract "Entities" and "Relationships" from unstructured text?**
    *   **Answer:** By using **Named Entity Recognition (NER)** patterns inside the prompt. We provide a schema (People, Organizations, Dates) and the LLM maps text segments into these categories.

24. **Why did you use JSON-mode or structured output for the AI responses?**
    *   **Answer:** It guarantees that the output satisfies a specific schema, allowing the frontend to confidently map properties like `risks` or `timeline` directly into UI components without manual parsing.

25. **What happens if the AI returns a malformed JSON? How does your parser handle it?**
    *   **Answer:** We use **Pydantic** validation in FastAPI and a robust try/catch block. If it fails, we fall back to a basic narrative summary and log the error for prompt refinement.

26. **Have you experimented with different models (Gemini 2.0 vs GPT-4)? What were the trade-offs?**
    *   **Answer:** Gemini 2.0 has a massive context window but GPT-4 tends to be more precise with structured JSON output. We used OpenRouter to easily swap between them based on performance/cost.

27. **How do you measure the quality or accuracy of the generated summaries?**
    *   **Answer:** Currently via manual verification (comparing to original PDF). Future improvement: Using **RAGAS** or **G-Eval** to have an LLM-as-a-judge score the summaries for faithfulness and relevance.

28. **Explain the "Distributed Analysis" concept in your engineering animation.**
    *   **Answer:** It’s a UI metaphor for how we process chunks in parallel across different prompt passes, visually represented by the "pulse" animations in the Deep Analysis suite.

29. **How would you implement "Source Citations" so users can verify where a fact came from?**
    *   **Answer:** I would store the `page_number` and `exact_text_snippet` with every extracted insight. The AI would be prompted to return these as part of its structured JSON (`"source": {"page": 5, "text": "..."}`).

30. **How do you handle "Legal Latin" or complex jargon in the AI prompts?**
    *   **Answer:** By including a "Dictionary" pass in the prompt, where the AI is instructed to identify complex terms and provide a "plain language" definition for the final report.

31. **Can the system handle multi-lingual legal documents? If not, how would you add it?**
    *   **Answer:** Current models are multi-lingual. We could add a simple prompt instruction: "Analyze the document in its native language but provide the summary in [User Preferred Language]."

32. **What is the "System Instruction" and how does it differ from a "User Prompt"?**
    *   **Answer:** System Instruction sets the "Persona" and "Rules" (e.g., "You are a senior lawyer... do not lie"). User Prompt is the specific task ("Summarize page 2"). System instructions are harder to override by accident.

33. **How do you handle documents that are 500+ pages long?**
    *   **Answer:** I would implement **Map-Reduce**. Summarize groups of 50 pages into small summaries, then summarize those tiny summaries into a final master report.

34. **If the AI model is slow, how do you manage the user experience?**
    *   **Answer:** We use **Optimistic UI** (showing the sidebar early) and **Step-Progress Indicators** (Engineering Pipeline) so the user knows exactly what stage the analysis is at.

35. **Explain the "Risk Severity Scoring" logic—is it purely AI or hardcoded heuristics?**
    *   **Answer:** It’s a hybrid. The AI suggests a score (0-100), but we use code-based logic (Heuristics) to categorize those scores into "Low," "Medium," or "High" for UI styling.

---

## 💻 Backend Engineering (15 Questions)

36. **How do you structure your Express routes for maintainability?**
    *   **Answer:** We use the "Router Pattern" (`server/routes/`). Each feature area (Auth, Summaries, Files) gets its own file, which is then imported and mounted in the main `index.ts`.

37. **Explain the middleware used for processing file uploads (e.g., Multer).**
    *   **Answer:** Multer handles the `multipart/form-data`. It intercepts the bits of the file as they arrive, stores them in a `/uploads` folder, and adds a `req.file` object to the next function in the chain.

38. **How do you handle environment variables safely in the backend?**
    *   **Answer:** We use `dotenv` and never commit the `.env` file to Git. For production (Render), we manually add these variables into the dashboard's "Environmental Variable" settings.

39. **How would you implement Rate Limiting to prevent API abuse?**
    *   **Answer:** Using `express-rate-limit`. I would set a limit (e.g., 5 uploads per hour per IP) to prevent malicious users from draining our API budget.

40. **What is the significance of the `/api/` prefix in your routing?**
    *   **Answer:** It separates the "Data API" from the "Static File Server" (frontend). This makes it easier to route traffic through load balancers or proxy servers Nginx.

41. **How do you handle asynchronous errors in your Express handlers?**
    *   **Answer:** We use an `asyncHandler` wrapper or simple try/catch blocks that pass any errors forward to the `next(error)` function, which is caught by a global error handler middleware.

42. **Explain how you share TypeScript interfaces between the server and the client.**
    *   **Answer:** Using TypeScript "Path Aliases." In `tsconfig.json`, we map `@shared/*` to the `shared/` folder. This allows both React and Node to `import { MyType } from '@shared/api'`.

43. **How would you implement a Webhook to notify users when a long summary is done?**
    *   **Answer:** When the deep analysis starts, I'd save a "Pending" status to the DB. Once finished, the backend would call a predefined URL (like a Discord bot or a user's server) with the results payload.

44. **What is the purpose of `express.json()` and `express.urlencoded()`?**
    *   **Answer:** They are body-parsers. `json()` lets us read `req.body` as a JavaScript object, and `urlencoded()` handles data from traditional HTML form submissions.

45. **How do you handle CORS in this application?**
    *   **Answer:** Using the `cors` middleware. We specify `origin: ["http://localhost:5173"]` to allow the frontend to talk to the backend while blocking other unauthorized domains.

46. **How would you add Authentication (JWT vs Sessions) to this project?**
    *   **Answer:** I would use **JWT (JSON Web Tokens)**. When a user logs in, the server sends a signed token. The client stores it in `localStorage` and sends it back in the `Authorization` header for every request.

47. **Explain the lifecycle of a request in your backend.**
    *   **Answer:** 1. Request hits Express. 2. CORS check. 3. Body/JSON parser. 4. Auth Middleware. 5. Route Handler logic. 6. AI/Database call. 7. JSON Response sent back.

48. **How would you structure a "Job Queue" for background processing of PDFs?**
    *   **Answer:** I would use **BullMQ (Redis-based)**. Express would "push" a job ID to the queue. A separate "Worker Process" would pick up the PDF, do the AI work, and then mark the job as "Complete."

49. **How do you log server-side errors efficiently?**
    *   **Answer:** Using **Winston** or **Pino**. These loggers allow us to save errors to a file or stream them to a service like **Sentry** for real-time alerts.

50. **Describe a specific bug you found in the backend and how you fixed it.**
    *   **Answer:** I noticed that if the AI returned text *before* the JSON started, the parser would break. I fixed this by using a `regex` to find the first `{` and last `}` in the AI response before parsing.
