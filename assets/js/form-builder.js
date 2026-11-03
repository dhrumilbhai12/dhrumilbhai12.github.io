/* Tinkro free form builder — runs in your browser, drafts saved in localStorage. */
(function () {
  var KEY = 'tinkro_form_draft_v1';
  var list = document.getElementById('fb-list'), pv = document.getElementById('fb-preview');
  var titleIn = document.getElementById('fb-title'), descIn = document.getElementById('fb-desc');
  var saved = document.getElementById('fb-saved');
  if (!list) return;
  var TYPES = { short: 'Short text', long: 'Long text', choice: 'Multiple choice', rating: 'Rating (1–5)', email: 'Email' };
  var uid = function () { return Math.random().toString(36).slice(2, 9); };
  var state = load() || {
    title: 'Customer feedback', desc: 'Takes about a minute. Thank you!',
    qs: [
      { id: uid(), type: 'short', label: "What's your name?", required: true },
      { id: uid(), type: 'rating', label: 'How would you rate your experience?', required: true },
      { id: uid(), type: 'choice', label: 'What did you use us for?', options: ['Onboarding', 'Support', 'Billing', 'Other'], required: false },
      { id: uid(), type: 'long', label: 'Anything we could do better?', required: false },
      { id: uid(), type: 'email', label: 'Your email (if you want a reply)', required: false }
    ]
  };
  var cur = 0, answers = {};

  function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  var saveT;
  function save() {
    clearTimeout(saveT);
    saveT = setTimeout(function () {
      try { localStorage.setItem(KEY, JSON.stringify(state)); saved.textContent = 'Draft saved in this browser · ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
      catch (e) { saved.textContent = 'Could not save draft (storage blocked).'; }
    }, 300);
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function renderEditor() {
    titleIn.value = state.title; descIn.value = state.desc;
    list.innerHTML = state.qs.map(function (q, i) {
      var opts = q.type === 'choice' ? '<label class="small" for="o-' + q.id + '">Options (one per line)</label><textarea id="o-' + q.id + '" data-k="options" data-i="' + i + '" rows="3">' + esc((q.options || []).join('\n')) + '</textarea>' : '';
      return '<div class="fb-q" data-i="' + i + '"><div class="fb-q-h"><span class="tag p">' + (i + 1) + ' · ' + TYPES[q.type] + '</span><span>' +
        '<button class="ib" data-act="up" data-i="' + i + '" aria-label="Move question ' + (i + 1) + ' up"' + (i === 0 ? ' disabled' : '') + '>↑</button> ' +
        '<button class="ib" data-act="down" data-i="' + i + '" aria-label="Move question ' + (i + 1) + ' down"' + (i === state.qs.length - 1 ? ' disabled' : '') + '>↓</button> ' +
        '<button class="ib" data-act="del" data-i="' + i + '" aria-label="Delete question ' + (i + 1) + '">✕</button></span></div>' +
        '<label class="small" for="l-' + q.id + '">Question</label><input id="l-' + q.id + '" data-k="label" data-i="' + i + '" value="' + esc(q.label) + '">' + opts +
        '<label class="toggle small" style="padding:6px 10px"><input type="checkbox" data-k="required" data-i="' + i + '"' + (q.required ? ' checked' : '') + '> Required</label></div>';
    }).join('') || '<p class="muted">No questions yet — add one below.</p>';
  }

  function renderPreview() {
    var n = state.qs.length;
    if (!n) { pv.innerHTML = '<p class="muted">Your live preview appears here.</p>'; return; }
    if (cur > n) cur = n;
    var pct = Math.round(cur / n * 100);
    if (cur === n) {
      pv.innerHTML = '<div class="prog"><i style="width:100%"></i></div><h3>Thanks!</h3><p class="muted">That is what respondents see at the end. In the exported file, answers are shown on screen or sent to your endpoint.</p><div class="nav2"><button class="btn btn-line btn-sm" data-pv="restart">Restart preview</button></div>';
      return;
    }
    var q = state.qs[cur], a = answers[q.id], body = '';
    if (q.type === 'short') body = '<input data-ans aria-label="Answer" placeholder="Type your answer…" value="' + esc(a || '') + '">';
    if (q.type === 'email') body = '<input type="email" data-ans aria-label="Email" placeholder="name@example.com" value="' + esc(a || '') + '">';
    if (q.type === 'long') body = '<textarea data-ans aria-label="Answer" rows="4" placeholder="Type your answer…">' + esc(a || '') + '</textarea>';
    if (q.type === 'choice') body = (q.options || []).filter(Boolean).map(function (o) { return '<button class="opt' + (a === o ? ' sel' : '') + '" data-opt="' + esc(o) + '">' + esc(o) + '</button>'; }).join('');
    if (q.type === 'rating') body = '<div class="rate">' + [1, 2, 3, 4, 5].map(function (r) { return '<button data-rate="' + r + '" aria-label="' + r + ' out of 5"' + (a == r ? ' class="sel"' : '') + '>' + r + '</button>'; }).join('') + '</div>';
    pv.innerHTML = '<div class="prog"><i style="width:' + pct + '%"></i></div>' + (cur === 0 ? '<p class="small muted" style="margin-bottom:18px"><b style="color:var(--ink)">' + esc(state.title) + '</b> — ' + esc(state.desc) + '</p>' : '') +
      '<div class="qn">Question ' + (cur + 1) + ' of ' + n + '</div><h3>' + esc(q.label) + (q.required ? ' <span aria-label="required" style="color:var(--accent)">*</span>' : '') + '</h3>' + body +
      '<p class="pv-err small" style="color:var(--err);min-height:1.4em;margin:8px 0 0"></p><div class="nav2">' + (cur > 0 ? '<button class="btn btn-line btn-sm" data-pv="back">Back</button>' : '') +
      '<button class="btn btn-accent btn-sm" data-pv="next">' + (cur === n - 1 ? 'Submit' : 'OK ✓') + '</button></div>';
  }
  function render() { renderEditor(); renderPreview(); }

  list.addEventListener('input', function (e) {
    var t = e.target, i = +t.dataset.i, k = t.dataset.k; if (isNaN(i) || !k) return;
    if (k === 'options') state.qs[i].options = t.value.split('\n'); else if (k === 'required') state.qs[i].required = t.checked; else state.qs[i][k] = t.value;
    renderPreview(); save();
  });
  list.addEventListener('change', function (e) { if (e.target.dataset.k === 'required') { state.qs[+e.target.dataset.i].required = e.target.checked; renderPreview(); save(); } });
  list.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return; var i = +b.dataset.i, qs = state.qs;
    if (b.dataset.act === 'del') { if (!confirm('Delete this question?')) return; qs.splice(i, 1); }
    if (b.dataset.act === 'up' && i > 0) qs.splice(i - 1, 0, qs.splice(i, 1)[0]);
    if (b.dataset.act === 'down' && i < qs.length - 1) qs.splice(i + 1, 0, qs.splice(i, 1)[0]);
    cur = 0; render(); save();
  });
  titleIn.addEventListener('input', function () { state.title = titleIn.value; renderPreview(); save(); });
  descIn.addEventListener('input', function () { state.desc = descIn.value; renderPreview(); save(); });
  document.querySelectorAll('[data-add]').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = b.dataset.add, q = { id: uid(), type: t, label: { short: 'New short question', long: 'Tell us more', choice: 'Pick one', rating: 'How likely are you to recommend us?', email: 'Your email' }[t], required: false };
      if (t === 'choice') q.options = ['Option A', 'Option B', 'Option C'];
      state.qs.push(q); cur = state.qs.length - 1; render(); save();
      var inputs = list.querySelectorAll('.fb-q'); var last = inputs[inputs.length - 1]; if (last) { last.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); last.querySelector('input').focus(); }
    });
  });

  pv.addEventListener('input', function (e) { if (e.target.hasAttribute('data-ans')) answers[state.qs[cur].id] = e.target.value; });
  pv.addEventListener('click', function (e) {
    var t = e.target.closest('button'); if (!t) return; var q = state.qs[cur];
    if (t.dataset.opt != null) { answers[q.id] = t.dataset.opt; renderPreview(); return; }
    if (t.dataset.rate) { answers[q.id] = +t.dataset.rate; renderPreview(); return; }
    if (t.dataset.pv === 'back') { cur--; renderPreview(); }
    if (t.dataset.pv === 'restart') { cur = 0; answers = {}; renderPreview(); }
    if (t.dataset.pv === 'next') {
      var v = answers[q.id], err = pv.querySelector('.pv-err');
      if (q.required && (v == null || v === '')) { err.textContent = 'This question is required.'; return; }
      if (q.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { err.textContent = 'Please enter a valid email.'; return; }
      cur++; renderPreview();
    }
  });
  pv.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); var n = pv.querySelector('[data-pv=next]'); if (n) n.click(); } });

  document.getElementById('fb-reset').addEventListener('click', function () {
    if (!confirm('Clear this draft and start a blank form?')) return;
    state = { title: 'Untitled form', desc: '', qs: [] }; cur = 0; answers = {}; render(); save();
  });

  document.getElementById('fb-export').addEventListener('click', function () {
    var data = JSON.stringify({ title: state.title, desc: state.desc, qs: state.qs.map(function (q) { return { id: q.id, type: q.type, label: q.label, required: !!q.required, options: (q.options || []).filter(Boolean) }; }) }).replace(/</g, '\\u003c');
    var html = '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(state.title) + '</title>\n<style>' +
      '*{box-sizing:border-box}body{margin:0;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:linear-gradient(180deg,#f6f3ff,#fff);color:#0b0b0f;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}' +
      'main{width:100%;max-width:640px}.prog{height:4px;background:#e6e0ff;border-radius:4px;margin-bottom:28px;overflow:hidden}.prog i{display:block;height:100%;background:#6d4aff;transition:width .3s}' +
      '.qn{color:#5332e6;font-weight:700;font-size:.9rem;margin-bottom:8px}h1{font-size:1.7rem;letter-spacing:-.02em;margin:0 0 16px}input,textarea{font:inherit;width:100%;border:1px solid #d8ceff;border-radius:10px;padding:12px 14px}input:focus,textarea:focus{outline:none;border-color:#6d4aff;box-shadow:0 0 0 3px #efebff}' +
      '.opt{display:block;width:100%;text-align:left;border:1px solid #d8ceff;background:#fff;border-radius:10px;padding:12px 14px;margin:8px 0;cursor:pointer;font:inherit}.opt.sel,.opt:hover{border-color:#6d4aff;background:#efebff}' +
      '.rate{display:flex;gap:8px}.rate button{width:48px;height:48px;border-radius:10px;border:1px solid #d8ceff;background:#fff;font:600 1rem inherit;cursor:pointer}.rate .sel,.rate button:hover{background:#6d4aff;color:#fff}' +
      '.row{display:flex;gap:10px;margin-top:22px}.btn{font:600 .95rem inherit;padding:12px 18px;border-radius:10px;border:1px solid #d9d8d4;background:#fff;cursor:pointer}.btn.p{background:#6d4aff;color:#fff;border-color:#6d4aff}.err{color:#b91c1c;min-height:1.4em;margin:8px 0 0;font-size:.9rem}pre{background:#fff;border:1px solid #e7e6e3;border-radius:10px;padding:14px;overflow:auto;font-size:.85rem}footer{margin-top:40px;font-size:.8rem;color:#5d5d69}footer a{color:#5332e6}' +
      '</style></head><body><main id="app"></main>\n<script>\n' +
      '// Exported from Tinkro Free Form Builder (https://tinkro.pages.dev/tools/form-builder.html)\n' +
      '// TODO: to collect responses, set ENDPOINT to a URL that accepts POST JSON (e.g. Formspree, a Cloudflare Worker, Google Apps Script).\n' +
      'var ENDPOINT = "";\nvar F = ' + data + ';\n' +
      '(function(){var app=document.getElementById("app"),cur=0,A={};function e(s){return String(s==null?"":s).replace(/[&<>"\\\']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;","\\\'":"&#39;"}[c]})}' +
      'function r(){var n=F.qs.length;if(cur>=n){done();return}var q=F.qs[cur],a=A[q.id],b="";' +
      'if(q.type=="short")b=\'<input data-a aria-label="Answer" value="\'+e(a||"")+\'">\';if(q.type=="email")b=\'<input type="email" data-a aria-label="Email" value="\'+e(a||"")+\'">\';if(q.type=="long")b=\'<textarea data-a rows="5" aria-label="Answer">\'+e(a||"")+"</textarea>";' +
      'if(q.type=="choice")b=q.options.map(function(o){return\'<button class="opt\'+(a===o?" sel":"")+\'" data-o="\'+e(o)+\'">\'+e(o)+"</button>"}).join("");if(q.type=="rating")b=\'<div class="rate">\'+[1,2,3,4,5].map(function(x){return\'<button data-r="\'+x+\'"\'+(a==x?\' class="sel"\':"")+">"+x+"</button>"}).join("")+"</div>";' +
      'app.innerHTML=\'<div class="prog"><i style="width:\'+Math.round(cur/n*100)+\'%"></i></div>\'+(cur==0&&F.desc?"<p><b>"+e(F.title)+"</b> — "+e(F.desc)+"</p>":"")+\'<div class="qn">\'+"Question "+(cur+1)+" of "+n+"</div><h1>"+e(q.label)+(q.required?" *":"")+"</h1>"+b+\'<p class="err"></p><div class="row">\'+(cur?\'<button class="btn" data-b>Back</button>\':"")+\'<button class="btn p" data-n>\'+(cur==n-1?"Submit":"OK ✓")+"</button></div>";var f=app.querySelector("[data-a]");if(f)f.focus()}' +
      'app.addEventListener("input",function(ev){if(ev.target.hasAttribute("data-a"))A[F.qs[cur].id]=ev.target.value});app.addEventListener("keydown",function(ev){if(ev.key=="Enter"&&ev.target.tagName=="INPUT"){ev.preventDefault();var n=app.querySelector("[data-n]");n&&n.click()}});' +
      'app.addEventListener("click",function(ev){var t=ev.target.closest("button");if(!t)return;var q=F.qs[cur];if(t.dataset.o!=null){A[q.id]=t.dataset.o;r();return}if(t.dataset.r){A[q.id]=+t.dataset.r;r();return}if(t.hasAttribute("data-b")){cur--;r();return}' +
      'if(t.hasAttribute("data-n")){var v=A[q.id],er=app.querySelector(".err");if(q.required&&(v==null||v==="")){er.textContent="This question is required.";return}if(q.type=="email"&&v&&!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(v)){er.textContent="Please enter a valid email.";return}cur++;r()}});' +
      'function done(){var out=F.qs.map(function(q){return{question:q.label,answer:A[q.id]==null?"":A[q.id]}});app.innerHTML=\'<div class="prog"><i style="width:100%"></i></div><h1>Thank you!</h1><p>Your response has been recorded.</p>\';' +
      'if(ENDPOINT){fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({form:F.title,submittedAt:new Date().toISOString(),answers:out})}).catch(function(){})}else{app.innerHTML+="<p><small>No endpoint set — here is the response (copy it):</small></p><pre>"+e(JSON.stringify(out,null,2))+"</pre>"}' +
      'app.innerHTML+=\'<footer>Made with <a href="https://tinkro.pages.dev/tools/form-builder.html">Tinkro free form builder</a></footer>\'}r()})();\n<\/script></body></html>';
    var blob = new Blob([html], { type: 'text/html' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = (state.title || 'form').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.html';
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  });

  render();
  saved.textContent = load() ? 'Draft restored from this browser' : 'Drafts save automatically in this browser';
})();
