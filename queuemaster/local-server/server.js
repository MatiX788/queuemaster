// ============================================================
// QueueMaster – Lokaler Server v2
// JSON-Datei Datenbank · Multi-Monitor · Lokale Werbung · Logo
// npm install && npm start
// ============================================================

const express  = require('express');
const http     = require('http');
const { Server }    = require('socket.io');
const { io: ioClient } = require('socket.io-client');
const cors     = require('cors');
const path     = require('path');
const fs       = require('fs');
const crypto   = require('crypto');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json({ limit: '10mb' })); // für Logo-Upload als Base64

// ─────────────────────────────────────────
// ADMIN AUTH (vor static!)
// ─────────────────────────────────────────
const adminTokens = new Set(); // Aktive Sessions

function hashPassword(pwd) {
  return crypto.createHash('sha256').update(pwd).digest('hex');
}
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Admin- und Cloud-Admin-Seiten schützen
app.use((req, res, next) => {
  const protectedPages = ['/admin.html', '/admin'];
  const isProtected = protectedPages.some(p => req.path === p || req.path.startsWith(p+'/'));
  if (!isProtected) return next();

  // Token aus Cookie oder Query
  const token = req.query.token || (req.headers.cookie || '').split(';').map(c=>c.trim()).find(c=>c.startsWith('qm_admin='))?.split('=')[1];
  if (token && adminTokens.has(token)) return next();

  // Sonst zur Login-Seite umleiten
  res.redirect('/login.html');
});

app.use(express.static(path.join(__dirname, 'public')));

// ─────────────────────────────────────────
// DATENBANK (JSON-Datei)
// ─────────────────────────────────────────
const DB_FILE = path.join(__dirname, 'data.json');

const DEFAULT_MENU = [
  { id: 1, name: 'Döner', active: true, items: [
    { id: 1,  number: '1',  name: 'Döner Kebab',         price: 5.00, active: true },
    { id: 2,  number: '2',  name: 'Döner XL',             price: 6.50, active: true },
    { id: 3,  number: '3',  name: 'Döner XL mit Käse',    price: 7.00, active: true },
    { id: 4,  number: '4',  name: 'Dürüm Döner',          price: 5.50, active: true },
    { id: 5,  number: '5',  name: 'Dürüm XL',             price: 7.00, active: true },
    { id: 6,  number: '6',  name: 'Dürüm XL mit Käse',   price: 7.50, active: true },
  ]},
  { id: 2, name: 'Vegetarisch', active: true, items: [
    { id: 10, number: '10', name: 'Vegetarischer Döner',  price: 5.50, active: true },
    { id: 11, number: '11', name: 'Vegetarischer Dürüm',  price: 6.50, active: true },
  ]},
  { id: 3, name: 'Kinder Menü', active: true, items: [
    { id: 31, number: '31', name: 'Kinder Döner',             price: 5.00, active: true },
    { id: 32, number: '32', name: 'Kinder Dürüm mit Pommes',  price: 6.00, active: true },
  ]},
  { id: 4, name: 'Nuggets', active: true, items: [
    { id: 40, number: '40', name: 'Nuggets Döner',           price: 6.00, active: true },
    { id: 41, number: '41', name: 'Nuggets Döner mit Käse',  price: 7.00, active: true },
  ]},
  { id: 5, name: 'Pizza', active: true, items: [
    { id: 54, number: '54', name: 'Margherita 20cm', price: 7.50, active: true },
    { id: 55, number: '55', name: 'Salami 28cm',     price: 9.00, active: true },
    { id: 56, number: '56', name: 'Hawaii 28cm',     price: 8.50, active: true },
  ]},
  { id: 6, name: 'Extras', active: true, items: [
    { id: 90, number: '90', name: 'Pommes',    price: 3.00, active: true },
    { id: 91, number: '91', name: '6 Nuggets', price: 4.00, active: true },
  ]},
];

const DEFAULT_DB = {
  config: {
    store_name:     'Mein Restaurant',
    accent_color:   '#c8102e',
    currency:       '€',
    ticker_text:    'Willkommen! Bitte behalten Sie Ihre Bestellnummer im Blick ★ Frisch zubereitet – mit Liebe gemacht ★ Guten Appetit!',
    logo_url:       '',
    cloud_url:      '',
    max_processing: '20',
    max_ready:      '20',
    order_timeout:  '15',
    admin_password_hash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', // Standard: "admin"
  },
  counter:    200,
  orders:     [],
  menu:       DEFAULT_MENU,
  nextMenuId: 100,
  nextItemId: 200,
  nextAdId:   1,
  // Lokale Werbeanzeigen
  localAds: [],
  // Monitor-Konfigurationen
  // categoryIds: [] = alle Kategorien; ['rest'] = alle nicht anderswo zugewiesenen
  monitors: [
    {
      id:           'monitor_A',
      name:         'Monitor 1 (Haupt)',
      categoryIds:  [],        // leer = alle Kategorien
      accent_color: '',        // leer = globale Farbe verwenden
      store_name:   '',        // leer = globalen Namen verwenden
      showAds:      true,
      showTicker:   true,
      displayLayout: '',
    }
  ],
};

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      return {
        ...DEFAULT_DB,
        ...parsed,
        config: { ...DEFAULT_DB.config, ...(parsed.config || {}) },
      };
    }
  } catch (e) { console.error('DB-Ladefehler:', e.message); }
  return JSON.parse(JSON.stringify(DEFAULT_DB));
}

function saveDB() {
  try { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8'); }
  catch (e) { console.error('DB-Speicherfehler:', e.message); }
}

let db = loadDB();
// Sicherstellen dass neue Felder vorhanden sind
if (!db.localAds)  db.localAds  = [];
if (!db.monitors)  db.monitors  = DEFAULT_DB.monitors;
if (!db.nextAdId)  db.nextAdId  = 1;
if (!db.config.logo_url) db.config.logo_url = '';

// ─────────────────────────────────────────
// HILFSFUNKTIONEN
// ─────────────────────────────────────────
function getStatus() {
  const maxP = parseInt(db.config.max_processing || 20);
  const maxR = parseInt(db.config.max_ready || 20);
  return {
    processing: db.orders.filter(o=>o.status==='processing').sort((a,b)=>a.number-b.number).slice(0,maxP).map(o=>o.number),
    ready:      db.orders.filter(o=>o.status==='ready').sort((a,b)=>a.number-b.number).slice(0,maxR).map(o=>o.number),
  };
}

function broadcastStatus() {
  const status = getStatus();
  io.emit('status_update', status);
  if (cloudSocket && cloudSocket.connected) {
    cloudSocket.emit('status_report', { monitorId: db.config.cloud_monitor_id, ...status });
  }
}

// Welche Kategorien soll Monitor X zeigen?
function getMenuForMonitor(monitorId) {
  const allActive = db.menu.filter(c => c.active !== false);
  if (!monitorId) return allActive; // kein Monitor-Filter → alles

  const monitor = db.monitors.find(m => m.id === monitorId);
  if (!monitor) return allActive;

  // Wenn categoryIds leer → alle Kategorien zeigen
  if (!monitor.categoryIds || monitor.categoryIds.length === 0) return allActive;

  // 'rest' bedeutet: alle Kategorien die keinem anderen Monitor zugewiesen sind
  if (monitor.categoryIds.includes('rest')) {
    const allAssigned = new Set(
      db.monitors
        .filter(m => m.id !== monitorId)
        .flatMap(m => (m.categoryIds||[]).filter(id => id !== 'rest').map(Number))
    );
    return allActive.filter(c => !allAssigned.has(c.id));
  }

  const ids = monitor.categoryIds.map(Number);
  return allActive.filter(c => ids.includes(c.id));
}

// Konfiguration für einen bestimmten Monitor zusammenstellen
function getMonitorConfig(monitorId) {
  const monitor = db.monitors.find(m => m.id === monitorId);
  return {
    ...db.config,
    accent_color:  (monitor?.accent_color) || db.config.accent_color,
    store_name:    (monitor?.store_name)   || db.config.store_name,
    showAds:       monitor ? monitor.showAds    !== false : true,
    showTicker:    monitor ? monitor.showTicker !== false : true,
    displayLayout: monitor?.displayLayout  || db.config.displayLayout || '',
    monitorId:     monitorId || '',
    monitorName:   monitor?.name || '',
  };
}

// ─────────────────────────────────────────
// CLOUD-VERBINDUNG
// ─────────────────────────────────────────
let cloudSocket = null;
let cloudAds    = [];
let cloudAdCfg  = { rotation_interval: 8 };

function connectToCloud() {
  const cloudUrl  = db.config.cloud_url;
  const monitorId = db.config.cloud_monitor_id || '';
  if (!cloudUrl) { console.log('ℹ️  Kein Cloud-Server konfiguriert'); return; }
  if (cloudSocket) { cloudSocket.disconnect(); cloudSocket = null; }

  console.log(`🌐 Verbinde mit Cloud: ${cloudUrl}`);
  cloudSocket = ioClient(cloudUrl, { reconnectionDelay: 5000, auth: { monitorId, type: 'local_server' } });
  cloudSocket.on('connect', () => {
    console.log('✅ Cloud verbunden');
    cloudSocket.emit('register', { monitorId, storeName: db.config.store_name });
    io.emit('cloud_status', { connected: true });
  });
  cloudSocket.on('disconnect', () => { io.emit('cloud_status', { connected: false }); });
  cloudSocket.on('ad_update', (data) => {
    cloudAds    = data.ads    || [];
    cloudAdCfg  = data.config || cloudAdCfg;
    io.emit('ad_update', { ads: cloudAds, config: cloudAdCfg });
  });
  cloudSocket.on('config_update', (data) => {
    ['accent_color','store_name','currency','ticker_text'].forEach(k => { if(data[k]) db.config[k]=data[k]; });
    saveDB(); io.emit('config_update', db.config);
  });
  setInterval(() => { if (cloudSocket?.connected) cloudSocket.emit('heartbeat', { monitorId, timestamp: Date.now() }); }, 30000);
}

// ─────────────────────────────────────────
// API — ADMIN LOGIN
// ─────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Passwort fehlt' });

  const hash = hashPassword(password);
  if (hash !== db.config.admin_password_hash) {
    return res.status(401).json({ error: 'Falsches Passwort' });
  }

  const token = generateToken();
  adminTokens.add(token);
  res.json({ success: true, token });
});

app.post('/api/logout', (req, res) => {
  const token = req.body?.token || req.query.token;
  if (token) adminTokens.delete(token);
  res.json({ success: true });
});

app.post('/api/change-password', (req, res) => {
  const { token, oldPassword, newPassword } = req.body;
  if (!adminTokens.has(token)) return res.status(401).json({ error: 'Nicht autorisiert' });
  if (hashPassword(oldPassword) !== db.config.admin_password_hash) {
    return res.status(401).json({ error: 'Altes Passwort falsch' });
  }
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: 'Neues Passwort zu kurz (min. 4 Zeichen)' });
  }
  db.config.admin_password_hash = hashPassword(newPassword);
  saveDB();
  res.json({ success: true });
});

// ─────────────────────────────────────────
// API — CONFIG
// ─────────────────────────────────────────
app.get('/api/config', (req, res) => {
  const safeCfg = { ...db.config };
  delete safeCfg.admin_password_hash;
  res.json({ ...safeCfg, cloudConnected: !!(cloudSocket?.connected) });
});

app.get('/api/monitor-config', (req, res) => {
  const monitorId = req.query.monitor || '';
  res.json(getMonitorConfig(monitorId));
});

app.patch('/api/config', (req, res) => {
  const allowed = ['store_name','accent_color','currency','ticker_text','logo_url',
                   'cloud_url','cloud_monitor_id','max_processing','max_ready','order_timeout'];
  const needsReconnect = req.body.cloud_url !== undefined;
  for (const [k,v] of Object.entries(req.body)) { if(allowed.includes(k)) db.config[k]=v; }
  saveDB();
  if (needsReconnect) connectToCloud();
  io.emit('config_update', db.config);
  res.json({ success: true });
});

// ─────────────────────────────────────────
// API — MONITORE
// ─────────────────────────────────────────
app.get('/api/monitors', (req, res) => res.json(db.monitors));

app.post('/api/monitors', (req, res) => {
  const { id, name, categoryIds=[], accent_color='', store_name='', showAds=true, showTicker=true } = req.body;
  if (!id || !name) return res.status(400).json({ error: 'id und name erforderlich' });
  if (db.monitors.find(m => m.id === id)) return res.status(409).json({ error: 'Monitor-ID bereits vergeben' });
  const monitor = { id, name, categoryIds, accent_color, store_name, showAds, showTicker, displayLayout: '' };
  db.monitors.push(monitor); saveDB();
  res.json(monitor);
});

app.patch('/api/monitors/:id', (req, res) => {
  const monitor = db.monitors.find(m => m.id === req.params.id);
  if (!monitor) return res.status(404).json({ error: 'Nicht gefunden' });
  ['name','categoryIds','accent_color','store_name','showAds','showTicker','displayLayout'].forEach(k => {
    if (req.body[k] !== undefined) monitor[k] = req.body[k];
  });
  saveDB(); res.json({ success: true });
});

app.delete('/api/monitors/:id', (req, res) => {
  db.monitors = db.monitors.filter(m => m.id !== req.params.id);
  saveDB(); res.json({ success: true });
});

// ─────────────────────────────────────────
// API — MENÜ
// ─────────────────────────────────────────
app.get('/api/menu', (req, res) => {
  const monitorId = req.query.monitor || '';
  const cats = getMenuForMonitor(monitorId);
  res.json(cats.map(c => ({ ...c, items: (c.items||[]).filter(i => i.active !== false) })));
});

app.post('/api/menu/categories', (req, res) => {
  const cat = { id: ++db.nextMenuId, name: req.body.name, active: true, items: [] };
  db.menu.push(cat); saveDB(); res.json(cat);
});

app.patch('/api/menu/categories/:id', (req, res) => {
  const cat = db.menu.find(c => c.id === parseInt(req.params.id));
  if (!cat) return res.status(404).json({ error: 'Nicht gefunden' });
  ['name','active','sort_order'].forEach(k => { if(req.body[k]!==undefined) cat[k]=req.body[k]; });
  saveDB(); res.json({ success: true });
});

app.delete('/api/menu/categories/:id', (req, res) => {
  const cat = db.menu.find(c => c.id === parseInt(req.params.id));
  if (cat) cat.active = false;
  saveDB(); res.json({ success: true });
});

app.post('/api/menu/items', (req, res) => {
  const { category_id, number='', name, price } = req.body;
  const cat = db.menu.find(c => c.id === parseInt(category_id));
  if (!cat) return res.status(404).json({ error: 'Kategorie nicht gefunden' });
  const item = { id: ++db.nextItemId, number, name, price: parseFloat(price), active: true };
  (cat.items = cat.items||[]).push(item); saveDB(); res.json(item);
});

app.patch('/api/menu/items/:id', (req, res) => {
  const id = parseInt(req.params.id);
  let found = null;
  db.menu.forEach(c => { const i=(c.items||[]).find(i=>i.id===id); if(i) found=i; });
  if (!found) return res.status(404).json({ error: 'Nicht gefunden' });
  ['name','price','number','active'].forEach(k => { if(req.body[k]!==undefined) found[k]=req.body[k]; });
  saveDB(); res.json({ success: true });
});

app.delete('/api/menu/items/:id', (req, res) => {
  const id = parseInt(req.params.id);
  db.menu.forEach(c => { const i=(c.items||[]).find(i=>i.id===id); if(i) i.active=false; });
  saveDB(); res.json({ success: true });
});

// ─────────────────────────────────────────
// API — APK DOWNLOAD
// ─────────────────────────────────────────
app.get('/api/apk-info', (req, res) => {
  const apkPath = path.join(__dirname, 'public', 'downloads', 'QueueMaster.apk');
  if (fs.existsSync(apkPath)) {
    const stats = fs.statSync(apkPath);
    res.json({
      available: true,
      size: stats.size,
      sizeMB: (stats.size / 1024 / 1024).toFixed(2),
      modified: stats.mtime.toISOString(),
      downloadUrl: '/downloads/QueueMaster.apk'
    });
  } else {
    res.json({ available: false });
  }
});

app.get('/downloads/QueueMaster.apk', (req, res) => {
  const apkPath = path.join(__dirname, 'public', 'downloads', 'QueueMaster.apk');
  if (fs.existsSync(apkPath)) {
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="QueueMaster.apk"');
    fs.createReadStream(apkPath).pipe(res);
  } else {
    res.status(404).send('APK nicht verfügbar. Bitte erst über GitHub Actions bauen.');
  }
});

// ─────────────────────────────────────────
// API — BESTELLUNGEN
// ─────────────────────────────────────────
app.post('/api/orders', (req, res) => {
  const { items=[], label='', note='' } = req.body;
  db.counter++;
  db.orders.push({ id: db.counter, number: db.counter, label, note, status: 'processing', items: JSON.stringify(items), created_at: new Date().toISOString() });
  saveDB(); broadcastStatus();
  res.json({ success: true, orderNumber: db.counter });
});

app.get('/api/orders', (req, res) => {
  res.json(db.orders.filter(o=>o.status!=='picked_up').sort((a,b)=>a.number-b.number));
});

app.patch('/api/orders/:number/ready', (req, res) => {
  const o = db.orders.find(o=>o.number===parseInt(req.params.number));
  if(o) o.status='ready'; saveDB(); broadcastStatus(); res.json({ success:true });
});

app.patch('/api/orders/:number/processing', (req, res) => {
  const o = db.orders.find(o=>o.number===parseInt(req.params.number));
  if(o) o.status='processing'; saveDB(); broadcastStatus(); res.json({ success:true });
});

app.patch('/api/orders/:number/pickedup', (req, res) => {
  const o = db.orders.find(o=>o.number===parseInt(req.params.number));
  if(o) o.status='picked_up'; saveDB(); broadcastStatus(); res.json({ success:true });
});

app.delete('/api/orders/:number', (req, res) => {
  db.orders = db.orders.filter(o=>o.number!==parseInt(req.params.number));
  saveDB(); broadcastStatus(); res.json({ success:true });
});

app.post('/api/reset', (req, res) => {
  db.orders.forEach(o=>o.status='picked_up'); db.counter=200;
  saveDB(); broadcastStatus(); res.json({ success:true });
});

// ─────────────────────────────────────────
// API — LOKALE WERBUNG
// ─────────────────────────────────────────
app.get('/api/ads', (req, res) => {
  // Cloud-Anzeigen haben Priorität; wenn keine Cloud → lokale Anzeigen
  if (cloudAds.length > 0) {
    res.json({ ads: cloudAds, config: cloudAdCfg, source: 'cloud' });
  } else {
    const active = db.localAds.filter(a => a.active !== false);
    res.json({ ads: active, config: { rotation_interval: 8 }, source: 'local' });
  }
});

app.get('/api/local-ads', (req, res) => res.json(db.localAds));

app.post('/api/local-ads', (req, res) => {
  const ad = {
    id:         db.nextAdId++,
    type:       req.body.type       || 'text',
    title:      req.body.title      || '',
    subtitle:   req.body.subtitle   || '',
    bg_color:   req.body.bg_color   || '#c8102e',
    text_color: req.body.text_color || '#ffffff',
    image_url:  req.body.image_url  || '',
    duration:   parseInt(req.body.duration) || 8,
    active:     true,
  };
  db.localAds.push(ad); saveDB();
  // Sofort an alle Displays pushen
  io.emit('ad_update', { ads: db.localAds.filter(a=>a.active!==false), config: { rotation_interval: 8 } });
  res.json(ad);
});

app.patch('/api/local-ads/:id', (req, res) => {
  const ad = db.localAds.find(a => a.id === parseInt(req.params.id));
  if (!ad) return res.status(404).json({ error: 'Nicht gefunden' });
  ['type','title','subtitle','bg_color','text_color','image_url','duration','active'].forEach(k => {
    if (req.body[k] !== undefined) ad[k] = req.body[k];
  });
  saveDB();
  io.emit('ad_update', { ads: db.localAds.filter(a=>a.active!==false), config: { rotation_interval: 8 } });
  res.json({ success: true });
});

app.delete('/api/local-ads/:id', (req, res) => {
  db.localAds = db.localAds.filter(a => a.id !== parseInt(req.params.id));
  saveDB();
  io.emit('ad_update', { ads: db.localAds.filter(a=>a.active!==false), config: { rotation_interval: 8 } });
  res.json({ success: true });
});

// ─────────────────────────────────────────
// API — STATISTIKEN
// ─────────────────────────────────────────
app.get('/api/stats', (req, res) => {
  const today = new Date().toDateString();
  const todayOrders = db.orders.filter(o => new Date(o.created_at).toDateString() === today);
  const processing  = db.orders.filter(o => o.status === 'processing').length;
  const ready       = db.orders.filter(o => o.status === 'ready').length;
  let umsatz = 0;
  const counts = {};
  todayOrders.forEach(o => {
    try { JSON.parse(o.items||'[]').forEach(i => { umsatz+=(i.price||0)*(i.qty||1); counts[i.name]=(counts[i.name]||0)+(i.qty||1); }); } catch {}
  });
  const topItems = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,count])=>({name,count}));
  res.json({ todayTotal: todayOrders.length, processing, ready, umsatz: umsatz.toFixed(2), topItems });
});

// ─────────────────────────────────────────
// WEBSOCKET
// ─────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('🔌 Client verbunden:', socket.id);
  socket.emit('current_status', getStatus());
  socket.emit('config_update',  db.config);
  const ads = cloudAds.length > 0 ? cloudAds : db.localAds.filter(a=>a.active!==false);
  socket.emit('ad_update', { ads, config: { rotation_interval: 8 } });
  socket.emit('cloud_status', { connected: !!(cloudSocket?.connected) });
  socket.on('disconnect', () => console.log('🔌 Client getrennt:', socket.id));
});

// ─────────────────────────────────────────
// START
// ─────────────────────────────────────────
connectToCloud();
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('\n✅ QueueMaster v2 läuft!');
  console.log(`\n  📺 Display:         http://localhost:${PORT}/display.html`);
  console.log(`  📺 Monitor 2:       http://localhost:${PORT}/display.html?monitor=monitor_B`);
  console.log(`  📱 Tablet:          http://localhost:${PORT}/tablet.html`);
  console.log(`  ⚙️  Admin:           http://localhost:${PORT}/admin.html\n`);
});
