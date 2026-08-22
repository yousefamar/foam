// Posts may live in log/ OR inside a project dir (projects/<slug>/log/<name>.md).
// Either way they publish at /log/<name>/ so URLs never change when a post moves.
// NB: derive from inputPath, not filePathStem — Eleventy strips YYYY-MM-DD-
// prefixes from filePathStem/fileSlug, which would mangle timestamp filenames.
const projectLogPost = inputPath => inputPath.match(/\/projects\/([^/]+)\/log\/([^/]+)\.md$/);

module.exports = {
  permalink: data => {
    if (!data.public) return false;
    if (data.permalink) return data.permalink;
    const m = projectLogPost(data.page.inputPath);
    if (m && data.post) return `/log/${m[2]}/index.html`;
    return data.permalink;
  },
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
