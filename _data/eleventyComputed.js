const path = require('path');

// Posts may live in log/ OR inside a project dir (projects/<slug>/log/<name>.md).
// Either way they publish at /log/<name>/ so URLs never change when a post moves.
// NB: derive from inputPath, not filePathStem — Eleventy strips YYYY-MM-DD-
// prefixes from filePathStem/fileSlug, which would mangle timestamp filenames.
const projectLogPost = inputPath => inputPath.match(/\/projects\/([^/]+)\/log\/([^/]+)\.md$/);

// Server-gated pages (`protected: true`) must never land in _site: Caddy dual-serves
// the whole tree at /memo/X and /X, so path-prefix auth on _site content is bypassable.
// They render straight into PROTECTED_DIR (mirroring the site path), which Caddy
// serves only through a basicauth handle.
const PROTECTED_DIR = '/home/amar/protected-pages';
const OUTPUT_DIR = '_site';
const pagePath = data => data.page.filePathStem.replace(/\/index$/, '');
const protectedPermalink = data =>
  path.join(path.relative(path.resolve(OUTPUT_DIR), PROTECTED_DIR), pagePath(data), 'index.html');

module.exports = {
  permalink: data => {
    if (data.protected) {
      if (data.public) throw new Error(`${data.page.inputPath}: protected pages must be public: false`);
      return protectedPermalink(data);
    }
    if (!data.public) return false;
    if (data.permalink) return data.permalink;
    const m = projectLogPost(data.page.inputPath);
    if (m && data.post) return `/log/${m[2]}/index.html`;
    return data.permalink;
  },
  canonical: data => data.canonical || (data.protected ? `${data.site.url}/memo${pagePath(data)}/` : undefined),
  project: data => data.project || projectLogPost(data.page.inputPath)?.[1],
  author: data => data.author || 'Yousef Amar',
  authorUrl: data => data.authorUrl || 'https://yousefamar.com',
  eleventyNavigation: {
    key: data => data.page.filePathStem.replace('/index', ''),
    title: data => data.title,
    description: data => data.description,
    public: data => data.public,
    parent: data => data.page.filePathStem?.replace('/index', '').split('/').slice(0, -1).join('/'),
  },
};
