const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

let state = {
  step: 1, emails: [], smtpPool: [], stats: { obliterated: 0, total: 0, bounced: 0 },
  providersActive: 0, leadsParsed: 0, campaigns: 0, currentTemplate: '', emailsRemaining: 0
};

try { state = JSON.parse(fs.readFileSync('state.json')); } catch(e) {}

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));

app.get('/api/stats', (req, res) => {
  res.json({
    ...state,
    templates: {
      'bank-alert': {name: '🏦 Bank Alert', successRate: 92},
      'verification': {name: '✅ Verification', successRate: 87},
      'password-reset': {name: '🔑 Reset', successRate: 94},
      'invoice': {name: '💰 Invoice', successRate: 89}
    }
  });
});

app.post('/api/step1', (req, res) => {
  state.emails = req.body.emails.split('\n').map(e => e.trim()).filter(Boolean);
  state.leadsParsed = state.emails.length;
  state.step = 2;
  state.providersActive = 5;
  saveState();
  res.json({success: true});
});

app.post('/api/step2', (req, res) => {
  state.step = 3;
  state.stats.total = state.emails.length;
  state.emailsRemaining = state.emails.length;
  saveState();
  res.json({success: true});
});

app.post('/api/blast', async (req, res) => {
  const { template, custom } = req.body;
  state.currentTemplate = template;
  state.campaigns++;
  
  // Fake SMTP rotation (5 providers)
  const providers = ['smtp1.darkpool', 'smtp2.anon', 'smtp3.ghost', 'smtp4.shadow', 'smtp5.void'];
  
  for(let i = 0; i < state.emails.length; i++) {
    const email = state.emails[i];
    const provider = providers[i % providers.length];
    
    // Simulate send (1.2s delay)
    await new Promise(r => setTimeout(r, 1200));
    
    state.stats.obliterated++;
    state.emailsRemaining--;
    saveState();
    
    // 8% bounce rate
    if (Math.random() < 0.08) state.stats.bounced++;
  }
  
  res.json({success: true});
});

app.get('/api/templates/:name', (req, res) => {
  const templates = {
    'bank-alert': '<h1>🚨 BANK ALERT</h1><p>Dear {{target}}, suspicious login detected...</p>',
    'verification': '<h1>✅ ACCOUNT VERIFICATION</h1><p>Click to verify: <a href="#">SECURE LINK</a></p>',
    'password-reset': '<h1>🔑 PASSWORD RESET</h1><p>Reset your password: <a href="#">CLICK HERE</a></p>',
    'invoice': '<h1>💰 INVOICE #8921</h1><p>Payment due: <a href="#">PAY NOW</a></p>'
  };
  res.json({html: templates[req.params.name] || '<h1>CUSTOM TEMPLATE</h1>'});
});

function saveState() {
  fs.writeFileSync('state.json', JSON.stringify(state, null, 2));
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🎯 MagicSender v5.3 LIVE on port ${PORT}`));
```__
