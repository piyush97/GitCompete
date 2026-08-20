import test from "node:test";
import assert from "node:assert/strict";
import { scoreProfile, summarizeRepositories } from "../src/lib/scoring.js";

test("summarizes stars and the three most-used repository languages", () => {
  const repositories = [
    { stargazers_count: 4, language: "JavaScript" },
    { stargazers_count: 7, language: "TypeScript" },
    { stargazers_count: 2, language: "JavaScript" },
    { stargazers_count: 1, language: "Python" },
  ];
  assert.deepEqual(summarizeRepositories(repositories), {
    stars: 14,
    languages: ["JavaScript", "TypeScript", "Python"],
  });
  assert.equal(
    scoreProfile({ followers: 2, public_repos: 3 }, repositories).score,
    44,
  );
});
