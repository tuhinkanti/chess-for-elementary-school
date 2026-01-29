# Chess Kids - Design Document

A progressive chess learning app for 5-year-olds.

## Quick Start

```bash
cd chess-kids
npm install
npm run dev      # Start development server
npm run test:run # Run tests
npm run build    # Production build
```

## Architecture Overview

```
src/
├── components/          # Reusable UI components
│   ├── ChessBoard.tsx   # Interactive chess board (uses react-chessboard)
│   ├── ExploreBoard.tsx # Tap-only board for exploration lessons (no pieces)
│   ├── Celebration.tsx  # Star reward animation overlay
│   ├── LessonCard.tsx   # Lesson selection card on home
│   ├── ProfileBadge.tsx # Current player avatar/name
│   └── StarCounter.tsx  # Star count display
├── context/
│   └── ProfileContext.tsx # Player profiles & progress state
├── data/
│   ├── lessons.ts       # Lesson metadata (titles, stories, icons)
│   ├── lessonEngine.ts  # Objective validation logic
│   └── profiles.ts      # Profile types and avatar options
├── pages/
│   ├── Home.tsx         # Lesson selection grid
│   ├── LessonPage.tsx   # Main lesson gameplay
│   └── ProfileSelect.tsx # Profile creation/selection
└── test/
    └── setup.ts         # Vitest setup
```

## Core Concepts

### 1. Profiles
- Multiple children can have separate profiles
- Each profile stores: name, avatar emoji, stars earned, completed lessons
- Stored in localStorage under `chess-kids-profiles`

### 2. Lessons
- 10 progressive lessons, unlocked by earning stars
- Each lesson has 3 objectives to complete
- Completing all objectives = 3 stars earned

### 3. Lesson Types

| Type | Board Used | Description |
|------|------------|-------------|
| `explore-board` | ExploreBoard | No pieces, just tap squares to learn the board |
| `piece-movement` | ChessBoard | Learn how specific pieces move |
| `capture` | ChessBoard | Practice capturing opponent pieces |
| `checkmate` | ChessBoard | Find checkmate patterns |
| `free-play` | ChessBoard | Free play mode |

## Lesson Flow

```
1. User selects lesson → LessonPage loads
2. Story intro shown → User taps "Let's Practice!"
3. Board appears with current objective highlighted
4. User completes objectives one by one:
   - lessonEngine validates each action
   - Progress indicator updates (e.g., "3/5 squares")
   - Checkmark appears on completed objectives
5. All objectives done → Celebration animation
6. Stars added → Auto-advance to next lesson
```

## Objective Validators

Defined in `src/data/lessonEngine.ts`:

| Validator Type | What It Checks | Used In |
|----------------|----------------|---------|
| `tap-squares` | User tapped N unique squares | Lesson 1 |
| `tap-corners` | User tapped all 4 corner squares (a1, a8, h1, h8) | Lesson 1 |
| `count-confirm` | User selects correct number answer | Lesson 1 |
| `move-piece` | User made a valid chess move | Lessons 2-7 |
| `capture` | User captured an opponent piece | Lesson 8 |
| `any-moves` | User made N moves | Lessons 8-10 |

## Recent Fixes

### Fix 1: Count Question UX ✅
**Files:** `src/components/NumberPicker.tsx`, `src/pages/LessonPage.tsx`  
**Solution:** Added NumberPicker component with buttons 1-8. Only correct answer (8) advances.

### Fix 2: Lesson 2 Shows All Pieces ✅
**File:** `src/data/lessonEngine.ts`  
**Solution:** Changed FEN from single pawn to full starting position so user can see and move pieces.

### Fix 3: Board Selection Logic ✅
**File:** `src/pages/LessonPage.tsx`  
**Solution:** Added `showNumberPicker` check before `isExploreBoardLesson` to show correct UI per objective type.

## Testing

### Run Tests
```bash
npm run test:run  # Single run
npm test          # Watch mode
```

### Test Coverage
Tests are in `src/data/lessonEngine.test.ts` covering:
- Initial state creation
- Square tap tracking
- Corner detection
- Move counting
- Objective completion for all lesson types

### Manual Testing Checklist

1. **Profile Flow**
   - [ ] Can create new profile with name and avatar
   - [ ] Can switch between profiles
   - [ ] Progress saves per profile

2. **Lesson 1: Meet the Board**
   - [ ] ExploreBoard shows (no pieces, just squares)
   - [ ] Objective 1: Tapping 5 squares shows progress (1/5, 2/5...)
   - [ ] Objective 2: Corner squares highlighted with ★, turn to ✓ when tapped
   - [ ] Objective 3: Number picker appears (1-8), selecting 8 completes it

3. **Lesson 2: Pawn Movement**
   - [ ] ChessBoard shows with pawn piece visible
   - [ ] Tapping pawn shows valid move squares (green dots)
   - [ ] Making a move completes the objective

4. **Lesson Completion**
   - [ ] Celebration shows after all objectives done
   - [ ] 3 stars awarded
   - [ ] Next lesson unlocks

## File-by-File Guide

### `src/data/lessonEngine.ts`
Core validation logic. Export:
- `lessonConfigs` - objective definitions per lesson
- `checkObjectiveComplete()` - validates if objective is done
- `handleSquareTap()` - updates state when square tapped
- `handleMove()` - updates state when chess move made

### `src/pages/LessonPage.tsx`
Main lesson gameplay. Key logic:
- Loads config from `lessonConfigs[lessonId]`
- Chooses `ExploreBoard` vs `ChessBoard` based on `config.type`
- Calls `checkAndAdvance()` after each user action
- Shows celebration when all objectives complete

### `src/components/ChessBoard.tsx`
Wrapper around react-chessboard v5. Props:
- `fen` - starting position (FEN string)
- `onMove(from, to, isCapture)` - callback when move made
- `boardSize` - pixel width/height

### `src/components/ExploreBoard.tsx`
Simple 8x8 grid for tap interaction. Props:
- `tappedSquares` - Set of tapped square IDs
- `tappedCorners` - Set of tapped corner IDs
- `onSquareTap(square)` - callback when square tapped
- `highlightCorners` - show ★ on corner squares

## Adding a New Lesson

1. Add metadata in `src/data/lessons.ts`:
```typescript
{
  id: 11,
  title: "New Lesson",
  icon: "🎯",
  description: "...",
  storyIntro: "...",
  objectives: ["Obj 1", "Obj 2", "Obj 3"],
  unlockStars: 30
}
```

2. Add config in `src/data/lessonEngine.ts`:
```typescript
11: {
  id: 11,
  type: 'piece-movement',
  fen: '...', // FEN string for starting position
  objectives: [
    { id: 'obj-1', description: '...', validator: { type: 'move-piece' } },
    // ...
  ]
}
```

3. Add tests in `src/data/lessonEngine.test.ts`

## Dependencies

| Package | Purpose |
|---------|---------|
| react-chessboard | Chess board UI component (v5 API) |
| chess.js | Chess move validation |
| framer-motion | Animations |
| react-router-dom | Page routing |
| lucide-react | Icons |
| vite-plugin-pwa | Mobile PWA support |

## PWA / Mobile

The app is configured as a Progressive Web App:
- Can be "installed" on mobile home screen
- Works offline after first load
- Touch-friendly large buttons
- Responsive layout

Config in `vite.config.ts`.
