import { describe, it, expect } from "vitest";

type Participant = {
  user_id: string;
  age: number;
  interests: string[];
};

function similarity(a: Participant, b: Participant): number {
  const shared = a.interests.filter((i) => b.interests.includes(i)).length;
  const ageDiff = Math.abs(a.age - b.age);
  return shared * 2 + (ageDiff <= 10 ? 1 : 0);
}

function mergeSmallGroups(
  groups: Participant[][],
  minSize: number,
  maxSize: number
): Participant[][] {
  const result: Participant[][] = [];
  const small: Participant[] = [];
  for (const g of groups) {
    g.length >= minSize ? result.push(g) : small.push(...g);
  }
  for (const p of small) {
    const target = result.find((g) => g.length < maxSize);
    target ? target.push(p) : result.push([p]);
  }
  return result.filter((g) => g.length > 0);
}

function greedyGroup(participants: Participant[], minSize = 6, maxSize = 8): Participant[][] {
  if (participants.length === 0) return [];
  const pool = [...participants];
  const groups: Participant[][] = [];
  const used = new Set<string>();

  for (const seed of pool) {
    if (used.has(seed.user_id)) continue;
    const group: Participant[] = [seed];
    used.add(seed.user_id);
    const candidates = pool
      .filter((p) => !used.has(p.user_id))
      .map((p) => ({ participant: p, score: similarity(seed, p) }))
      .sort((a, b) => b.score - a.score);

    for (const { participant } of candidates) {
      if (group.length >= maxSize) break;
      group.push(participant);
      used.add(participant.user_id);
    }

    groups.push(group);
  }

  return mergeSmallGroups(groups, minSize, maxSize);
}

function makeParticipants(n: number): Participant[] {
  return Array.from({ length: n }, (_, i) => ({
    user_id: `user-${i}`,
    age: 25 + (i % 20),
    interests: i % 2 === 0 ? ["Running", "Music"] : ["Gaming", "Reading"],
  }));
}

describe("similarity scoring", () => {
  it("returns higher score for shared interests", () => {
    const a: Participant = { user_id: "a", age: 28, interests: ["Running", "Music"] };
    const b: Participant = { user_id: "b", age: 30, interests: ["Running", "Music"] };
    const c: Participant = { user_id: "c", age: 30, interests: ["Gaming"] };
    expect(similarity(a, b)).toBeGreaterThan(similarity(a, c));
  });

  it("adds age bracket bonus when within 10 years", () => {
    const a: Participant = { user_id: "a", age: 28, interests: [] };
    const close: Participant = { user_id: "b", age: 35, interests: [] };
    const far: Participant = { user_id: "c", age: 50, interests: [] };
    expect(similarity(a, close)).toBe(1);
    expect(similarity(a, far)).toBe(0);
  });
});

describe("greedyGroup", () => {
  it("returns empty array for no participants", () => {
    expect(greedyGroup([])).toEqual([]);
  });

  it("groups 12 participants into valid-sized groups", () => {
    const groups = greedyGroup(makeParticipants(12), 6, 8);
    const total = groups.reduce((sum, g) => sum + g.length, 0);
    expect(total).toBe(12);
    groups.forEach((g) => {
      expect(g.length).toBeGreaterThanOrEqual(1);
      expect(g.length).toBeLessThanOrEqual(8);
    });
  });

  it("no participant appears in more than one group", () => {
    const participants = makeParticipants(20);
    const groups = greedyGroup(participants, 6, 8);
    const allIds = groups.flat().map((p) => p.user_id);
    const unique = new Set(allIds);
    expect(allIds.length).toBe(unique.size);
  });

  it("all participants are assigned to a group", () => {
    const participants = makeParticipants(18);
    const groups = greedyGroup(participants, 6, 8);
    const total = groups.reduce((sum, g) => sum + g.length, 0);
    expect(total).toBe(18);
  });

  it("handles fewer than minSize participants gracefully", () => {
    const groups = greedyGroup(makeParticipants(3), 6, 8);
    expect(groups.length).toBe(1);
    expect(groups[0].length).toBe(3);
  });
});

describe("mergeSmallGroups", () => {
  it("merges undersized groups into larger ones with capacity", () => {
    const large: Participant[] = makeParticipants(6);
    const small: Participant[] = [{ user_id: "extra", age: 28, interests: [] }];
    const result = mergeSmallGroups([large, small], 6, 8);
    expect(result.length).toBe(1);
    expect(result[0].length).toBe(7);
  });
});
