module.exports = {
  eleventyNavigation: {
    key: data => data.page.filePathStem.replace('/index', ''),
    title: data => data.title,
    description: data => data.description,
    parent: data => data.page.filePathStem?.replace('/index', '').split('/').slice(0, -1).join('/'),
  },
};