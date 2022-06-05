// https://github.com/juanfrank77/foam-eleventy-template/blob/master/.eleventy.js

const pathPrefix = "/memo/";

module.exports = (eleventyConfig) => {
  //eleventyConfig.addPassthroughCopy(".htaccess");
  eleventyConfig.addTransform("wiki-links", function (content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      // We remove outer brackets from links
      // Hack to get the path right
      const path = outputPath
        .replace("_site/", "")
        .replace("/index.html", "")
        .replace(".html", "");
      let output = content.replace(/!\[+\<a href="\/(.*)" title="(.*)"\>(.*)\<\/a\>\]+/g, `<iframe src="${pathPrefix + path}/$1" title="$2"></iframe>`);
      output = output.replace(/\[+\<a href="\/(.*)" title="(.*)"\>.*\|(.*)\<\/a\>\]+/g, `<a href="${pathPrefix}$1" title="$2">$3</a>`);
      output = output.replace(/\[+\<a href="\/(.*)" title="(.*)"\>(.*)\<\/a\>\]+/g, `<a href="${pathPrefix}$1" title="$2">$3</a>`);
      return output;
    }
    return content;
  });

  let markdownIt = require("markdown-it");
  let markdownItReplaceLink = require("markdown-it-replace-link");
  let markdownItOptions = {
    html: true,
    replaceLink: function (link, env) {
      const isRelativePattern = /^(?!http|\/).*/;
      const lastSegmentPattern = /[^\/]+(?=\/$|$)/i;
      const isRelative = isRelativePattern.test(link);

      // If it's an anchor, or mailto, return as-is
      if (link.startsWith('#') || link.startsWith('mailto:'))
        return link;
      if (link.startsWith('/'))
        return pathPrefix + link.slice(1);
      if (isRelative) {
        const hasLastSegment = lastSegmentPattern.exec(env.page.url);
        // If it's nested, replace the last segment
        if (hasLastSegment && env.page.url) {
          return env.page.url.replace(lastSegmentPattern, link);
        }
        // If it's at root, just add the beginning slash
        return env.page.url + link;
      }

      return link;
    },
  };
  let markdownLib = markdownIt(markdownItOptions).use(markdownItReplaceLink).use(require('markdown-it-anchor'));
  eleventyConfig.setLibrary("md", markdownLib);

  eleventyConfig.addPassthroughCopy("assets");

  const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
  eleventyConfig.addPlugin(eleventyNavigationPlugin);

  // https://nodejs.org/api/util.html#util_util_inspect_object_options
  const inspect = require("util").inspect;
  eleventyConfig.addFilter("debug", (content) => `<pre>${inspect(content)}</pre>`);

  eleventyConfig.addFilter("count", (content, prop) => {
    if (!prop)
      return content.length;
    return content.filter(t => t.data[prop]).length;
  });

  eleventyConfig.addFilter("tree", (content, showAll = false) => {
    const public = content.filter(t => t.data.listed || showAll);
    // Using filepathStem instead of url for showing the non-public ones
    const prefix = pathPrefix.slice(0, pathPrefix.length - 1);
    return JSON.stringify(public.map(t => ({
      title: t.data.title,
      label: t.data.label,
      url: prefix + t.data.page.filePathStem.replace('/index', '') + '/',
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

  const readingTime = require('eleventy-plugin-reading-time');
  eleventyConfig.addPlugin(readingTime);

  const { DateTime } = require("luxon");
  eleventyConfig.addFilter("formatDate", (date) => {
    return DateTime.fromJSDate(date).toLocaleString(DateTime.DATE_MED);
  });

  return {
    dir: {
      input: "root",
      output: "_site",
      includes: "_includes",
      layouts: "_layouts",
    },
    passthroughFileCopy: true,
    pathPrefix,
  };
};