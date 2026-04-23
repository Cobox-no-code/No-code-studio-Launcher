export interface GHRelease {
  id: number;
  name: string | null;
  tag_name: string;
  published_at: string;
  html_url: string;
  body: string;
  prerelease: boolean;
}

/**
 * Fetch the latest N releases from GitHub. Unauthenticated — works for public
 * repos. If the repo is private, we'd need a PAT, but for release notes you
 * typically mirror them to a public repo anyway.
 */
export async function fetchReleases(
  owner: string,
  repo: string,
  limit = 10,
): Promise<GHRelease[]> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases?per_page=${limit}`,
    { headers: { Accept: "application/vnd.github+json" } },
  );
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  return res.json();
}
