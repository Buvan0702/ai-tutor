# **App Name**: Quiz AI

## Core Features:

- User Authentication: User authentication via email/password or Google Sign-In using Firebase Auth.
- Topic Input: Input field for users to enter a programming topic to generate questions.
- MCQ Generation: Fetch 3-5 multiple-choice questions related to the user-specified topic using the Gemini API tool.
- MCQ Display: Display MCQs one by one, with 4 options each, for the user to answer.
- Real-time Feedback: Check the correctness of the selected answer and provide instant feedback with a brief explanation.
- Performance Statistics: Display performance graphs using Chart.js or ECharts, showing accuracy, topic-wise performance, and historical attempts over time.
- Session Management with Redis: Use Redis to cache current session’s questions and selected answers to improve API response speed.

## Style Guidelines:

- Primary color: Saturated blue (#3F51B5) to reflect intellect, focus and trust.
- Background color: Light blue (#E8EAF6) to provide a calm and focused learning environment.
- Accent color: Violet (#9575CD) to create contrast and highlight interactive elements.
- Headline font: 'Space Grotesk' (sans-serif) for headlines; Body font: 'Inter' (sans-serif) for readability. These fonts are a pairing.
- Simple, clean icons for navigation and feedback (e.g., checkmark for correct, cross for incorrect).
- Clean, card-based layout to present questions and options clearly, ensuring readability and focus.
- Subtle animations for feedback and transitions, enhancing user experience without being distracting.
- 3D renderings and motions to create an eye-catching website with smooth performance.