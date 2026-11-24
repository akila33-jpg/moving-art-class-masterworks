(function(){
  document.documentElement.setAttribute("data-enhanced", "true");

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Scroll reveal: mark already-visible items first so they never flash hidden */
  function setupReveal(){
    var els = document.querySelectorAll(".card, .process-block, .theme-head");
    var io = "IntersectionObserver" in window ? new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, {rootMargin: "0px 0px -8% 0px", threshold: 0.08}) : null;

    els.forEach(function(el){
      var r = el.getBoundingClientRect();
      if (reduce || (r.top < window.innerHeight * 0.95 && r.bottom > 40)){
        el.classList.add("is-in");
      }
      el.classList.add("reveal");
      if (io && !el.classList.contains("is-in")) io.observe(el);
    });
  }

  /* Series explorer: hover, focus, or tap a work to highlight related colours, gold-line rows, and birds */
  var WORKS = {
    sunrise: {name:"〈朝陽〉", gold:"左緣 26 cm，與〈流水〉交界 32 cm", bird:"一小隻迎光的剪影", butterfly:"沒有，或只留極小的一點", colors:"金黃、橘、冷灰藍", href:"#sunrise"},
    water: {name:"〈流水〉", gold:"與〈朝陽〉交界 32 cm，與〈原彩〉交界 24 cm（全系列最低處）", bird:"一或兩隻低飛在水面上方", butterfly:"一隻停在岸邊", colors:"淡金綠、青藍", href:"#water"},
    color: {name:"〈原彩〉", gold:"與〈流水〉交界 24 cm，與〈樹影〉交界 30 cm", bird:"數量少", butterfly:"全系列最明顯，帶點描筆觸", colors:"赭紅、深綠（最飽和）", href:"#color"},
    trees: {name:"〈樹影〉", gold:"與〈原彩〉交界 30 cm，與〈暮色〉交界 27 cm", bird:"一隻停在枝上", butterfly:"小小一隻，藏在光斑裡", colors:"黃綠、藍紫陰影", href:"#trees"},
    dusk: {name:"〈暮色〉", gold:"與〈樹影〉交界 27 cm，與〈星空〉交界 33 cm（全系列最高處）", bird:"成群歸來，鳥最多的一幅", butterfly:"一隻停憩", colors:"橘紅、紫", href:"#dusk"},
    stars: {name:"〈星空〉", gold:"與〈暮色〉交界 33 cm，右緣 26 cm（與朝陽左緣同高）", bird:"一隻棲息的剪影，呼應〈朝陽〉", butterfly:"變成一個光點", colors:"深藍、墨綠、一點金", href:"#stars"}
  };

  var activeWork = null;

  function worksOf(el){
    var one = el.getAttribute("data-work");
    if (one) return [one];
    var many = el.getAttribute("data-works");
    return many ? many.split(/\s+/) : [];
  }

  function setActive(work){
    activeWork = work || null;
    var root = document.getElementById("process");
    if (!root) return;
    var exploring = !!work;
    root.querySelectorAll(".hang, .swatch-row, table.process").forEach(function(el){
      el.classList.toggle("is-exploring", exploring);
    });
    root.querySelectorAll("[data-work], [data-works]").forEach(function(el){
      var on = work && worksOf(el).indexOf(work) !== -1;
      el.classList.toggle("is-active", on);
      if (el.tagName.toLowerCase() === "a" || el.tagName.toLowerCase() === "button"){
        if (on) el.setAttribute("aria-current", "true");
        else el.removeAttribute("aria-current");
      }
    });
    var detail = document.getElementById("series-detail");
    var hint = document.getElementById("series-hint");
    var clearBtn = document.getElementById("series-clear");
    if (clearBtn) clearBtn.hidden = !work;
    if (!detail) return;
    if (!work){
      detail.hidden = true;
      detail.innerHTML = "";
      if (hint) hint.hidden = false;
      return;
    }
    var info = WORKS[work];
    if (!info) return;
    if (hint) hint.hidden = true;
    detail.hidden = false;
    detail.innerHTML = "<strong>" + info.name + "</strong>　主調：" + info.colors +
      "。金線 " + info.gold + "。飛鳥：" + info.bird + "。蝴蝶：" + info.butterfly +
      "。<br><a class=\"jump\" href=\"" + info.href + "\">查看" + info.name + "的名作參考</a>";
  }

  function setupExplorer(){
    var root = document.getElementById("process");
    if (!root) return;
    var clearBtn = document.getElementById("series-clear");
    if (clearBtn){
      clearBtn.addEventListener("click", function(){ setActive(null); });
    }
    root.addEventListener("mouseover", function(e){
      var el = e.target.closest("[data-work], [data-works]");
      if (!el || !root.contains(el)) return;
      var list = worksOf(el);
      if (!list.length) return;
      if (list.length === 1) setActive(list[0]);
      else if (!(activeWork && list.indexOf(activeWork) !== -1)) setActive(list[0]);
    });
    root.addEventListener("focusin", function(e){
      var el = e.target.closest("[data-work], [data-works]");
      if (!el || !root.contains(el)) return;
      var list = worksOf(el);
      if (!list.length) return;
      if (list.length === 1) setActive(list[0]);
      else if (!(activeWork && list.indexOf(activeWork) !== -1)) setActive(list[0]);
    });
    root.addEventListener("click", function(e){
      if (e.target.closest("a.jump, #series-clear")) return;
      var el = e.target.closest("[data-work], [data-works]");
      if (!el || !root.contains(el)) return;
      var list = worksOf(el);
      if (!list.length) return;
      var work = list.length === 1 ? list[0] : ((activeWork && list.indexOf(activeWork) !== -1) ? activeWork : list[0]);
      setActive(work);
      /* Colour blocks are for comparing; jump to masterworks via the detail link. Without JS, these stay as ordinary links. */
      if (el.tagName.toLowerCase() === "a" && el.getAttribute("href")) e.preventDefault();
    });
  }

  function setupGoldLine(){
    var hang = document.querySelector(".hang");
    var line = document.querySelector(".gold-line");
    if (!hang || !line) return;
    if (reduce){
      hang.classList.add("is-drawn");
      return;
    }
    function maybeDraw(){
      var r = hang.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.9 && r.bottom > 40) hang.classList.add("is-drawn");
    }
    maybeDraw();
    if (!("IntersectionObserver" in window)){
      hang.classList.add("is-drawn");
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          hang.classList.add("is-drawn");
          io.disconnect();
        }
      });
    }, {threshold: 0.12, rootMargin: "0px 0px -5% 0px"});
    io.observe(hang);
    window.addEventListener("scroll", maybeDraw, {passive:true});
  }

  /* Music: off by default, never autoplays, remembers last choice for the next click */
  function setupMusic(){
    var btn = document.getElementById("music-toggle");
    var audio = document.getElementById("music-audio");
    if (!btn || !audio) return;
    var KEY = "moving-art-class-music";
    var TARGET = 0.22;
    var fadeTimer = null;
    var wanted = false;
    try { wanted = localStorage.getItem(KEY) === "on"; } catch (err){ wanted = false; }

    function setLabel(on, pending){
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      if (on) btn.textContent = "♪ 播放中";
      else if (pending) btn.textContent = "♪ 點此播放";
      else btn.textContent = "♪ 背景音樂";
    }
    function fadeVolume(to, ms, done){
      if (fadeTimer) cancelAnimationFrame(fadeTimer);
      var from = audio.volume;
      var t0 = performance.now();
      function step(now){
        var p = Math.min(1, (now - t0) / ms);
        audio.volume = from + (to - from) * p;
        if (p < 1) fadeTimer = requestAnimationFrame(step);
        else if (done) done();
      }
      fadeTimer = requestAnimationFrame(step);
    }
    function play(){
      audio.volume = 0;
      var p = audio.play();
      if (p && p.catch) p.catch(function(){ setLabel(false, true); });
      fadeVolume(TARGET, 1200);
      setLabel(true, false);
      try { localStorage.setItem(KEY, "on"); } catch (err){}
    }
    function stop(){
      fadeVolume(0, 800, function(){ audio.pause(); });
      setLabel(false, false);
      try { localStorage.setItem(KEY, "off"); } catch (err){}
    }
    setLabel(false, wanted);
    btn.addEventListener("click", function(){
      if (!audio.paused && !audio.ended && audio.currentTime > 0 && btn.getAttribute("aria-pressed") === "true"){
        stop();
      } else {
        play();
      }
    });
  }

  setupReveal();
  setupExplorer();
  setupGoldLine();
  setupMusic();
})();
