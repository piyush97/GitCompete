export function summarizeRepositories(repositories) {
  const languages = new Map();
  let stars = 0;

  for (const repository of repositories) {
    stars += repository.stargazers_count || 0;
    if (repository.language)
      languages.set(
        repository.language,
        (languages.get(repository.language) || 0) + 1,
      );
  }

  return {
    stars,
    languages: [...languages]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([language]) => language),
  };
}

export function scoreProfile(profile, repositories) {
  const summary = summarizeRepositories(repositories);
  return {
    ...summary,
    score: summary.stars + profile.followers * 3 + profile.public_repos * 8,
  };
}
