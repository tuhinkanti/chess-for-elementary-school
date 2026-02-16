export interface Lesson {
  id: number;
  title: string;
  icon: string;
  description: string;
  storyIntro: string;
  piece?: string;
  objectives: string[];
  unlockStars: number;
}

export const lessons: Lesson[] = [
  {
    id: 1,
    title: "The Chess Kingdom",
    icon: "🏰",
    description: "Meet the board and the pieces' homes",
    storyIntro: "Welcome to the Chess Kingdom! I'm GM Gloop, your chess guide! 🧙‍♂️ Every piece has its own special home on this magical grid. See the numbers and letters? They help the Rook, Knight, and Bishop find their way back home! Let's explore the board together!",
    objectives: [
      "Tap 5 squares to wake up the chess board!",
      "Find the 4 corner homes (Rooks live here!)",
      "Count the squares in the bottom row"
    ],
    unlockStars: 0
  },
  {
    id: 2,
    title: "The Brave Pawn",
    icon: "♟️",
    piece: "p",
    description: "Learn how the little pawn moves",
    storyIntro: "Pawns are brave little soldiers! They always march forward, one step at a time. On their first move, they can take TWO big steps!",
    objectives: [
      "Move a pawn forward 1 square",
      "Try a 'Big Step'! Move a pawn 2 squares",
      "Great! Make any move to finish"
    ],
    unlockStars: 3
  },
  {
    id: 3,
    title: "The Jumping Knight",
    icon: "🏇",
    piece: "n",
    description: "The horse that jumps in an L shape",
    storyIntro: "The Knight is a magical horse! It jumps in an L-shape and can hop over other pieces. It's the only piece that can jump!",
    objectives: [
      "Move the knight in an L-shape",
      "Jump over other pieces",
      "Capture a piece with the knight"
    ],
    unlockStars: 6
  },
  {
    id: 4,
    title: "The Tower Rook",
    icon: "🏰",
    piece: "r",
    description: "The castle that slides straight",
    storyIntro: "The Rook is like a strong castle tower! It moves in straight lines - up, down, left, or right - as far as it wants!",
    objectives: [
      "Move the rook horizontally",
      "Move the rook vertically",
      "Capture a piece with the rook"
    ],
    unlockStars: 9
  },
  {
    id: 5,
    title: "The Sneaky Bishop",
    icon: "⛪",
    piece: "b",
    description: "The piece that slides diagonally",
    storyIntro: "The Bishop wears a pointy hat and loves diagonals! It zooms across the board on diagonal paths. Each bishop stays on its own color forever!",
    objectives: [
      "Move the bishop diagonally",
      "Notice it stays on one color",
      "Capture a piece with the bishop"
    ],
    unlockStars: 12
  },
  {
    id: 6,
    title: "The Powerful Queen",
    icon: "👸",
    piece: "q",
    description: "The strongest piece on the board",
    storyIntro: "The Queen is the most powerful piece! She can move like a Rook AND a Bishop - straight lines and diagonals! Protect her well!",
    objectives: [
      "Move the queen in a straight line",
      "Move the queen diagonally",
      "Capture pieces with the queen"
    ],
    unlockStars: 15
  },
  {
    id: 7,
    title: "Protect the King",
    icon: "🤴",
    piece: "k",
    description: "Keep your King safe!",
    storyIntro: "The King is the most important piece! If he's trapped, you lose! He can only move one square at a time, so keep him safe!",
    objectives: [
      "Move the king one square",
      "Keep the king away from danger",
      "Understand what 'check' means"
    ],
    unlockStars: 18
  },
  {
    id: 8,
    title: "Capture Time!",
    icon: "⚔️",
    description: "Practice capturing enemy pieces",
    storyIntro: "Now you know all the pieces! Let's practice capturing. When your piece lands on an enemy's square, you capture it!",
    objectives: [
      "Capture 5 pawns",
      "Capture using different pieces",
      "Avoid getting captured"
    ],
    unlockStars: 21
  },
  {
    id: 9,
    title: "Checkmate!",
    icon: "🎯",
    description: "Learn to trap the King",
    storyIntro: "Checkmate means the King is trapped and can't escape! When you checkmate, you win the game! Let's practice simple checkmates!",
    objectives: [
      "Find checkmate in 1 move",
      "Use the Queen to checkmate",
      "Use the Rook to checkmate"
    ],
    unlockStars: 24
  },
  {
    id: 10,
    title: "Play a Game!",
    icon: "🏆",
    description: "You're ready to play chess!",
    storyIntro: "Congratulations, young chess master! You've learned all the pieces and rules. Now it's time to play a real game!",
    objectives: [
      "Set up the board correctly",
      "Play a full game",
      "Have fun!"
    ],
    unlockStars: 27
  }
];
