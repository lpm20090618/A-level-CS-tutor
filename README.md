# A-Level CS Tutor 9618 (AI-Powered)

An intelligent, adaptive learning platform designed specifically for **Cambridge International AS & A Level Computer Science (9618)**. This application combines advanced AI tutoring with a structured learning path, gamification, and specialized tools like a code sandbox and intelligent grader to create a comprehensive study environment.

**Built with:** React, Tailwind CSS, Google Gemini API (Pro & Flash models).

## ✨ Key Features

### 🧠 AI Tutor Chat
-   **Context-Aware**: Remembers conversation history for seamless tutoring.
-   **Multi-Persona**: Switch between **Standard** (Teacher), **Socratic** (Guide), and **Examiner** (Assessor) modes.
-   **Rich Media**: Supports image and video uploads for analysis.
-   **Thinking Mode**: Uses `gemini-3-pro-preview` with extended thinking budget for complex logic problems.
-   **Search Grounding**: Fetches real-time information via Google Search to ensure up-to-date answers.
-   **Code & Math**: Beautiful rendering of syntax-highlighted code blocks and LaTeX math formulas.

### 🎮 Gamified Learning Hub (Dashboard)
-   **XP System**: Earn experience points for every action (chatting, coding, quizzing).
-   **Streaks & Levels**: Track daily consistency and long-term progress.
-   **Skill Tree**: Visual progress tracking across the 9618 syllabus units.
-   **Achievements**: Unlock badges for milestones (e.g., "3-Day Streak", "Code Runner").

### 📝 Intelligent Grader
-   **Auto-Marking**: Upload pseudocode, code files, or written theory answers.
-   **Examiner Feedback**: AI acts as a Cambridge examiner, providing a grade (A*-U) and detailed, actionable feedback based on the 9618 marking scheme.
-   **Effort Reward**: Earn XP just for submitting work and engaging with the feedback.

### 💻 Code Sandbox
-   **Multi-Language**: Write and execute Python, Java, VB.NET, or Pseudocode.
-   **AI Analysis**: "Run" your code to get an AI simulation of the output, Big O complexity analysis, and debugging tips.
-   **Detached UI**: Floating editor and output panels for a clean coding experience.

### 📚 Adaptive Quiz Mode
-   **Syllabus Aligned**: Generate unlimited multiple-choice questions based on specific 9618 topics (e.g., "Information Representation", "FSM").
-   **Combo System**: Build combos for correct answers to earn bonus XP.
-   **Instant Feedback**: Detailed explanations for every correct and incorrect answer.

### 📖 Mistakes Book (Weakness Tracker)
-   **Revision Deck**: Manually save tricky concepts or let the system track them.
-   **Spaced Repetition**: "Review" cards daily to strengthen memory and earn XP.
-   **Topic Tagging**: Organize mistakes by syllabus area.

### 🎨 Image Studio
-   **Visual Learning**: Generate diagrams or visualizations for CS concepts using `gemini-3-pro-image-preview`.
-   **Image Editing**: Modify existing diagrams or reference images using natural language prompts via `gemini-2.5-flash-image`.

### 🎙️ Live Tutor
-   **Real-time Voice**: Have a natural, spoken conversation with the AI tutor using `gemini-2.5-flash-native-audio`.
-   **Low Latency**: Experience immediate voice feedback for rapid-fire Q&A sessions.

## 🛠️ Tech Stack & Architecture

-   **Frontend**: React 18, TypeScript, Vite.
-   **Styling**: Tailwind CSS with a custom **Glassmorphism** design system (Apple-style aesthetics).
-   **AI Core**: `@google/genai` SDK interfacing with Gemini 3 Pro, 2.5 Flash, and Imagen models.
-   **State Management**: Local React State + LocalStorage for persistence.
-   **Rendering**: `marked` (Markdown), `highlight.js` (Code), `katex` (Math), `mermaid` (Diagrams).

## 🚀 Getting Started

1.  **Clone the repository**.
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Set up Environment Variables**:
    -   Create a `.env` file.
    -   Add your Google Gemini API Key: `API_KEY=your_api_key_here`.
4.  **Run Development Server**:
    ```bash
    npm run dev
    ```
5.  **Build for Production**:
    ```bash
    npm run build
    ```

## 🎨 Design Philosophy

The UI follows a strict **"Floating Glass"** aesthetic:
-   **Rounded Everything**: `rounded-[2.5rem]` for main containers, `rounded-[2rem]` for panels.
-   **Detached Headers**: Section titles float above their content panels.
-   **Physics-based Animations**: Smooth `cubic-bezier` transitions for all interactions.
-   **Tiered Shadows**: Depth is communicated through 3 distinct shadow levels (`--shadow-low`, `--mid`, `--high`).
-   **Translucency**: Extensive use of `backdrop-filter: blur` to create a modern, premium feel.

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## 📄 License

MIT License. Designed for educational use.
