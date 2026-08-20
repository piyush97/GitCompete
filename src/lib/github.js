import { scoreProfile } from "./scoring.js";

const API_ROOT = "https://api.github.com";
const userCache = new Map();

function asMessage(response) {
  if (response.status === 404) return "That GitHub username does not exist.";
  if (response.status === 403)
    return "GitHub's public API rate limit is reached. Please try again shortly.";
  return "GitHub could not load that profile right now.";
}

async function request(path) {
  const response = await fetch(`${API_ROOT}${path}`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!response.ok) throw new Error(asMessage(response));
  return response.json();
}

function cleanUsername(username) {
  const normalized = username.trim().replace(/^@/, "");
  if (!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(normalized)) {
    throw new Error("Enter a valid GitHub username.");
  }
  return normalized;
}

export async function getDeveloper(username) {
  const login = cleanUsername(username).toLowerCase();
  if (userCache.has(login)) return userCache.get(login);

  const task = Promise.all([
    request(`/users/${encodeURIComponent(login)}`),
    request(
      `/users/${encodeURIComponent(login)}/repos?per_page=100&sort=updated`,
    ),
  ]).then(([profile, repositories]) => ({
    profile,
    ...scoreProfile(profile, repositories),
  }));

  userCache.set(login, task);
  try {
    return await task;
  } catch (error) {
    userCache.delete(login);
    throw error;
  }
}

export async function exploreRepositories(query) {
  const term = query.trim() || "javascript";
  const data = await request(
    `/search/repositories?q=${encodeURIComponent(term)}&sort=stars&order=desc&per_page=12`,
  );
  return data.items;
}
