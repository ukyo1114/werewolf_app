const mockGameList = [
  {
    gameId: "1",
    players: Array.from({ length: 10 }, (_, i) => ({
      _id: String(i + 1),
      userName: `ユーザー${i + 1}`,
      pic: `https://example.com/avatar${i + 1}.jpg`,
    })),
    currentDay: 1,
    currentPhase: "day",
    result: "running",
  },
  {
    gameId: "2",
    players: Array.from({ length: 10 }, (_, i) => ({
      _id: String(i + 11),
      userName: `ユーザー${i + 11}`,
      pic: `https://example.com/avatar${i + 11}.jpg`,
    })),
    currentDay: 2,
    currentPhase: "night",
    result: "running",
  },
  {
    gameId: "3",
    players: Array.from({ length: 10 }, (_, i) => ({
      _id: String(i + 21),
      userName: `ユーザー${i + 21}`,
      pic: `https://example.com/avatar${i + 21}.jpg`,
    })),
    currentDay: 3,
    currentPhase: "day",
    result: "running",
  },
  {
    gameId: "4",
    players: Array.from({ length: 10 }, (_, i) => ({
      _id: String(i + 31),
      userName: `ユーザー${i + 31}`,
      pic: `https://example.com/avatar${i + 31}.jpg`,
    })),
    currentDay: 1,
    currentPhase: "night",
    result: "running",
  },
  {
    gameId: "5",
    players: Array.from({ length: 10 }, (_, i) => ({
      _id: String(i + 41),
      userName: `ユーザー${i + 41}`,
      pic: `https://example.com/avatar${i + 41}.jpg`,
    })),
    currentDay: 2,
    currentPhase: "day",
    result: "running",
  },
  {
    gameId: "6",
    players: Array.from({ length: 10 }, (_, i) => ({
      _id: String(i + 51),
      userName: `ユーザー${i + 51}`,
      pic: `https://example.com/avatar${i + 51}.jpg`,
    })),
    currentDay: 4,
    currentPhase: "night",
    result: "running",
  },
  {
    gameId: "7",
    players: Array.from({ length: 10 }, (_, i) => ({
      _id: String(i + 61),
      userName: `ユーザー${i + 61}`,
      pic: `https://example.com/avatar${i + 61}.jpg`,
    })),
    currentDay: 1,
    currentPhase: "day",
    result: "running",
  },
  {
    gameId: "8",
    players: Array.from({ length: 10 }, (_, i) => ({
      _id: String(i + 71),
      userName: `ユーザー${i + 71}`,
      pic: `https://example.com/avatar${i + 71}.jpg`,
    })),
    currentDay: 3,
    currentPhase: "night",
    result: "running",
  },
  {
    gameId: "9",
    players: Array.from({ length: 10 }, (_, i) => ({
      _id: String(i + 81),
      userName: `ユーザー${i + 81}`,
      pic: `https://example.com/avatar${i + 81}.jpg`,
    })),
    currentDay: 2,
    currentPhase: "day",
    result: "running",
  },
  {
    gameId: "10",
    players: Array.from({ length: 10 }, (_, i) => ({
      _id: String(i + 91),
      userName: `ユーザー${i + 91}`,
      pic: `https://example.com/avatar${i + 91}.jpg`,
    })),
    currentDay: 1,
    currentPhase: "night",
    result: "running",
  },
];

export default mockGameList;
