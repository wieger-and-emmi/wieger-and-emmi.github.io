
(function(){
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function(id){ return document.getElementById(id); };
  var intro = $('intro'), stage = $('stage'), invite = $('invite');
  /* ===== the gazebo's own front drapes: closed, then drawn back to the posts while we zoom in ===== */
  var gzc = $('gzc'), gctx = gzc.getContext('2d'), pL = new Image(), pR = new Image(), gdpr = 1;
  pL.src = 'gz-l.webp'; pR.src = 'gz-r.webp';
  var SPLIT = .518, TIEY = .53;
  function gsize(){ var r = gzc.getBoundingClientRect(); gdpr = Math.min(3, (window.devicePixelRatio || 1)) * 2.4; gzc.width = Math.round(gzc.offsetWidth * gdpr); gzc.height = Math.round(gzc.offsetHeight * gdpr); }
  function sm(t){ t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }
  var PROF = [0.540,0.530,0.521,0.511,0.502,0.492,0.475,0.456,0.437,0.418,0.398,0.379,0.360,0.341,0.328,0.315,0.302,0.289,0.277,0.264,0.251,0.238,0.227,0.215,0.203,0.191,0.180,0.168,0.163,0.172,0.181,0.190,0.199,0.208,0.217,0.226,0.235,0.246,0.259,0.272,0.284,0.297,0.310,0.323,0.335,0.345,0.353,0.360,0.368,0.376,0.383,0.391,0.399];
  function gather(v){
    var f = Math.max(0, Math.min(1, v)) * (PROF.length - 1), i = Math.floor(f), t = f - i;
    return PROF[i] + (PROF[Math.min(PROF.length - 1, i + 1)] - PROF[i]) * t;
  }

  function gdraw(t, time){
    if (!pL.naturalWidth || !pR.naturalWidth) return;
    var cw = gzc.width, ch = gzc.height; gctx.clearRect(0, 0, cw, ch);
    var lw = cw * SPLIT, rw = cw - lw, band = 1;
    for (var y = 0; y < ch; y += band){
      var v = y / ch, dv = v - TIEY;
      var p = sm((t - .5 * dv * dv - .15 * Math.max(0, dv)) / .85);       // the waist moves first, the hem trails
      var k = 1 + (gather(v) - 1) * p;
      var sway = (1 - p) * Math.sin(time * 1.8 + v * 4) * .006 * cw * v;
      var syL = v * pL.naturalHeight, syR = v * pR.naturalHeight, sh = Math.max(1, pL.naturalHeight / ch * band);
      // left panel gathers toward the left post
      gctx.drawImage(pL, 0, syL, pL.naturalWidth, sh, 0, y, lw * k + sway + 1, band + .5);
      // right panel gathers toward the right post
      var w = rw * k;
      gctx.drawImage(pR, 0, syR, pR.naturalWidth, sh, cw - w - sway - 1, y, w + 1, band + .5);
    }
  }
  var gidle = true, gt0 = performance.now();
  function gloop(now){ if (!gidle) return; gdraw(0, (now - gt0) / 1000); requestAnimationFrame(gloop); }
  function gstart(){ gsize(); requestAnimationFrame(gloop); }
  if (document.readyState === 'complete') gstart(); else addEventListener('load', gstart);
  pL.onload = pR.onload = function(){ if (gidle) gdraw(0, 0); };
  addEventListener('resize', function(){ if (gidle) gsize(); });

  var opened = false;
  function open(){
    if (opened) return; opened = true;
    intro.classList.add('go');                       // slow zoom toward the opening
    var t0 = performance.now(), delay = reduce ? 0 : 250, dur = reduce ? 1 : 3200;
    gidle = false;
    var went = false;
    (function frame(now){
      var t = Math.max(0, (now - t0 - delay) / dur);
      gdraw(Math.min(1, t), (now - t0) / 1000);
      if (t > .4 && !went){ went = true; through(); }    // the invitation starts showing while the drapes are still opening
      if (t < 1) requestAnimationFrame(frame); else if (!went){ went = true; through(); }
    })(performance.now());
    function through(){
      var r = gzc.getBoundingClientRect();
      stage.style.setProperty('--z', 2.3 * Math.max(innerWidth / (r.width * .5), innerHeight / (r.height * .75)));
      window.scrollTo(0,0); invite.removeAttribute('aria-hidden');
      intro.classList.add('through');               // zoom in through the opening...
      intro.classList.add('leave'); welcome();      // ...while the invitation fades in at the same time
      setTimeout(function(){ intro.style.display = 'none'; document.body.classList.remove('locked'); startPetals(); }, reduce ? 0 : 2700);
    }
  }
  stage.addEventListener('click', open);

  function welcome(){
    document.querySelector('.cframe').classList.add('in');
    document.querySelectorAll('#hero .h-rv').forEach(function(e){ e.classList.add('in'); });
  }

  /* reveals */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function(es){
    es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, {threshold:.2, rootMargin:'0px 0px -8% 0px'}) : null;
  document.querySelectorAll('.rv, .ev, .ev svg.draw, #sw').forEach(function(el){
    if (el.closest('#hero')) return;
    io ? io.observe(el) : el.classList.add('in');
  });

  /* timeline: a curved line through every event, drawn as you scroll */
  var tl = $('tl'), curve = $('curve'), ink = curve.querySelector('.ink'), track = curve.querySelector('.track'), clen = 0;
  function buildCurve(){
    var b = tl.getBoundingClientRect(), pts = [];
    tl.querySelectorAll('.dot').forEach(function(d){ var r = d.getBoundingClientRect(); pts.push([r.left + r.width/2 - b.left, r.top + r.height/2 - b.top]); });
    if (!pts.length) return;
    var cx = b.width / 2, d = 'M' + cx + ' 0';
    var prev = [cx, 0];
    pts.concat([[cx, b.height]]).forEach(function(p){
      var m = (p[1] - prev[1]) * .55;
      d += 'C' + prev[0] + ' ' + (prev[1] + m) + ' ' + p[0] + ' ' + (p[1] - m) + ' ' + p[0] + ' ' + p[1];
      prev = p;
    });
    curve.setAttribute('viewBox', '0 0 ' + b.width + ' ' + b.height);
    ink.setAttribute('d', d); track.setAttribute('d', d);
    clen = ink.getTotalLength(); ink.style.strokeDasharray = clen; tlProgress();
  }
  function tlProgress(){
    if (!clen) return;
    var r = tl.getBoundingClientRect(), p = Math.min(1, Math.max(0, (innerHeight * .7 - r.top) / r.height));
    ink.style.strokeDashoffset = clen * (1 - p);
  }
  addEventListener('scroll', tlProgress, {passive:true});
  addEventListener('resize', buildCurve);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(buildCurve);
  setTimeout(buildCurve, 300);

  /* falling lavender florets */
  function burst(){
    if (reduce) return;
    var cols = ['#b3a8cc','#a497bf','#c4bad6','#9fae9a','#cfc6dd','#f3ead7'], cx = innerWidth / 2, cy = innerHeight * .5;
    for (var i = 0; i < 34; i++){
      var b = document.createElement('span'), a = Math.random() * 6.283, d = 140 + Math.random() * Math.max(innerWidth, innerHeight) * .55;
      b.className = 'burst';
      b.style.cssText = 'left:' + cx + 'px;top:' + cy + 'px;background:' + cols[i % cols.length] + ';--bx:' + Math.cos(a) * d + 'px;--by:' + (Math.sin(a) * d + 80) + 'px;--br:' + (Math.random() * 720 - 360) + 'deg;animation-delay:' + (Math.random() * .25) + 's';
      document.body.appendChild(b); setTimeout(function(el){ return function(){ el.remove(); }; }(b), 2300);
    }
  }
  function startPetals(){
    if (reduce) return;
    var box = $('petals'), cols = ['#b3a8cc','#a497bf','#c4bad6','#9fae9a','#cfc6dd'];
    for (var i = 0; i < 12; i++){
      var p = document.createElement('span'); p.className = 'pt';
      var s = 5 + Math.random() * 6;
      p.style.cssText = 'left:' + (Math.random()*100) + 'vw;width:' + s + 'px;height:' + (s*1.5) + 'px;background:' + cols[i % cols.length] +
        ';animation-duration:' + (16 + Math.random()*12) + 's;animation-delay:' + (Math.random()*16) + 's;--dx:' + ((Math.random()-.5)*180) + 'px;--r:' + (Math.random()*540-270) + 'deg';
      box.appendChild(p);
    }
  }

  /* countdown to 4:00 PM, 28 Nov 2026 (Philippine time) */
  var target = Date.parse('2026-11-28T16:00:00+08:00');
  function pad(n){ return (n < 10 ? '0' : '') + n; }
  function set(id, v){ var el = $(id); if (el.textContent !== v){ el.classList.add('tick'); setTimeout(function(){ el.textContent = v; el.classList.remove('tick'); }, 180); } }
  function tick(){
    var ms = Math.max(0, target - Date.now());
    set('cd-d', pad(Math.floor(ms/864e5))); set('cd-h', pad(Math.floor(ms/36e5) % 24));
    set('cd-m', pad(Math.floor(ms/6e4) % 60)); set('cd-s', pad(Math.floor(ms/1e3) % 60));
  }
  tick(); setInterval(tick, 1000);

  $('cal').href = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
    + '&text=' + encodeURIComponent('Wedding of Wieger & Emmi')
    + '&dates=20261128T070000Z/20261128T160000Z'
    + '&details=' + encodeURIComponent('Call time 3:00 PM, ceremony 4:00 PM, reception 6:00 PM. Directions: https://maps.app.goo.gl/KVCsTUtgkLVqX7y17')
    + '&location=' + encodeURIComponent('Casa Cielo Communal');

  /* RSVP: each reply is added as a row in the Google Sheet */
  var SHEET_URL = 'https://script.google.com/macros/s/AKfycbzEB5IAIJDtKNqtiy_d58iIZmsPo0Ksm29XnsdZ2lPshtHMRaIb_fIdKgwoDAo0ui9CeQ/exec';
  var form = $('rsvp-form'), err = $('err');
  form.addEventListener('submit', function(e){
    e.preventDefault(); err.textContent = '';
    var btn = form.querySelector('button'); btn.disabled = true; btn.textContent = 'Sending...';
    var attending = (form.querySelector('input[name=attending]:checked') || {}).value;
    var ready = /^https:\/\/script\.google\.com\//.test(SHEET_URL);
    var done = function(){
      form.style.display = 'none';
      $('thanks-msg').textContent = attending === 'Joyfully accepts' ? 'See you there' : 'You will be missed';
      $('thanks-sub').textContent = ready ? 'Thank you, your reply has been sent to the couple.' : 'Preview only. Replies are saved once the Google Sheet is connected.';
      $('thanks').classList.add('show');
    };
    if (!ready) return done();
    var fd = new FormData(form); fd.delete('bot-field'); fd.delete('form-name');
    fetch(SHEET_URL, {method:'POST', mode:'no-cors', body:new URLSearchParams(fd)})
      .then(done)
      .catch(function(){ err.textContent = 'Sorry, that did not go through. Please try again.'; btn.disabled = false; btn.textContent = 'RSVP Now'; });
  });
})();
