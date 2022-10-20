// Loosely based off of:
// https://github.com/juanfrank77/foam-eleventy-template/blob/master/.eleventy.js
// https://github.com/alexjv89/markdown-it-obsidian/blob/main/index.js

const fs = require("fs");
const { join: pathJoin } = require("path");
// https://nodejs.org/api/util.html#util_util_inspect_object_options
const { inspect } = require("util");

const mdIt = require("markdown-it");
const mdItReplaceLink = require("markdown-it-replace-link");
const mdItAnchor = require('markdown-it-anchor');
const mdItRegex = require('markdown-it-regexp');
const mdItLinkAttributes = require("markdown-it-link-attributes");
const mdItFootnote = require("markdown-it-footnote");

const eleventyNavigation = require("@11ty/eleventy-navigation");
const eleventyReadingTime = require('eleventy-plugin-reading-time');

const slugify = require("slugify");
const { DateTime } = require("luxon");

const pathPrefix = "/memo/";
const rootDir = "root";
const assetsDir = "assets";

const ignoreFiles = ['node_modules', 'package.json', 'package-lock.json', assetsDir];
const walkDir = (dir, callback) => {
  for (const file of fs.readdirSync(dir)) {
    if (file.startsWith('.') || file.startsWith('_') || ignoreFiles.includes(file))
      continue;
    if (fs.statSync(dir + "/" + file).isDirectory())
      if (walkDir(dir + "/" + file, callback))
        return true;
    if (callback(pathJoin(dir, "/", file)))
      return true;
  };
};

// This covers only [[wiki-links]]
const mdItWikiLinksObsidian = mdItRegex(
  /!?\[\[(([^\]#\|]*)(#[^\|\]]+)*(\|[^\]]*)*)\]\]/,
  (match, utils) => {
    let path = match[2].replace(new RegExp(`^${rootDir}\/`), '')?.replace(/\/index$/, '');
    let label = match[4]?.slice(1) || path?.replace(/^\/+/, '').replace(/-/g, ' ').replace(/./, c => c.toUpperCase());
    let href = '';

    // Image
    if (match[0].startsWith('!') && /\.(png|jpg|jpeg|gif|bmp|svg)$/.test(label))
      return `<img src="${pathPrefix + assetsDir + '/images/' + path}"></img>`;

    // Video
    if (match[0].startsWith('!') && /\.(mp4|webm)$/.test(match[2]))
      return `<video ${match[4]?.slice(1) === 'controls' ? 'controls' : 'autoplay loop'} playsinline muted src="${pathPrefix + assetsDir + '/videos/' + path}"></video>`;

    if (path) {
      let foundPath;
      if (!match[2].startsWith(rootDir + '/')) {
        // No full path, need to find
        // Obisidian avoids conflicts, so we can just pick the first one
        walkDir(process.cwd(), file => {
          if (file.endsWith(`/${path}.md`)) {
            foundPath = file.replace(new RegExp(`^${process.cwd() + '/' + rootDir}\/`), '').replace(/\.md$/, '');
            foundPath = utils.escape(pathPrefix + foundPath + '/');
            return true;
          }
        });

        if (!foundPath)
          console.warn(`Broken link:`, match);
      }

      href += foundPath || utils.escape(pathPrefix + path + '/') || '';
    }

    // Anchor
    if (match[3]?.startsWith('#')) {
      label = label || match[3].slice(1);
      href += '#' + slugify(match[3].slice(1), { strict: true, lower: true });
    }

    // Normal link
    if (!match[0].startsWith('!'))
      return `<a href="${href}">${label}</a>`;

    // Embedded note
    return `<iframe class="embedded-note" src="${href}" title="${label}"></iframe>`;
  }
);

module.exports = (eleventyConfig) => {
  eleventyConfig.setLibrary('md', mdIt({
    html: true,
    // This covers normal links
    replaceLink: function (link, env) {
      // const isRelativePattern = /^(?!http|\/).*/;
      // const lastSegmentPattern = /[^\/]+(?=\/$|$)/i;
      // const isRelative = isRelativePattern.test(link);

      // // Remove any trailing /index
      // link = link.replace(/\/index$/, '/');

      // if (link.startsWith('#') || link.startsWith('mailto:'))
      //   return link;
      if (link.startsWith('/'))
        return pathPrefix + link.slice(1);
      // if (isRelative)
      //   return env.page.filePathStem.replace(lastSegmentPattern, link);
      return link;
    },
  }).use(mdItWikiLinksObsidian)
    .use(mdItReplaceLink)
    .use(mdItLinkAttributes, { attrs: { target: '_blank' } })
    .use(mdItAnchor, { slugify: s => slugify(s, { strict: true, lower: true }) })
    .use(mdItFootnote));

  eleventyConfig.addPassthroughCopy(assetsDir);
  eleventyConfig.addPassthroughCopy("root/*.txt");

  eleventyConfig.addPlugin(eleventyNavigation);

  eleventyConfig.addFilter("inspect", (content) => `<pre>${inspect(content)}</pre>`);

  eleventyConfig.addFilter("log", (content) => console.dir(content) || '');

  eleventyConfig.addFilter("keys", (object) => Object.keys(object));

  eleventyConfig.addFilter("count", (content, prop) => {
    if (!prop)
      return content.length;
    return content.filter(t => t.data[prop]).length;
  });

  eleventyConfig.addFilter("dataCharCount", data => data.reduce((acc, cur) => (
    acc + cur.description.replace(/(<([^>]+)>)/gi, '').length
  ), 0))

  eleventyConfig.addFilter("tree", (content, showAll = false) => {
    const public = content.filter(t => t.data.listed || showAll);
    // Using filepathStem instead of url for showing the non-public ones
    const prefix = pathPrefix.slice(0, pathPrefix.length - 1);
    return JSON.stringify(public.map(t => ({
      title: t.data.title,
      label: t.data.label,
      url: prefix + t.data.page.filePathStem.replace('/index', '') + '/',
      characterCount: t.template.frontMatter.content.length + (+t.data.charCount || 0),
    })));
  });

  const searchTree = (root, key) => {
    for (const b of root) {
      if (b.key === key)
        return b;
      if (b.key && key.startsWith(b.key))
        return searchTree(b.children, key);
    }
  };
  eleventyConfig.addFilter("extractChildren", (tree, key) => {
    return searchTree(tree, key)?.children.filter(c => c.public);
  });

  eleventyConfig.addFilter("children", (collection, parentUrl) => {
    return collection.filter(p => p.url && p.url.startsWith(parentUrl) && p.url !== parentUrl);
  });

  eleventyConfig.addPlugin(eleventyReadingTime);

  eleventyConfig.addFilter("formatDate", (date) => {
    return DateTime.fromJSDate(date).toLocaleString(DateTime.DATE_MED);
  });

  return {
    dir: {
      input: rootDir,
      output: "_site",
      includes: "_includes",
      layouts: "_layouts",
    },
    passthroughFileCopy: true,
    pathPrefix,
    markdownTemplateEngine: "njk"
  };
};