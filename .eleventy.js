// https://github.com/juanfrank77/foam-eleventy-template/blob/master/.eleventy.js

const pathPrefix = "/memo/";

module.exports = (eleventyConfig) => {
  //eleventyConfig.addPassthroughCopy(".htaccess");
  eleventyConfig.addTransform("wiki-links", function (content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      // We remove outer brackets from links
      let output = content.replace(/\[+\<a href="\/(.*)" title="(.*)"\>.*\|(.*)\<\/a\>\]+/g, `<a href="${pathPrefix}$1" title="$2">$3</a>`);
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
  let markdownLib = markdownIt(markdownItOptions).use(markdownItReplaceLink);
  eleventyConfig.setLibrary("md", markdownLib);

  eleventyConfig.addPassthroughCopy("assets");

  const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
  eleventyConfig.addPlugin(eleventyNavigationPlugin);

  // https://nodejs.org/api/util.html#util_util_inspect_object_options
  const inspect = require("util").inspect;
  eleventyConfig.addFilter("debug", (content) => `<pre>${inspect(content)}</pre>`);

  const searchTree = (root, key) => {
    for (const b of root) {
      if (b.key === key)
        return b;
      if (key.startsWith(b.key))
        return searchTree(b.children, key);
    }
  };
  eleventyConfig.addFilter("extractChildren", (tree, key) => {
    return searchTree(tree, key)?.children;
  });

  return {
    dir: {
      input: ".",
      output: "_site",
      includes: "_includes",
      layouts: "_layouts",
    },
    templateFormats: [
      //
      "js",
      "md",
      "html",
      "liquid",
    ],
    passthroughFileCopy: true,
    pathPrefix,
  };
};
