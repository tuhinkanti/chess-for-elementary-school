export interface Lesson {
  id: number;
  chapter: string;
  title: string;
  icon: string;
  description: string;
  storyIntro: string;
  piece?: string;
  objectives: string[];
  unlockStars: number;
}

export const lessons: Lesson[] = [
  // CHAPTER 1: Meet Your Army
  {
    id: 1,
    chapter: "Chapter 1: Meet Your Army",
    title: "The King",
    icon: "👑",
    piece: "k",
    description: "The Most Important Coward",
    storyIntro: "Meet the King! He is the most important piece, but he's also a bit of a coward. He only takes one tiny step at a time because his crown is too heavy! If he gets trapped, the game is over. Keep him safe!",
    objectives: [
      "Move the King one step",
      "Don't let him get captured",
      "Keep the King safe"
    ],
    unlockStars: 0
  },
  {
    id: 2,
    chapter: "Chapter 1: Meet Your Army",
    title: "The Queen",
    icon: "👸",
    piece: "q",
    description: "The Superhero",
    storyIntro: "The Queen is the strongest piece! She's a Superhero who can move as far as she wants in any direction—straight or diagonal. She protects the King because mommies always know best!",
    objectives: [
      "Move like a Rook (Straight)",
      "Move like a Bishop (Diagonal)",
      "Capture a piece"
    ],
    unlockStars: 3
  },
  {
    id: 3,
    chapter: "Chapter 1: Meet Your Army",
    title: "The Rooks",
    icon: "🏰",
    piece: "r",
    description: "The Castle Towers",
    storyIntro: "Rooks look like castle towers. They are strong guards that slide in straight lines—up, down, left, or right. Imagine a train on tracks!",
    objectives: [
      "Move in a straight line",
      "Slide across the board",
      "Capture a piece"
    ],
    unlockStars: 6
  },
  {
    id: 4,
    chapter: "Chapter 1: Meet Your Army",
    title: "The Bishops",
    icon: "⛪",
    piece: "b",
    description: "The Diagonal Runners",
    storyIntro: "Bishops wear pointy hats, so they move pointy (diagonally)! They zoom across the board in an X shape. A Bishop stays on its starting color forever!",
    objectives: [
      "Move diagonally",
      "Stay on your color",
      "Capture a piece"
    ],
    unlockStars: 9
  },
  {
    id: 5,
    chapter: "Chapter 1: Meet Your Army",
    title: "The Knights",
    icon: "🐴",
    piece: "n",
    description: "The Jumping Horses",
    storyIntro: "Knights are magical horses that can JUMP over other pieces! They move in an L-shape: 2 steps one way, then 1 step the other way. Hop, hop, hooray!",
    objectives: [
      "Jump in an L-shape",
      "Hop over a piece",
      "Capture a pawn"
    ],
    unlockStars: 12
  },
  {
    id: 6,
    chapter: "Chapter 1: Meet Your Army",
    title: "The Pawns",
    icon: "👶",
    piece: "p",
    description: "The Brave Little Soldiers",
    storyIntro: "Pawns are brave little soldiers that form a wall. They only move forward! On their first turn, they can run 2 steps. After that, only 1 step. But watch out—they capture diagonally!",
    objectives: [
      "Move forward 1 step",
      "Run forward 2 steps",
      "Capture diagonally"
    ],
    unlockStars: 15
  },

  // CHAPTER 2: Setting Up the Battle
  {
    id: 7,
    chapter: "Chapter 2: Setting Up the Battle",
    title: "Ready for Battle",
    icon: "⚔️",
    description: "Queens on their own color!",
    storyIntro: "Time to set up the battlefield! Remember the Magic Sentence: 'Queens on their own color!' Rooks go in corners, Knights next to them, then Bishops. The King and Queen go in the middle.",
    objectives: [
      "Find the Rooks' corners",
      "Find the Queen's home",
      "Check: Light is Right!"
    ],
    unlockStars: 18
  },

  // CHAPTER 3: How to Win
  {
    id: 8,
    chapter: "Chapter 3: How to Win",
    title: "Checkmate!",
    icon: "🎯",
    description: "Trap the Enemy King",
    storyIntro: "The goal is to trap the enemy King! 'Check' means 'Watch out!' 'Checkmate' means 'Game Over!' The King is trapped and has nowhere to run.",
    objectives: [
      "Put the King in Check",
      "Find a Checkmate",
      "Win the game!"
    ],
    unlockStars: 21
  },

  // CHAPTER 4: Special Super Moves
  {
    id: 9,
    chapter: "Chapter 4: Special Super Moves",
    title: "Castling",
    icon: "🏃",
    description: "The King's Escape Tunnel",
    storyIntro: "Castling is a special move to get the King safe. The King moves 2 steps toward the Rook, and the Rook jumps over him! You can only do this if they haven't moved yet.",
    objectives: [
      "Clear the path",
      "Castle Kingside",
      "Castle Queenside"
    ],
    unlockStars: 24
  },
  {
    id: 10,
    chapter: "Chapter 4: Special Super Moves",
    title: "En Passant",
    icon: "👻",
    description: "The Sneaky Capture",
    storyIntro: "This is a secret move! If an enemy pawn runs 2 steps and lands right next to you, you can capture it as if it only moved 1 step. Sneaky!",
    objectives: [
      "Wait for the big step",
      "Capture En Passant",
      "Finish the lesson"
    ],
    unlockStars: 27
  },

  // CHAPTER 5: Fun Practice Games
  {
    id: 11,
    chapter: "Chapter 5: Fun Practice Games",
    title: "Pawn Wars",
    icon: "🏁",
    description: "Race to the other side!",
    storyIntro: "It's a race! The first person to get a pawn to the other side wins! Remember, if a pawn reaches the end, it becomes a Queen!",
    objectives: [
      "Move your pawns",
      "Promote to a Queen",
      "Win the race"
    ],
    unlockStars: 30
  },
  {
    id: 12,
    chapter: "Chapter 5: Fun Practice Games",
    title: "Knight's Adventure",
    icon: "🦄",
    description: "Capture all the pawns",
    storyIntro: "Your Knight is hungry! Can you capture all the enemy pawns? Watch out for their attacks!",
    objectives: [
      "Capture a pawn",
      "Capture 4 pawns",
      "Capture all 8 pawns!"
    ],
    unlockStars: 33
  },
  {
    id: 13,
    chapter: "Chapter 5: Fun Practice Games",
    title: "Capture the Flag",
    icon: "🚩",
    description: "Capture the Queen to win!",
    storyIntro: "In this game, the Queen is the Flag. Whoever captures the enemy Queen first wins! Protect your Queen!",
    objectives: [
      "Develop your pieces",
      "Attack the Queen",
      "Capture the Queen!"
    ],
    unlockStars: 36
  }
];
