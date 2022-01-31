module.exports = {
  permalink: data => data.public ? data.permalink : false,
  eleventyNavigation: {
    key: data => data.page.filePathStem.replace('/index', ''),
    title: data => data.title,
    description: data => data.description,
    public: data => data.public,
    parent: data => data.page.filePathStem?.replace('/index', '').split('/').slice(0, -1).join('/'),
  },
};