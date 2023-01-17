const fs = require('fs');
const { join } = require('path');
const express = require('express');
const Eleventy = require('@11ty/eleventy');
const fm = require('front-matter');
const app = express();
const port = process.env.PORT || 8080;
const rootDir = process.env.ROOT_DIR || '/home/amar/doc/brain/root/';

const writeUpdate = (path, newContent) => {
  newContent = newContent.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  if (!fs.lstatSync(path).isDirectory())
    throw new Error('Invalid path');

  const indexPath = join(path, 'index.md');

  if (!fs.existsSync(indexPath))
    throw new Error('Invalid path');

  const oldFile = fs.readFileSync(indexPath, 'utf8');

  const oldFm = fm(oldFile);
  const newFm = fm(newContent);

  // The error is the same as others to prevent leaking information about the existence of private files
  if (!oldFm.attributes.public || !oldFm.attributes.acl.includes('\\*'))
    throw new Error('Invalid path');

  if (JSON.stringify(oldFm.attributes) !== JSON.stringify(newFm.attributes))
    throw new Error('Editing the front matter is not allowed');

  const oldModificationDate = fs.statSync(indexPath).mtime;
  // const formattedModificationDate = new Date(oldModificationDate).toISOString().replace(/(T|:|\.)/g, '-').replace('Z', '');
  fs.renameSync(indexPath, join(path, `/rev-${+oldModificationDate}.md`));

  fs.writeFileSync(indexPath, newContent);
};

app.use(express.json());

app.patch('/*', (req, res) => {
  let path = req.path;

  if (!path.startsWith('/memo/'))
    return res.status(400).json({ success: false, error: 'Invalid path' });

  path = path.replace('/memo/', rootDir);

  const { content } = req.body;

  if (!content)
    return res.status(400).json({ success: false, error: 'Missing content' });

  try {
    writeUpdate(path, content);
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
  res.json({ success: true });
});

(async function () {
  await new Promise(resolve => app.listen(port, resolve));
  console.log(`Server started on port ${port}`);
  await new Eleventy().watch();
})();