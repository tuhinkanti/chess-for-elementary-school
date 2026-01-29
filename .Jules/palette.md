## 2025-02-18 - Framer Motion Accessibility
**Learning:** This app uses `motion.div` for interactive cards (LessonCard, ProfileCard) without role="button" or keyboard support.
**Action:** When animating interactive elements with Framer Motion, prefer `motion.button` or explicitly add `role="button"` and keyboard handlers.
