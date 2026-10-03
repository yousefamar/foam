const fs = require('fs');
const tls = require('tls');
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
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 20, fieldSize: 64 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, ALLOWED_EXT.includes(ext) && ALLOWED_MIME.includes(file.mimetype));
  },
})

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

// Debounce/coalesce rebuilds so bursts of PATCH or /rebuild collapse into ONE eleventy run
let rebuildTimer = null, rebuildPending = false, rebuilding = false, lastBuild = null;
function scheduleRebuild() {
  rebuildPending = true;
  if (rebuildTimer) return;
  rebuildTimer = setTimeout(async function run() {
    rebuildTimer = null;
    if (rebuilding) { rebuildTimer = setTimeout(run, 2000); return; }
    rebuilding = true; rebuildPending = false;
    const startedAt = new Date();
    try {
      console.log(startedAt, 'Eleventy build started'); await runEleventy(); console.log(new Date(), 'Eleventy build finished');
      lastBuild = { ok: true, startedAt, finishedAt: new Date() };
    } catch (e) {
      console.error(e);
      // exec's error.message is "Command failed: npx eleventy\n<stderr>"; keep only the 11ty problem lines
      const problem = (e.message || '').split('\n').filter(l => /^\[11ty\]/.test(l) && !/^\[11ty\]\s+at /.test(l)).join('\n');
      lastBuild = { ok: false, startedAt, finishedAt: new Date(), error: problem || String(e.message) };
    }
    rebuilding = false;
    if (rebuildPending) scheduleRebuild();
  }, 3000);
}

// Generous per-IP rate limit for PATCH writes: stops rev-*.md disk-fill abuse without
// blocking legitimate collaborative editing.
const patchRateLimit = new Map();
function isPatchRateLimited(ip) {
  const now = Date.now();
  const e = patchRateLimit.get(ip);
  if (!e || now - e.first > 60 * 60 * 1000) { patchRateLimit.set(ip, { first: now, count: 1 }); return false; }
  e.count++;
  return e.count > 30;
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
  if (!oldFm.attributes.public || !Array.isArray(oldFm.attributes.acl) || !oldFm.attributes.acl.includes('\\*'))
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
  if (isPatchRateLimited(req.headers['x-forwarded-for'] || req.socket.remoteAddress))
    return res.status(429).json({ success: false, error: 'Too many requests' });

  // Resolve the target under rootDir and assert containment (no `../` traversal).
  // NB: `path` here is the path module (do not shadow it as the old code did).
  const rel = req.path.replace(/^\/+/, '');
  const rootResolved = path.resolve(rootDir);
  const targetDir = path.resolve(rootResolved, rel);
  if (targetDir !== rootResolved && !targetDir.startsWith(rootResolved + path.sep))
    return res.status(400).json({ success: false, error: 'Invalid path' });

  const { content } = req.body;
  if (!content)
    return res.status(400).json({ success: false, error: 'Missing content' });

  try {
    writeUpdate(targetDir, content);
    scheduleRebuild();
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
  res.json({ success: true });
});

// Rate limiting for testimonial submissions
const testimonialRateLimit = new Map();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 3; // max submissions per IP per window

function isRateLimited(ip) {
  const now = Date.now();
  const entry = testimonialRateLimit.get(ip);
  if (!entry || now - entry.firstRequest > RATE_LIMIT_WINDOW) {
    testimonialRateLimit.set(ip, { firstRequest: now, count: 1 });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// Clean up old rate limit entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of testimonialRateLimit) {
    if (now - entry.firstRequest > RATE_LIMIT_WINDOW) testimonialRateLimit.delete(ip);
  }
}, RATE_LIMIT_WINDOW);

function validateTestimonialField(value, maxLength) {
  if (typeof value !== 'string') return false;
  if (value.length > maxLength) return false;
  // Reject common injection patterns
  if (/(\bSELECT\b|\bUNION\b|\bDROP\b|\bINSERT\b|PG_SLEEP|DBMS_PIPE|<script|onerror=|nslookup\b|gethostbyname|\.bxss\.)/i.test(value)) return false;
  return true;
}

// Verify a saved upload really is an image by magic bytes (mimetype/ext are client-controlled)
function isRealImage(p) {
  const fd = fs.openSync(p, 'r'); const b = Buffer.alloc(12);
  fs.readSync(fd, b, 0, 12, 0); fs.closeSync(fd);
  const h = b.toString('hex');
  return h.startsWith('ffd8ff') || h.startsWith('89504e47') || h.startsWith('474946383')
      || (b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP');
}

app.post('/notes/my/testimonials/leave/', upload.single('avatar'), async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (isRateLimited(ip)) {
    return res.status(429).json({ success: false, error: 'Too many submissions. Please try again later.' });
  }

  const name = req.body.name;
  const testimonial = req.body.testimonial?.replace(/\r\n/g, '\n');
  const workTitle = req.body.workTitle;
  const personalLink = req.body.personalLink;

  // Validate all fields
  if (!name || !testimonial) {
    return res.status(400).json({ success: false, error: 'Name and testimonial are required.' });
  }

  if (!validateTestimonialField(name, 200) ||
      !validateTestimonialField(testimonial, 5000) ||
      (workTitle && !validateTestimonialField(workTitle, 200)) ||
      (personalLink && !validateTestimonialField(personalLink, 500))) {
    return res.status(400).json({ success: false, error: 'Invalid input.' });
  }

  // Validate avatar file type if uploaded
  if (req.file) {
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!allowedExts.includes(ext) || !isRealImage(req.file.path)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, error: 'Invalid avatar file type.' });
    }
  }

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
    avatar: req.file ? req.file.filename : null,
    text: testimonial,
  };

  fs.writeFileSync(`./_data/incoming-testimonials/${Date.now()}.json`, JSON.stringify(data));

  res.redirect('/memo/notes/my/testimonials/success/');
});

app.get('/rebuild', (req, res) => {
  scheduleRebuild();
  res.json({ success: true, queued: true });
});

app.get('/rebuild/status', (req, res) => {
  res.status(lastBuild && !lastBuild.ok ? 500 : 200).json({ rebuilding, lastBuild });
});

// Gemini — TLS cert is shared with Caddy; skip if unavailable (eg. pre-DNS-cutover)
let geminiOptions = null;
try {
  geminiOptions = {
    key: fs.readFileSync('/home/caddy/.local/share/caddy/certificates/acme-v02.api.letsencrypt.org-directory/yousefamar.com/yousefamar.com.key'),
    cert: fs.readFileSync('/home/caddy/.local/share/caddy/certificates/acme-v02.api.letsencrypt.org-directory/yousefamar.com/yousefamar.com.crt'),
  };
} catch (e) {
  console.warn('Gemini server disabled — could not read Caddy cert:', e.code || e.message);
}

function handleGeminiRequest(request) {
  const lines = request.split('\r\n');
  if (!lines.length) {
    return '59\r\n';
  }

  const requestLine = lines[0];
  if (!requestLine.startsWith('gemini://')) {
    return '59\r\n';
  }

  // TODO: proper routing
  if (requestLine === 'gemini://yousefamar.com/') {
    const text = fs.readFileSync('./root/index.gmi', 'utf8');
    return '20 text/gemini\r\n' + text;
  }

  return '51\r\n';
}

const server = geminiOptions ? tls.createServer(geminiOptions, (socket) => {
  console.log('Gemini client connected');

  socket.on('data', (data) => {
    const request = data.toString();
    const response = handleGeminiRequest(request);
    if (!socket.destroyed) {
      socket.write(response);
      socket.end();
    }
  });

  socket.on('end', () => {
    console.log('Gemini client disconnected');
  });

  socket.on('error', (err) => {
    console.error('Gemini socket error:', err);
  });

  socket.setEncoding('utf8');
}) : null;

(async function () {
  try {
    const listeners = [new Promise(resolve => app.listen(port, resolve))];
    if (server) listeners.push(new Promise(resolve => server.listen(1965, resolve)));
    await Promise.all(listeners);

    console.log(`Server started on port ${port}${server ? ' (+ Gemini :1965)' : ' (Gemini disabled)'}`);
  } catch (error) {
    console.error(error);
  }
})();