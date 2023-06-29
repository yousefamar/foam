const fs = require('fs');
const { join } = require('path');
const { exec } = require('child_process');
const express = require('express');
const Eleventy = require('@11ty/eleventy');
const fm = require('front-matter');
const app = express();
const multer = require('multer');
const path = require('path');
const port = process.env.PORT || 8080;
const rootDir = process.env.ROOT_DIR || '/home/amar/doc/brain/root/';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './assets/images/testimonials/incoming/');
  },
  filename: function (req, file, cb) {
    const filename = file.fieldname + '-' + Date.now() + path.extname(file.originalname);
    console.log('File', file.originalname, 'written to disk as', filename);
    cb(null, filename);
  },
})
const upload = multer({ storage: storage })

async function runEleventy() {
  return new Promise((resolve, reject) => {
    exec('npx eleventy', (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

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

app.patch('/*', async (req, res) => {
  let path = req.path;

  // New Caddy config only allows this on /memo/ anyway
  // if (!path.startsWith('/memo/'))
  //   return res.status(400).json({ success: false, error: 'Invalid path' });

  // path = path.replace('/memo/', rootDir);
  path = path.replace('/', rootDir);

  const { content } = req.body;

  if (!content)
    return res.status(400).json({ success: false, error: 'Missing content' });

  try {
    writeUpdate(path, content);
    console.log(new Date(), 'Eleventy build started');
    //await new Eleventy().write();
    try {
      const output = await runEleventy();
      console.log(output);
    } catch (error) {
      console.error(error);
    }
    console.log(new Date(), 'Eleventy build finished');
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
  res.json({ success: true });
});

app.post('/notes/my/testimonials/leave/', upload.single('avatar'), async (req, res) => {
  const name = req.body.name;
  const testimonial = req.body.testimonial.replace(/\r\n/g, '\n');
  const workTitle = req.body.workTitle;
  const personalLink = req.body.personalLink;

  console.log('Incoming testimonial!');
  console.log('---------------------');
  console.log('Name:', name);
  if (req.file)
    console.log('Avatar:', req.file.originalname);
  console.log('Work Title:', workTitle);
  console.log('Personal/Social Link:', personalLink);
  console.log('Testimonial:', testimonial);

  const data = {
    name,
    title: workTitle,
    url: personalLink,
    date: new Date().toISOString(),
    avatar: req.file ? req.file.originalname : null,
    text: testimonial,
  };

  fs.writeFileSync(`./_data/incoming-testimonials/${Date.now()}.json`, JSON.stringify(data));

  res.redirect('/memo/notes/my/testimonials/success/');
});

app.get('/rebuild', async (req, res) => {
  try {
    console.log(new Date(), 'Eleventy build started');
    //await new Eleventy().write();
    try {
      const output = await runEleventy();
      console.log(output);
    } catch (error) {
      console.error(error);
    }
    console.log(new Date(), 'Eleventy build finished');
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
  res.json({ success: true });
});

(async function () {
  try {
    await new Promise(resolve => app.listen(port, resolve));
    console.log(`Server started on port ${port}`);
  } catch (error) {
    console.error(error);
  }
})();