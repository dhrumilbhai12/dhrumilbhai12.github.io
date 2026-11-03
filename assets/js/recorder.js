/* Tinkro free screen recorder — 100% in-browser. Nothing is uploaded. */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var startBtn = $('rec-start'), pauseBtn = $('rec-pause'), stopBtn = $('rec-stop');
  var camT = $('opt-cam'), micT = $('opt-mic'), sysT = $('opt-sys'), cdT = $('opt-cd');
  var fmtSel = $('opt-fmt'), timerEl = $('rec-time'), dot = $('rec-dot'), stateEl = $('rec-state');
  var stage = $('stage'), placeholder = $('stage-ph'), canvas = $('rec-canvas'), preview = $('rec-preview');
  var cd = $('countdown'), errBox = $('rec-err'), out = $('rec-out'), dl = $('rec-dl'), dlInfo = $('rec-info'), again = $('rec-again');
  if (!startBtn) return;

  var supported = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia && window.MediaRecorder);
  var mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  if (!supported) {
    startBtn.disabled = true;
    showErr(mobile
      ? 'Screen recording in the browser is not available on most phones and tablets (iOS and Android browsers do not support screen capture). Please open this page on a desktop or laptop in Chrome, Edge, Firefox or Safari 16+. On a phone, use the built-in screen recorder in your control centre / quick settings.'
      : 'Your browser does not support screen recording (getDisplayMedia / MediaRecorder). Please try the latest Chrome, Edge, Firefox or Safari.');
  }

  // Formats
  var candidates = [
    { mime: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', ext: 'mp4', label: 'MP4 (H.264)' },
    { mime: 'video/mp4', ext: 'mp4', label: 'MP4' },
    { mime: 'video/webm;codecs=vp9,opus', ext: 'webm', label: 'WebM (VP9)' },
    { mime: 'video/webm;codecs=vp8,opus', ext: 'webm', label: 'WebM (VP8)' },
    { mime: 'video/webm', ext: 'webm', label: 'WebM' }
  ];
  var formats = window.MediaRecorder ? candidates.filter(function (c) { try { return MediaRecorder.isTypeSupported(c.mime); } catch (e) { return false; } }) : [];
  var seen = {};
  formats.forEach(function (f) {
    if (seen[f.ext]) return; seen[f.ext] = 1;
    var o = document.createElement('option'); o.value = f.mime; o.textContent = f.label; fmtSel.appendChild(o);
  });
  // Prefer WebM by default (most reliable), MP4 if chosen/only option
  for (var i = 0; i < fmtSel.options.length; i++) if (/webm/.test(fmtSel.options[i].value)) { fmtSel.selectedIndex = i; break; }
  if (!fmtSel.options.length) { var o = document.createElement('option'); o.value = ''; o.textContent = 'Browser default'; fmtSel.appendChild(o); }

  var screenStream, camStream, micStream, mixed, recorder, chunks = [], raf, audioCtx;
  var startedAt = 0, elapsed = 0, tick, paused = false, url;
  var screenVid = document.createElement('video'), camVid = document.createElement('video');
  screenVid.muted = camVid.muted = true; screenVid.playsInline = camVid.playsInline = true;

  function showErr(t) { errBox.textContent = t; errBox.classList.remove('hidden'); }
  function clearErr() { errBox.classList.add('hidden'); errBox.textContent = ''; }
  function fmt(ms) { var s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); s = s % 60; return (h ? h + ':' : '') + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0'); }
  function setState(t, cls) { stateEl.textContent = t; dot.className = 'dot' + (cls ? ' ' + cls : ''); }
  function now() { return elapsed + (startedAt && !paused ? Date.now() - startedAt : 0); }
  function stopAll() {
    cancelAnimationFrame(raf); clearInterval(tick);
    [screenStream, camStream, micStream, mixed].forEach(function (s) { if (s) s.getTracks().forEach(function (t) { t.stop(); }); });
    if (audioCtx) { audioCtx.close().catch(function(){}); audioCtx = null; }
    screenStream = camStream = micStream = mixed = null;
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  async function start() {
    clearErr(); out.classList.add('hidden');
    try {
      screenStream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: sysT.checked });
    } catch (e) {
      if (e && e.name === 'NotAllowedError') showErr('Screen sharing was cancelled or blocked. Click "Start recording" and choose a screen, window or tab to share.');
      else showErr('Could not start screen capture: ' + (e && e.message ? e.message : e));
      return;
    }
    if (camT.checked) {
      try { camStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 640, facingMode: 'user' }, audio: false }); }
      catch (e) { showErr('Camera not available (' + (e.name || e) + '). Recording without the camera bubble.'); camStream = null; }
    }
    if (micT.checked) {
      try { micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false }); }
      catch (e) { showErr('Microphone not available (' + (e.name || e) + '). Recording without your voice.'); micStream = null; }
    }

    // Video: composite via canvas when camera is on; otherwise record the screen track directly
    var videoTrack;
    screenVid.srcObject = screenStream; await screenVid.play().catch(function(){});
    if (camStream) {
      camVid.srcObject = camStream; await camVid.play().catch(function(){});
      var st = screenStream.getVideoTracks()[0].getSettings();
      canvas.width = st.width || screenVid.videoWidth || 1920; canvas.height = st.height || screenVid.videoHeight || 1080;
      var ctx = canvas.getContext('2d');
      var draw = function () {
        if (screenVid.videoWidth && (canvas.width !== screenVid.videoWidth)) { canvas.width = screenVid.videoWidth; canvas.height = screenVid.videoHeight; }
        ctx.drawImage(screenVid, 0, 0, canvas.width, canvas.height);
        var d = Math.round(Math.min(canvas.width, canvas.height) * 0.24), m = Math.round(d * 0.12);
        var x = canvas.width - d - m, y = canvas.height - d - m;
        ctx.save(); ctx.beginPath(); ctx.arc(x + d / 2, y + d / 2, d / 2, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
        var vw = camVid.videoWidth || 1, vh = camVid.videoHeight || 1, s = Math.min(vw, vh);
        ctx.translate(x + d, y); ctx.scale(-1, 1); // mirror selfie
        ctx.drawImage(camVid, (vw - s) / 2, (vh - s) / 2, s, s, 0, 0, d, d);
        ctx.restore();
        ctx.beginPath(); ctx.arc(x + d / 2, y + d / 2, d / 2, 0, Math.PI * 2); ctx.lineWidth = Math.max(4, d * 0.03); ctx.strokeStyle = '#ffffff'; ctx.stroke();
        raf = requestAnimationFrame(draw);
      };
      draw();
      // keep drawing when tab is hidden (rAF pauses): fallback timer
      tick = setInterval(function () { if (document.hidden) { cancelAnimationFrame(raf); draw(); } }, 1000 / 15);
      videoTrack = canvas.captureStream(30).getVideoTracks()[0];
      canvas.classList.remove('hidden'); preview.classList.add('hidden');
    } else {
      videoTrack = screenStream.getVideoTracks()[0];
      preview.srcObject = screenStream; preview.muted = true; preview.controls = false; preview.classList.remove('hidden'); canvas.classList.add('hidden');
      preview.play().catch(function(){});
    }
    placeholder.classList.add('hidden');

    // Audio: mix system + mic
    var tracks = [videoTrack];
    var aSources = [screenStream, micStream].filter(function (s) { return s && s.getAudioTracks().length; });
    if (aSources.length === 1) tracks.push(aSources[0].getAudioTracks()[0]);
    else if (aSources.length > 1) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      var dest = audioCtx.createMediaStreamDestination();
      aSources.forEach(function (s) { audioCtx.createMediaStreamSource(s).connect(dest); });
      tracks.push(dest.stream.getAudioTracks()[0]);
    }
    mixed = new MediaStream(tracks);

    // Stop if user ends sharing from browser UI
    screenStream.getVideoTracks()[0].addEventListener('ended', function () { if (recorder && recorder.state !== 'inactive') recorder.stop(); });

    startBtn.disabled = true; camT.disabled = micT.disabled = sysT.disabled = fmtSel.disabled = cdT.disabled = true;
    if (cdT.checked) {
      cd.style.display = 'grid';
      for (var n = 3; n > 0; n--) { cd.textContent = n; await wait(1000); }
      cd.style.display = 'none';
      if (!screenStream || !screenStream.active) { reset(); return; }
    }

    chunks = [];
    var opts = fmtSel.value ? { mimeType: fmtSel.value, videoBitsPerSecond: 5e6 } : {};
    try { recorder = new MediaRecorder(mixed, opts); } catch (e) { recorder = new MediaRecorder(mixed); }
    recorder.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
    recorder.onstop = finish;
    recorder.start(1000);
    startedAt = Date.now(); elapsed = 0; paused = false;
    setState('Recording', 'rec');
    var t2 = setInterval(function () { if (!recorder || recorder.state === 'inactive') return clearInterval(t2); timerEl.textContent = fmt(now()); }, 250);
    pauseBtn.disabled = false; stopBtn.disabled = false; pauseBtn.textContent = 'Pause';
  }

  function togglePause() {
    if (!recorder) return;
    if (recorder.state === 'recording') { recorder.pause(); elapsed += Date.now() - startedAt; paused = true; pauseBtn.textContent = 'Resume'; setState('Paused', 'pause'); }
    else if (recorder.state === 'paused') { recorder.resume(); startedAt = Date.now(); paused = false; pauseBtn.textContent = 'Pause'; setState('Recording', 'rec'); }
  }

  function finish() {
    var dur = now(); elapsed = dur; startedAt = 0;
    var type = (recorder && recorder.mimeType) || fmtSel.value || 'video/webm';
    var ext = /mp4/.test(type) ? 'mp4' : 'webm';
    var blob = new Blob(chunks, { type: type.split(';')[0] });
    stopAll();
    if (url) URL.revokeObjectURL(url);
    url = URL.createObjectURL(blob);
    preview.srcObject = null; preview.src = url; preview.muted = false; preview.controls = true; preview.classList.remove('hidden'); canvas.classList.add('hidden');
    var name = 'tinkro-recording-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.' + ext;
    dl.href = url; dl.download = name;
    dlInfo.textContent = ext.toUpperCase() + ' · ' + fmt(dur) + ' · ' + (blob.size / 1048576).toFixed(1) + ' MB';
    out.classList.remove('hidden');
    setState('Done — preview below or download', '');
    pauseBtn.disabled = stopBtn.disabled = true;
    startBtn.disabled = false; camT.disabled = micT.disabled = sysT.disabled = fmtSel.disabled = cdT.disabled = false;
    startBtn.textContent = 'Record again';
    recorder = null;
  }
  function reset() {
    stopAll(); setState('Ready', ''); timerEl.textContent = '00:00';
    startBtn.disabled = !supported; pauseBtn.disabled = stopBtn.disabled = true;
    camT.disabled = micT.disabled = sysT.disabled = fmtSel.disabled = cdT.disabled = false;
    placeholder.classList.remove('hidden'); preview.classList.add('hidden'); canvas.classList.add('hidden');
  }

  startBtn.addEventListener('click', start);
  pauseBtn.addEventListener('click', togglePause);
  stopBtn.addEventListener('click', function () { if (recorder && recorder.state !== 'inactive') recorder.stop(); });
  again.addEventListener('click', function () { out.classList.add('hidden'); reset(); startBtn.focus(); });
  window.addEventListener('beforeunload', function (e) { if (recorder && recorder.state !== 'inactive') { e.preventDefault(); e.returnValue = ''; } });
})();
