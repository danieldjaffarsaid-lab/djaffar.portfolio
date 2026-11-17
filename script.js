// Menu mobile : ouvre/ferme la navigation
const menu = document.getElementById('menu');
document.getElementById('burger').addEventListener('click', () => menu.classList.toggle('open'));
menu.addEventListener('click', e => { if (e.target.tagName === 'A') menu.classList.remove('open'); });

// Ciel étoilé : étoiles scintillantes, étoiles filantes, constellation autour du curseur
(() => {
  const cv = document.getElementById('stars'), g = cv.getContext('2d');
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  let glow = '124,183,255', tint = ['255,255,255','255,255,255','255,255,255','160,200,255','200,170,255','255,225,170'];
  window.refreshSky = () => { glow = css('--glow'); tint = ['255,255,255','255,255,255','255,255,255', css('--t1'), css('--t2'), css('--t3')]; init(); if (calm) draw(); };
  let w, h, stars = [], comets = [], mx = null, my = 0, next = 120;
  function init() {
    const d = devicePixelRatio || 1;
    w = innerWidth; h = innerHeight;
    cv.width = w * d; cv.height = h * d; g.setTransform(d, 0, 0, d, 0, 0);
    stars = Array.from({ length: Math.round(w * h / 5000) }, () => ({
      x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.3 + .3,
      p: Math.random() * 6.28, v: Math.random() * .03 + .008, z: Math.random() * .8 + .2,
      c: tint[Math.floor(Math.random() * tint.length)]
    }));
  }
  function draw() {
    g.clearRect(0, 0, w, h);
    const near = [];
    for (const s of stars) {
      if (!calm) s.p += s.v;
      const a = .3 + .7 * Math.abs(Math.sin(s.p));
      const x = s.x + (mx === null ? 0 : (w / 2 - mx) * .01 * s.z);
      const y = ((s.y - scrollY * .1 * s.z) % h + h) % h;
      g.fillStyle = `rgba(${s.c},${a})`;
      g.beginPath(); g.arc(x, y, s.r, 0, 6.28); g.fill();
      if (s.r > 1.1) { g.fillStyle = `rgba(${s.c},${a * .15})`; g.beginPath(); g.arc(x, y, s.r * 4, 0, 6.28); g.fill(); }
      if (mx !== null) { const d = Math.hypot(x - mx, y - my); if (d < 140) near.push([x, y, d]); }
    }
    if (mx !== null) {
      const gl = g.createRadialGradient(mx, my, 0, mx, my, 170);
      gl.addColorStop(0, `rgba(${glow},.14)`); gl.addColorStop(1, `rgba(${glow},0)`);
      g.fillStyle = gl; g.fillRect(mx - 170, my - 170, 340, 340);
      for (const [x, y, d] of near) {
        g.strokeStyle = `rgba(${glow},${(1 - d / 140) * .55})`; g.lineWidth = 1;
        g.beginPath(); g.moveTo(mx, my); g.lineTo(x, y); g.stroke();
      }
    }
    if (!calm && --next < 0) {
      next = 180 + Math.random() * 240;
      comets.push({ x: Math.random() * w, y: Math.random() * h * .5, vx: 7 + Math.random() * 4, vy: 3 + Math.random() * 2, l: 0 });
    }
    comets = comets.filter(k => k.l < 60);
    for (const k of comets) {
      k.x += k.vx; k.y += k.vy; k.l++;
      const gr = g.createLinearGradient(k.x, k.y, k.x - k.vx * 9, k.y - k.vy * 9);
      gr.addColorStop(0, `rgba(255,255,255,${1 - k.l / 60})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.strokeStyle = gr; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(k.x, k.y); g.lineTo(k.x - k.vx * 9, k.y - k.vy * 9); g.stroke();
    }
    if (!calm) requestAnimationFrame(draw);
  }
  addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; });
  document.addEventListener('pointerleave', () => { mx = null; });
  addEventListener('resize', () => { init(); if (calm) draw(); });
  init(); draw();
})();

// Section active dans le menu : met en évidence la rubrique en cours de lecture
const links = [...document.querySelectorAll('#menu a')];
const secs = links.map(a => document.querySelector(a.getAttribute('href')));
function spy() {
  let cur = -1;
  secs.forEach((s, i) => { if (s.getBoundingClientRect().top <= innerHeight * .35) cur = i; });
  if (innerHeight + scrollY >= document.body.scrollHeight - 4) cur = links.length - 1;
  links.forEach((a, i) => { a.classList.toggle('on', i === cur); if (i === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
}
addEventListener('scroll', spy, { passive: true }); addEventListener('resize', spy); spy();

// Langue : chaque élément traduisible porte sa version anglaise dans data-en (les certifications restent intactes)
const langBtn = document.getElementById('lang'), tr = [...document.querySelectorAll('[data-en]')];
tr.forEach(e => { e.dataset.fr = e.innerHTML; });
function setLang(l) {
  tr.forEach(e => { e.innerHTML = l === 'en' ? e.dataset.en : e.dataset.fr; });
  document.documentElement.lang = l;
  document.querySelectorAll('[data-ph-en]').forEach(e => { if (!e.dataset.phFr) e.dataset.phFr = e.placeholder; e.placeholder = l === 'en' ? e.dataset.phEn : e.dataset.phFr; });
  langBtn.textContent = l === 'en' ? 'FR' : 'EN';
  langBtn.setAttribute('aria-label', l === 'en' ? 'Passer en français' : 'Switch to English');
  try { localStorage.setItem('lang', l); } catch (_) {}
  spy();
}
langBtn.addEventListener('click', () => setLang(document.documentElement.lang === 'en' ? 'fr' : 'en'));

// Thème : nuit bleue, forêt, crépuscule, ambre (sélection mémorisée)
const sel = document.getElementById('theme');
function setTheme(t) {
  if (![...sel.options].some(o => o.value === t)) t = 'nuit';
  document.documentElement.dataset.theme = t; sel.value = t;
  try { localStorage.setItem('theme', t); } catch (_) {}
  if (window.refreshSky) refreshSky();
}
sel.addEventListener('change', () => setTheme(sel.value));
try { setTheme(localStorage.getItem('theme') || 'nuit'); if (localStorage.getItem('lang') === 'en') setLang('en'); } catch (_) { setTheme('nuit'); }

// Copier l’adresse e-mail
const cp = document.getElementById('copy'), cl = document.getElementById('copylbl');
cp.addEventListener('click', async () => {
  const mail = 'danieldjaffarsaid@gmail.com';
  try { await navigator.clipboard.writeText(mail); }
  catch (_) { const t = document.createElement('textarea'); t.value = mail; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (__) {} t.remove(); }
  cl.textContent = document.documentElement.lang === 'en' ? 'Copied!' : 'Copié !';
  setTimeout(() => { cl.innerHTML = document.documentElement.lang === 'en' ? cl.dataset.en : cl.dataset.fr; }, 1800);
});

// Formulaire de contact : le message arrive directement dans ma boîte Gmail (service FormSubmit)
const cform = document.getElementById('cform'), cst = document.getElementById('cstatus');
const say = (fr, en) => { cst.textContent = document.documentElement.lang === 'en' ? en : fr; };
cform.addEventListener('submit', async e => {
  e.preventDefault();
  const f = cform.elements; if (f._honey.value) return;
  const b = cform.querySelector('button[type=submit]'); b.disabled = true; cst.className = ''; say('Envoi en cours…', 'Sending…');
  try {
    const r = await fetch('https://formsubmit.co/ajax/danieldjaffarsaid@gmail.com', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ Nom: f.nom.value, Email: f.email.value, Objet: f.objet.value, Message: f.message.value,
        _subject: 'Portfolio : ' + f.objet.value, _replyto: f.email.value, _template: 'table', _captcha: 'false' })
    });
    const d = await r.json();
    if (!r.ok || String(d.success) !== 'true') throw new Error(d.message || r.status);
    cst.className = 'ok'; say('Merci ! Votre message a bien été envoyé.', 'Thank you! Your message has been sent.'); cform.reset();
  } catch (_) {
    cst.className = 'err'; say('L’envoi a échoué. Écrivez-moi directement à danieldjaffarsaid@gmail.com.', 'Sending failed. Please write to me directly at danieldjaffarsaid@gmail.com.');
  }
  b.disabled = false;
});
