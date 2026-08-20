import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { exploreRepositories, getDeveloper } from "./lib/github.js";
import "./styles.css";

const initialPlayers = () => ({
  challenger: new URLSearchParams(location.search).get("challenger") || "",
  rival: new URLSearchParams(location.search).get("rival") || "",
});

function Logo() {
  return (
    <a className="brand" href="#compare" aria-label="GitCompete home">
      <span aria-hidden="true">⌘</span>Git<span>Compete</span>
    </a>
  );
}

function ProfileCard({ developer, winner }) {
  const { profile, score, stars, languages } = developer;
  return (
    <article className={`profile-card ${winner ? "is-winner" : ""}`}>
      <div className="profile-card__head">
        <img src={profile.avatar_url} alt="" />
        <div>
          <a href={profile.html_url} target="_blank" rel="noreferrer">
            @{profile.login}
          </a>
          <p>{profile.name || "GitHub developer"}</p>
        </div>
        {winner && <strong>Winner</strong>}
      </div>
      <p className="bio">{profile.bio || "Building in public on GitHub."}</p>
      <dl className="metrics">
        <div>
          <dt>Score</dt>
          <dd>{score.toLocaleString()}</dd>
        </div>
        <div>
          <dt>Followers</dt>
          <dd>{profile.followers.toLocaleString()}</dd>
        </div>
        <div>
          <dt>Repo stars</dt>
          <dd>{stars.toLocaleString()}</dd>
        </div>
        <div>
          <dt>Public repos</dt>
          <dd>{profile.public_repos.toLocaleString()}</dd>
        </div>
      </dl>
      <p className="languages">
        {languages.length
          ? languages.join(" · ")
          : "No repository languages reported"}
      </p>
    </article>
  );
}

function EmptyComparison() {
  return (
    <section className="comparison empty-comparison" aria-live="polite">
      <div>
        <span className="empty-mark">01</span>
        <h2>Challenger</h2>
        <p>Public GitHub profile</p>
      </div>
      <div className="versus">VS</div>
      <div>
        <span className="empty-mark">02</span>
        <h2>Rival</h2>
        <p>Public GitHub profile</p>
      </div>
      <footer>
        Compare followers, repository stars, public repositories, and top
        languages.
      </footer>
    </section>
  );
}

function Comparison({ result, onShare }) {
  if (!result) return <EmptyComparison />;
  const [first, second] = result;
  const tied = first.score === second.score;
  const winner = tied
    ? null
    : first.score > second.score
      ? first.profile.login
      : second.profile.login;
  return (
    <section className="comparison">
      <div className="result-head">
        <div>
          <span>Public GitHub data</span>
          <h2>{tied ? "A dead heat." : `@${winner} takes this round.`}</h2>
        </div>
        <button className="text-button" onClick={onShare}>
          Copy share link
        </button>
      </div>
      <div className="profile-grid">
        <ProfileCard
          developer={first}
          winner={winner === first.profile.login}
        />
        <ProfileCard
          developer={second}
          winner={winner === second.profile.login}
        />
      </div>
      <footer>
        <strong>Score:</strong> repository stars + (followers × 3) + (public
        repositories × 8). This is a fun public-data comparison, not a measure
        of engineering skill.
      </footer>
    </section>
  );
}

function Compare({ players, setPlayers }) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (
      players.challenger &&
      players.rival &&
      new URLSearchParams(location.search).has("challenger")
    )
      submit();
    // The URL only changes through submit; load a shared comparison once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(event) {
    event?.preventDefault();
    setError("");
    setLoading(true);
    try {
      const developers = await Promise.all([
        getDeveloper(players.challenger),
        getDeveloper(players.rival),
      ]);
      setResult(developers);
      const url = new URL(location.href);
      url.search = new URLSearchParams(players).toString();
      history.replaceState({}, "", url);
    } catch (requestError) {
      setResult(null);
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(location.href);
      setError("Share link copied.");
    } catch {
      setError("Copy the URL from your browser to share this comparison.");
    }
  }

  return (
    <main id="compare" className="shell">
      <section className="intro">
        <p className="overline">A small public-data experiment</p>
        <h1>
          Compare the work behind the <em>commits.</em>
        </h1>
        <p>
          Put two GitHub profiles side by side. No sign-in, no token, and no
          invented “AI score.” Just a transparent formula and public data.
        </p>
        <form onSubmit={submit}>
          <label>
            Challenger
            <input
              value={players.challenger}
              onChange={(event) =>
                setPlayers({ ...players, challenger: event.target.value })
              }
              placeholder="e.g. torvalds"
              autoComplete="off"
            />
          </label>
          <label>
            Rival
            <input
              value={players.rival}
              onChange={(event) =>
                setPlayers({ ...players, rival: event.target.value })
              }
              placeholder="e.g. gaearon"
              autoComplete="off"
            />
          </label>
          <button className="primary" disabled={loading}>
            {loading ? "Fetching profiles…" : "Compare profiles"}
          </button>
        </form>
        <p className="quiet">
          GitCompete reads only public GitHub API data. GitHub may rate-limit
          unauthenticated requests.
        </p>
        {error && (
          <p
            className={`message ${error.includes("copied") ? "success" : ""}`}
            role="status"
          >
            {error}
          </p>
        )}
      </section>
      <Comparison result={result} onShare={share} />
    </main>
  );
}

function Explore() {
  const [query, setQuery] = useState("typescript");
  const [repositories, setRepositories] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function search(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      setRepositories(await exploreRepositories(query));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <main id="explore" className="shell explore">
      <section className="explore-copy">
        <p className="overline">Repository explorer</p>
        <h1>
          Find the projects people are actually <em>starring.</em>
        </h1>
        <p>
          Search GitHub’s public repository index by language, topic, or
          keyword.
        </p>
        <form onSubmit={search} className="search">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Repository search"
            placeholder="typescript, react, llm…"
          />
          <button className="primary" disabled={loading}>
            {loading ? "Searching…" : "Search"}
          </button>
        </form>
        {error && (
          <p className="message" role="status">
            {error}
          </p>
        )}
      </section>
      {repositories.length ? (
        <ol className="repo-list">
          {repositories.map((repo) => (
            <li key={repo.id}>
              <span>{repo.stargazers_count.toLocaleString()} ★</span>
              <a href={repo.html_url} target="_blank" rel="noreferrer">
                {repo.full_name}
              </a>
              <p>{repo.description || "No description provided."}</p>
              <small>
                {repo.language || "Unspecified"} · updated{" "}
                {new Date(repo.updated_at).toLocaleDateString()}
              </small>
            </li>
          ))}
        </ol>
      ) : (
        <aside className="explore-empty">
          <span>⌕</span>
          <h2>Search a topic</h2>
          <p>Try a language or a specific project idea.</p>
        </aside>
      )}
    </main>
  );
}

function App() {
  const [view, setView] = useState(
    location.hash === "#explore" ? "explore" : "compare",
  );
  const [players, setPlayers] = useState(initialPlayers);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("gitcompete-theme") || "dark",
  );
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("gitcompete-theme", theme);
  }, [theme]);
  function navigate(next) {
    setView(next);
    history.replaceState({}, "", `#${next}`);
  }
  return (
    <>
      <header>
        <Logo />
        <nav aria-label="Primary">
          <button
            className={view === "compare" ? "active" : ""}
            onClick={() => navigate("compare")}
          >
            Compare
          </button>
          <button
            className={view === "explore" ? "active" : ""}
            onClick={() => navigate("explore")}
          >
            Explore
          </button>
        </nav>
        <div className="header-actions">
          <button
            className="theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle color theme"
          >
            {theme === "dark" ? "☼" : "◐"}
          </button>
          <a
            className="github-link"
            href="https://github.com/piyush97/GitCompete"
            target="_blank"
            rel="noreferrer"
          >
            GitHub ↗
          </a>
        </div>
      </header>
      {view === "compare" ? (
        <Compare players={players} setPlayers={setPlayers} />
      ) : (
        <Explore />
      )}
      <footer className="site-footer">
        Built by{" "}
        <a href="https://piyushmehta.com" target="_blank" rel="noreferrer">
          Piyush Mehta
        </a>{" "}
        · public data, transparent scoring, zero secrets.
      </footer>
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
