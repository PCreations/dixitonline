// === Types ===

export interface ProfileBadge {
  readonly id: string;
  readonly name: string;
  readonly imageUrl: string;
  readonly isUnlocked: boolean;
  readonly description?: string;
  readonly progress?: number; // 0-100
}

export interface ProfileFriend {
  readonly id: string;
  readonly username: string;
  readonly avatarUrl?: string;
  readonly isOnline: boolean;
}

export interface ProfileLastGame {
  readonly id: string;
  readonly position: number;
  readonly positionLabel: string;
  readonly points: number;
  readonly turns: number;
  readonly leaderboardUrl: string;
}

export interface ProfileStats {
  readonly gamesWon: number;
  readonly gamesPlayed: number;
  readonly badgesEarned: number;
}

export interface ProfileViewModel {
  readonly username: string;
  readonly avatarUrl?: string;
  readonly stats: ProfileStats;
  readonly earnedBadges: ReadonlyArray<ProfileBadge>;
  readonly allBadges: ReadonlyArray<ProfileBadge>;
  readonly badgesInProgress: ReadonlyArray<ProfileBadge>;
  readonly friends: ReadonlyArray<ProfileFriend>;
  readonly searchResults: ReadonlyArray<ProfileFriend>;
  readonly lastGames: ReadonlyArray<ProfileLastGame>;
}

// === Static Mock Data ===

const MOCK_EARNED_BADGES: ReadonlyArray<ProfileBadge> = [
  {
    id: 'badge-1',
    name: 'First Victory',
    imageUrl: '/assets/badges/badge-city-night.png',
    isUnlocked: true,
  },
  {
    id: 'badge-2',
    name: 'Storyteller',
    imageUrl: '/assets/badges/badge-city-purple.png',
    isUnlocked: true,
  },
  {
    id: 'badge-3',
    name: 'Social Butterfly',
    imageUrl: '/assets/badges/badge-mountains.png',
    isUnlocked: true,
  },
  {
    id: 'badge-4',
    name: 'Veteran',
    imageUrl: '/assets/badges/badge-sunset.png',
    isUnlocked: true,
  },
  {
    id: 'badge-5',
    name: 'Sharp Eye',
    imageUrl: '/assets/badges/badge-ocean.png',
    isUnlocked: true,
  },
  {
    id: 'badge-6',
    name: 'Team Player',
    imageUrl: '/assets/badges/badge-forest.png',
    isUnlocked: true,
  },
];

const MOCK_LOCKED_BADGES: ReadonlyArray<ProfileBadge> = [
  {
    id: 'badge-7',
    name: 'Master Guesser',
    imageUrl: '/assets/badges/badge-locked.png',
    isUnlocked: false,
    description: 'Win 50 games',
    progress: 72,
  },
  {
    id: 'badge-8',
    name: 'Perfect Score',
    imageUrl: '/assets/badges/badge-locked.png',
    isUnlocked: false,
    description: 'Score 100 points in a single game',
    progress: 45,
  },
  {
    id: 'badge-9',
    name: 'Night Owl',
    imageUrl: '/assets/badges/badge-locked.png',
    isUnlocked: false,
    description: 'Play 10 games after midnight',
    progress: 30,
  },
  {
    id: 'badge-10',
    name: 'Champion',
    imageUrl: '/assets/badges/badge-locked.png',
    isUnlocked: false,
    description: 'Win 100 games',
    progress: 12,
  },
  {
    id: 'badge-11',
    name: 'Creative Mind',
    imageUrl: '/assets/badges/badge-locked.png',
    isUnlocked: false,
    description: 'Give 500 clues as storyteller',
    progress: 60,
  },
  {
    id: 'badge-12',
    name: 'Legend',
    imageUrl: '/assets/badges/badge-locked.png',
    isUnlocked: false,
    description: 'Reach 1000 total points',
    progress: 8,
  },
];

const MOCK_FRIENDS: ReadonlyArray<ProfileFriend> = [
  { id: 'friend-1', username: 'User_number1', isOnline: true },
  { id: 'friend-2', username: 'User_number2', isOnline: true },
  { id: 'friend-3', username: 'User_number3', isOnline: true },
  { id: 'friend-4', username: 'User_number4', isOnline: true },
  { id: 'friend-5', username: 'User_number5', isOnline: false },
  { id: 'friend-6', username: 'User_number6', isOnline: false },
  { id: 'friend-7', username: 'User_number7', isOnline: false },
  { id: 'friend-8', username: 'User_number8', isOnline: false },
  { id: 'friend-9', username: 'User_number9', isOnline: false },
  { id: 'friend-10', username: 'User_number10', isOnline: false },
];

const MOCK_SEARCH_RESULTS: ReadonlyArray<ProfileFriend> = [
  { id: 'search-1', username: 'User_number1', isOnline: true },
  { id: 'search-2', username: 'User_number2', isOnline: true },
  { id: 'search-3', username: 'User_number3', isOnline: true },
  { id: 'search-4', username: 'User_number4', isOnline: true },
  { id: 'search-5', username: 'User_number5', isOnline: true },
  { id: 'search-6', username: 'User_number6', isOnline: true },
  { id: 'search-7', username: 'User_number7', isOnline: true },
  { id: 'search-8', username: 'User_number8', isOnline: true },
];

const MOCK_LAST_GAMES: ReadonlyArray<ProfileLastGame> = [
  {
    id: 'game-1',
    position: 2,
    positionLabel: '2nd place',
    points: 32,
    turns: 32,
    leaderboardUrl: '/game/game-1/leaderboard',
  },
  {
    id: 'game-2',
    position: 2,
    positionLabel: '2nd place',
    points: 32,
    turns: 32,
    leaderboardUrl: '/game/game-2/leaderboard',
  },
  {
    id: 'game-3',
    position: 2,
    positionLabel: '2nd place',
    points: 32,
    turns: 32,
    leaderboardUrl: '/game/game-3/leaderboard',
  },
  {
    id: 'game-4',
    position: 2,
    positionLabel: '2nd place',
    points: 32,
    turns: 32,
    leaderboardUrl: '/game/game-4/leaderboard',
  },
  {
    id: 'game-5',
    position: 2,
    positionLabel: '2nd place',
    points: 32,
    turns: 32,
    leaderboardUrl: '/game/game-5/leaderboard',
  },
  {
    id: 'game-6',
    position: 2,
    positionLabel: '2nd place',
    points: 32,
    turns: 32,
    leaderboardUrl: '/game/game-6/leaderboard',
  },
];

/**
 * Creates a static profile view model with mock data.
 * This will be replaced with real data fetching later.
 */
export function createProfileViewModel(): ProfileViewModel {
  return {
    username: 'Mr.g23',
    stats: {
      gamesWon: 124,
      gamesPlayed: 432,
      badgesEarned: 4,
    },
    earnedBadges: MOCK_EARNED_BADGES,
    allBadges: [...MOCK_EARNED_BADGES, ...MOCK_LOCKED_BADGES],
    badgesInProgress: MOCK_LOCKED_BADGES.filter(
      (b) => b.progress !== undefined && b.progress > 0,
    ),
    friends: MOCK_FRIENDS,
    searchResults: MOCK_SEARCH_RESULTS,
    lastGames: MOCK_LAST_GAMES,
  };
}
