import { Match, Team, LeaderboardEntry, PredictionType } from '../models/quiniela.models';

export const TEAMS_DATA: Record<string, { code: string; flag: string }> = {
  'USA': { code: 'USA', flag: 'us' },
  'Colombia': { code: 'COL', flag: 'co' },
  'South Korea': { code: 'KOR', flag: 'kr' },
  'Cameroon': { code: 'CMR', flag: 'cm' },
  'Mexico': { code: 'MEX', flag: 'mx' },
  'Germany': { code: 'GER', flag: 'de' },
  'Japan': { code: 'JPN', flag: 'jp' },
  'Morocco': { code: 'MAR', flag: 'ma' },
  'Canada': { code: 'CAN', flag: 'ca' },
  'Spain': { code: 'ESP', flag: 'es' },
  'Australia': { code: 'AUS', flag: 'au' },
  'Senegal': { code: 'SEN', flag: 'sn' },
  'Argentina': { code: 'ARG', flag: 'ar' },
  'England': { code: 'ENG', flag: 'gb' },
  'Costa Rica': { code: 'CRC', flag: 'cr' },
  'Nigeria': { code: 'NGA', flag: 'ng' },
  'France': { code: 'FRA', flag: 'fr' },
  'Uruguay': { code: 'URU', flag: 'uy' },
  'Saudi Arabia': { code: 'KSA', flag: 'sa' },
  'Egypt': { code: 'EGY', flag: 'eg' },
  'Brazil': { code: 'BRA', flag: 'br' },
  'Belgium': { code: 'BEL', flag: 'be' },
  'Iran': { code: 'IRN', flag: 'ir' },
  'Peru': { code: 'PER', flag: 'pe' },
  'Portugal': { code: 'POR', flag: 'pt' },
  'Netherlands': { code: 'NED', flag: 'nl' },
  'Ecuador': { code: 'ECU', flag: 'ec' },
  'Tunisia': { code: 'TUN', flag: 'tn' },
  'Italy': { code: 'ITA', flag: 'it' },
  'Croatia': { code: 'CRO', flag: 'hr' },
  'Panama': { code: 'PAN', flag: 'pa' },
  'Algeria': { code: 'ALG', flag: 'dz' },
  'Denmark': { code: 'DEN', flag: 'dk' },
  'Switzerland': { code: 'SUI', flag: 'ch' },
  'Ghana': { code: 'GHA', flag: 'gh' },
  'Chile': { code: 'CHI', flag: 'cl' },
  'Austria': { code: 'AUT', flag: 'at' },
  'Poland': { code: 'POL', flag: 'pl' },
  'Turkey': { code: 'TUR', flag: 'tr' },
  'Jamaica': { code: 'JAM', flag: 'jm' },
  'Sweden': { code: 'SWE', flag: 'se' },
  'Ivory Coast': { code: 'CIV', flag: 'ci' },
  'Iraq': { code: 'IRQ', flag: 'iq' },
  'Honduras': { code: 'HON', flag: 'hn' },
  'Ukraine': { code: 'UKR', flag: 'ua' },
  'Mali': { code: 'MLI', flag: 'ml' },
  'Qatar': { code: 'QAT', flag: 'qa' },
  'New Zealand': { code: 'NZL', flag: 'nz' }
};

export const GROUPS = {
  A: ['USA', 'Colombia', 'South Korea', 'Cameroon'],
  B: ['Mexico', 'Germany', 'Japan', 'Morocco'],
  C: ['Canada', 'Spain', 'Australia', 'Senegal'],
  D: ['Argentina', 'England', 'Costa Rica', 'Nigeria'],
  E: ['France', 'Uruguay', 'Saudi Arabia', 'Egypt'],
  F: ['Brazil', 'Belgium', 'Iran', 'Peru'],
  G: ['Portugal', 'Netherlands', 'Ecuador', 'Tunisia'],
  H: ['Italy', 'Croatia', 'Panama', 'Algeria'],
  I: ['Denmark', 'Switzerland', 'Ghana', 'Chile'],
  J: ['Austria', 'Poland', 'Turkey', 'Jamaica'],
  K: ['Sweden', 'Ivory Coast', 'Iraq', 'Honduras'],
  L: ['Ukraine', 'Mali', 'Qatar', 'New Zealand']
} as const;

export const STADIUMS = [
  { name: 'MetLife Stadium', city: 'East Rutherford' },
  { name: 'SoFi Stadium', city: 'Inglewood' },
  { name: 'AT&T Stadium', city: 'Arlington' },
  { name: 'Arrowhead Stadium', city: 'Kansas City' },
  { name: 'Hard Rock Stadium', city: 'Miami Gardens' },
  { name: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  { name: 'Lumen Field', city: 'Seattle' },
  { name: 'Levi\'s Stadium', city: 'Santa Clara' },
  { name: 'Gillette Stadium', city: 'Foxborough' },
  { name: 'Lincoln Financial Field', city: 'Philadelphia' },
  { name: 'NRG Stadium', city: 'Houston' },
  { name: 'Estadio Azteca', city: 'Mexico City' },
  { name: 'Estadio BBVA', city: 'Monterrey' },
  { name: 'Estadio Akron', city: 'Guadalajara' },
  { name: 'BC Place', city: 'Vancouver' },
  { name: 'BMO Field', city: 'Toronto' }
];

export function generate72Matches(): Match[] {
  const matches: Match[] = [];
  let matchIdCounter = 1;
  const startDate = new Date('2026-06-11T12:00:00Z');

  // Groups keys A through L
  const groupKeys = Object.keys(GROUPS) as Array<keyof typeof GROUPS>;

  groupKeys.forEach((groupKey, groupIdx) => {
    const teamsInGroup = GROUPS[groupKey];
    
    // Create Team objects
    const teams: Team[] = teamsInGroup.map((name, index) => {
      const info = TEAMS_DATA[name];
      return {
        id: `${groupKey.toLowerCase()}-${index + 1}`,
        name,
        code: info.code,
        flagUrl: `https://flagcdn.com/w80/${info.flag}.png`
      };
    });

    // 6 matches per group
    // Matchday 1: 0 vs 1, 2 vs 3
    // Matchday 2: 0 vs 2, 1 vs 3
    // Matchday 3: 0 vs 3, 1 vs 2
    const matchpairings = [
      { homeIdx: 0, awayIdx: 1, matchday: 1 as const },
      { homeIdx: 2, awayIdx: 3, matchday: 1 as const },
      { homeIdx: 0, awayIdx: 2, matchday: 2 as const },
      { homeIdx: 1, awayIdx: 3, matchday: 2 as const },
      { homeIdx: 0, awayIdx: 3, matchday: 3 as const },
      { homeIdx: 1, awayIdx: 2, matchday: 3 as const }
    ];

    matchpairings.forEach((pairing, pairIdx) => {
      const matchDate = new Date(startDate.getTime());
      // Spread the dates across 15 days of group stage
      const dayOffset = Math.floor(groupIdx * 1.2) + (pairing.matchday - 1) * 4;
      matchDate.setDate(startDate.getDate() + dayOffset);
      // Stagger times (13:00, 16:00, 20:00)
      const hoursOffset = (groupIdx + pairIdx) % 3;
      matchDate.setHours(12 + hoursOffset * 4);

      const stadium = STADIUMS[(groupIdx * 6 + pairIdx) % STADIUMS.length];

      // To make it fun, let's pre-populate some finished matches (results)
      // Matches with ID <= 12 (approx. first 2 groups matchdays) already played
      let realResult: PredictionType | null = null;
      let homeGoals: number | undefined;
      let awayGoals: number | undefined;

      // Group A and B Matchday 1 & 2 matches are simulated as played
      if (matchIdCounter <= 8) {
        // Deterministic simulation
        const goals = [
          [2, 1, 'L' as const],
          [0, 0, 'E' as const],
          [1, 3, 'V' as const],
          [2, 2, 'E' as const],
          [3, 1, 'L' as const],
          [1, 0, 'L' as const],
          [0, 2, 'V' as const],
          [2, 1, 'L' as const]
        ][matchIdCounter - 1];

        homeGoals = goals[0] as number;
        awayGoals = goals[1] as number;
        realResult = goals[2] as PredictionType;
      }

      matches.push({
        id: `M${String(matchIdCounter).padStart(2, '0')}`,
        homeTeam: teams[pairing.homeIdx],
        awayTeam: teams[pairing.awayIdx],
        date: matchDate.toISOString(),
        group: groupKey,
        matchday: pairing.matchday,
        realResult,
        homeGoals,
        awayGoals,
        stadium: stadium.name,
        city: stadium.city
      });

      matchIdCounter++;
    });
  });

  return matches;
}

export const MOCK_COMPETITORS: { userId: string; userName: string; avatarUrl: string; predictionsSeed: Record<string, PredictionType> }[] = [
  {
    userId: 'c1',
    userName: 'Sofía Martínez',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    predictionsSeed: {
      'M01': 'L', 'M02': 'E', 'M03': 'L', 'M04': 'V', 'M05': 'L', 'M06': 'L', 'M07': 'V', 'M08': 'L',
      'M09': 'L', 'M10': 'V', 'M11': 'E', 'M12': 'L', 'M13': 'V', 'M14': 'E', 'M15': 'L', 'M16': 'E'
    }
  },
  {
    userId: 'c2',
    userName: 'Mateo Silva',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    predictionsSeed: {
      'M01': 'L', 'M02': 'V', 'M03': 'V', 'M04': 'E', 'M05': 'L', 'M06': 'E', 'M07': 'V', 'M08': 'V',
      'M09': 'E', 'M10': 'L', 'M11': 'L', 'M12': 'E', 'M13': 'L', 'M14': 'V', 'M15': 'E', 'M16': 'L'
    }
  },
  {
    userId: 'c3',
    userName: 'Valentina Gómez',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    predictionsSeed: {
      'M01': 'E', 'M02': 'E', 'M03': 'L', 'M04': 'E', 'M05': 'L', 'M06': 'L', 'M07': 'L', 'M08': 'L',
      'M09': 'V', 'M10': 'V', 'M11': 'E', 'M12': 'L', 'M13': 'E', 'M14': 'L', 'M15': 'V', 'M16': 'V'
    }
  },
  {
    userId: 'c4',
    userName: 'Alejandro Ruiz',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    predictionsSeed: {
      'M01': 'L', 'M02': 'E', 'M03': 'V', 'M04': 'E', 'M05': 'V', 'M06': 'L', 'M07': 'V', 'M08': 'L',
      'M09': 'L', 'M10': 'E', 'M11': 'V', 'M12': 'V', 'M13': 'L', 'M14': 'E', 'M15': 'L', 'M16': 'E'
    }
  },
  {
    userId: 'c5',
    userName: 'Camila Torres',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    predictionsSeed: {
      'M01': 'V', 'M02': 'E', 'M03': 'L', 'M04': 'V', 'M05': 'L', 'M06': 'L', 'M07': 'V', 'M08': 'L',
      'M09': 'L', 'M10': 'V', 'M11': 'L', 'M12': 'E', 'M13': 'L', 'M14': 'L', 'M15': 'E', 'M16': 'E'
    }
  }
];
