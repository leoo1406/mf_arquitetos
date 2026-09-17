/* ============================================================
   mf+arquitetos — motor do site
   roteador · vídeo · revelações · projetos · galeria · tela cheia
   Projetos e configuração do vídeo vivem no data.js; textos institucionais no HTML.
   ============================================================ */
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mqMobile = matchMedia('(max-width: 768px)');
document.body.classList.add('motion');
const esc = s => String(s ?? '').replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

/* ---------- abertura ----------
   Sai no `load`, e o segundo setTimeout é a rede de segurança para o caso
   de uma imagem travar o load e deixar o visitante olhando o preloader. */
let ready = false, _done = false;
function finish() {
  if (_done) return; _done = true;
  $('#pre').classList.add('gone');
  if (!document.body.classList.contains('menu-open')) document.body.classList.remove('lock');
  document.body.classList.add('loaded');
  ready = true; scan(document);
}
document.body.classList.add('lock');
addEventListener('load', () => setTimeout(finish, reduce ? 0 : 450));
setTimeout(finish, reduce ? 100 : 1800);

/* ---------- cursor: acompanha apenas enquanto necessário ---------- */
if (!reduce && matchMedia('(hover:hover) and (pointer:fine)').matches) {
  const ring = $('.cur-r');
  let x = 0, y = 0, rx = 0, ry = 0, raf = 0;
  function follow() {
    rx += (x - rx) * .18; ry += (y - ry) * .18;
    ring.style.transform = `translate(${rx}px,${ry}px)`;
    raf = (Math.abs(x-rx) + Math.abs(y-ry) > .3) ? requestAnimationFrame(follow) : 0;
  }
  addEventListener('mousemove', e => {
    x = e.clientX; y = e.clientY;
    if (!raf) raf = requestAnimationFrame(follow);
    document.body.classList.toggle('cur-lg', !!e.target.closest('.wall-card,.gal-track figure.on'));
  }, { passive: true });
  document.addEventListener('mouseleave', () => document.body.classList.remove('cur-lg'));
}

/* ---------- revelações ----------
   Uma primitiva por efeito (.up, .clip, .diag, .rule, .stats, .card) e o
   data-split, que quebra o título em palavras. O observer solta a classe
   quando o elemento sai da tela, então descer e subir mostra a animação
   de novo, mantendo a navegação fluida nos dois sentidos. */
function split(el) {
  if (el.dataset.done) return;
  el.dataset.done = '1';
  // Conserva quebras de linha e destaques definidos no HTML.
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = []; let node;
  while ((node = walker.nextNode())) nodes.push(node);
  for (const textNode of nodes) {
    const frag = document.createDocumentFragment();
    textNode.textContent.split(/(\s+)/).forEach(word => {
      if (!word.trim()) { frag.append(document.createTextNode(word)); return; }
      const span = document.createElement('span'); span.className = 'w';
      const inner = document.createElement('i'); inner.textContent = word;
      span.append(inner); frag.append(span);
    });
    textNode.replaceWith(frag);
  }
  $$('.w i', el).forEach((item, k) => item.style.transitionDelay = `${k * .045}s`);
}

const SEL = '[data-split],.up,.clip,.diag,.rule,.wall-card';

/* Fila dos projetos: cada fotografia espera a anterior começar, para que o
   sinal + seja desenhado um de cada vez. `rvFim` guarda o instante em que a
   última da fila arranca; quem chega depois disso entra na hora. O teto evita
   que uma rolagem rápida deixe o último card esperando. */
const RV_PASSO = 200, RV_TETO = 800;
let rvFim = 0;
const io = new IntersectionObserver(es => {
  const agora = performance.now();
  const entrando = [];
  for (const e of es) {
    if (e.isIntersecting) { entrando.push(e); continue; }
    e.target.classList.remove('rv');
    e.target.style.removeProperty('--rv-base');
  }
  // Ordem de leitura: de cima para baixo, da esquerda para a direita.
  entrando.sort((a, b) =>
    (a.boundingClientRect.top - b.boundingClientRect.top) ||
    (a.boundingClientRect.left - b.boundingClientRect.left));
  for (const e of entrando) {
    if (!reduce && e.target.matches('.wall-card')) {
      const espera = Math.min(Math.max(rvFim - agora, 0), RV_TETO);
      e.target.style.setProperty('--rv-base', Math.round(espera) + 'ms');
      rvFim = agora + espera + RV_PASSO;
    }
    e.target.classList.add('rv');
  }
}, { threshold: 0, rootMargin: '0px 0px -12% 0px' });

/* A abertura de cada pagina interna so sai da fila preguicosa quando a
   pagina e realmente aberta: nada de baixar fotografias que ninguem pediu. */
function preparaMidia(root) {
  if (!root) return;
  // Agora a página tem caixa de layout: o lazy loading volta a valer.
  $$('.gal-item img[data-src]', root).forEach(img => {
    if (img.dataset.srcset) { img.srcset = img.dataset.srcset; delete img.dataset.srcset; }
    img.src = img.dataset.src; delete img.dataset.src;
  });
  $$('img[data-prime]', root).forEach(img => {
    img.removeAttribute('data-prime');
    img.setAttribute('fetchpriority', 'high');
    img.loading = 'eager';
  });
}

function scan(root = document) {
  if (!ready) return;
  $$('img[src], img[data-src]', root).forEach(img => {
    if (img.hasAttribute('srcset')) return;
    const path = img.getAttribute('src') || img.dataset.src;
    const size = IMAGE_SIZES[path]; if (!size) return;
    img.width = size.w; img.height = size.h;
    // Não antecipa o carregamento das imagens ainda fechadas na galeria.
    if (!img.getAttribute('src')) return;
    img.srcset = `${path.replace(/\.webp$/, '-small.webp')} ${size.smallW}w, ${path} ${size.w}w`;
    if (!img.sizes) img.sizes = img.closest('.film-media,.office-hero,.office-banner,.p-hero') ? '100vw' : '(max-width: 768px) 100vw, 90vw';
  });
  $$('[data-split]', root).forEach(split);
  $$(SEL, root).forEach((el, i) => {
    if (el.matches('.up,.clip,.diag')) el.style.transitionDelay = ((i % 6) * .07) + 's';
    io.observe(el);
  });
}

/* ---------- header, barra de progresso e o estado "sobre o hero" ----------
   A pintura acontece uma vez por quadro. A altura do documento e o hero da
   rota ficam em cache: o scroll deixa de forcar layout a cada evento. */
const hd = $('#hd'), prog = $('#prog');
let scrollRaf = 0, docAlt = 1, medidoEm = 0, heroAtual = null;
function medeDocumento() {
  docAlt = Math.max(document.documentElement.scrollHeight - innerHeight, 1);
  medidoEm = performance.now();
}
function pintaScroll() {
  scrollRaf = 0;
  if (performance.now() - medidoEm > 400) medeDocumento();
  const y = scrollY;
  prog.style.transform = `scaleX(${Math.min(y / docAlt, 1)})`;
  hd.classList.toggle('solid', y > 40);
  document.body.classList.toggle('hero-top', Boolean(heroAtual) && y < 40);
}
function onScroll() { if (!scrollRaf) scrollRaf = requestAnimationFrame(pintaScroll); }
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', () => { medeDocumento(); onScroll(); }, { passive: true });

/* ---------- menu: teclado, foco e fundo inativo ---------- */
const menu = $('#menu'), burger = $('#bg');
let menuLast = null;
function setMenu(open) {
  if (open) menuLast = document.activeElement;
  document.body.classList.toggle('menu-open', open);
  menu.classList.toggle('open', open);
  document.body.classList.toggle('lock', open);
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  menu.setAttribute('aria-hidden', String(!open)); menu.inert = !open;
  $('main').inert = open; $('footer').inert = open; $('.nav').inert = open;
  if (open) { preparaMenuImgs(); $('.menu-l > a').focus({ preventScroll: true }); }
  else if (menuLast?.isConnected) menuLast.focus();
  syncHeroVideo();
}
burger.onclick = () => setMenu(!menu.classList.contains('open'));

/* As fotografias do menu so entram na rede quando o menu e chamado.
   A troca usa .on/.out para que uma imagem sempre cubra a outra: sem flash. */
const menuImgs = $$('#menuImgs img');
function carregaMenuImg(im) {
  if (!im || !im.dataset.src) return;
  if (im.dataset.srcset) { im.srcset = im.dataset.srcset; delete im.dataset.srcset; }
  im.src = im.dataset.src; delete im.dataset.src;
}
function preparaMenuImgs() { menuImgs.forEach(carregaMenuImg); }
burger.addEventListener('pointerenter', preparaMenuImgs, { once: true });
burger.addEventListener('focus', preparaMenuImgs, { once: true });
$$('.menu-l > a').forEach((a, i) => {
  const preview = () => {
    if (menuImgs[i].classList.contains('on')) return;
    carregaMenuImg(menuImgs[i]);
    menuImgs.forEach((im, k) => {
      if (k === i) { im.classList.remove('out'); im.classList.add('on'); }
      else if (im.classList.contains('on')) { im.classList.remove('on'); im.classList.add('out'); }
      else im.classList.remove('out');
    });
  };
  a.addEventListener('mouseenter', preview); a.addEventListener('focus', preview);
});
function closeMenu() { if (menu.classList.contains('open')) setMenu(false); }
addEventListener('keydown', e => {
  if (!menu.classList.contains('open')) return;
  if (e.key === 'Escape') closeMenu();
  if (e.key === 'Tab') {
    const focusable = [burger, ...$$('#menu a[href]')];
    const first = focusable[0], last = focusable.at(-1);
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

/* ---------- abertura em vídeo: reprodução, pausa e imagem alternativa ---------- */
const heroVideo = $('#heroVideo'), heroPause = $('#heroPause');
const heroPoster = $('#heroPoster');
let heroPaused = reduce || Boolean(navigator.connection?.saveData);
let heroVisible = true, heroPlayPending = false, heroFailed = false;
heroVideo.muted = true;
heroVideo.loop = true;
heroVideo.playsInline = true;
if (HERO_VIDEO.poster) {
  // O mesmo arquivo que o <img> ja usa, para nao abrir uma segunda requisicao.
  const posterPequeno = HERO_VIDEO.poster.replace(/\.webp$/, '-small.webp');
  heroVideo.poster = mqMobile.matches && IMAGE_SIZES[HERO_VIDEO.poster] ? posterPequeno : HERO_VIDEO.poster;
  // O HTML ja traz src/srcset do pôster. Só reescreve se o data.js apontar outro arquivo.
  if (heroPoster.getAttribute('src') !== HERO_VIDEO.poster) {
    heroPoster.removeAttribute('srcset');
    heroPoster.src = HERO_VIDEO.poster;
  }
  const dimensions = IMAGE_SIZES[HERO_VIDEO.poster];
  if (dimensions) { heroPoster.width = dimensions.w; heroPoster.height = dimensions.h; }
}

function heroShouldPlay() {
  return !heroPaused && !heroFailed && heroVisible && !document.hidden &&
    $('.page[data-page="home"]').classList.contains('on') &&
    !document.body.classList.contains('menu-open');
}
function updateHeroControl() {
  const paused = heroVideo.paused;
  const label = paused ? 'Reproduzir vídeo' : 'Pausar vídeo';
  heroPause.classList.toggle('paused', paused);
  heroPause.setAttribute('aria-pressed', String(paused));
  heroPause.setAttribute('aria-label', label);
  $('span', heroPause).textContent = label;
}
function syncHeroVideo() {
  if (!heroShouldPlay()) {
    heroVideo.pause();
    updateHeroControl();
    return;
  }
  if (heroPlayPending || !heroVideo.paused) return;
  if (!heroVideo.getAttribute('src')) {
    heroVideo.src = mqMobile.matches && HERO_VIDEO.mobileSrc ? HERO_VIDEO.mobileSrc : HERO_VIDEO.src;
    heroVideo.preload = 'metadata';
    heroVideo.load();
  }
  heroPlayPending = true;
  heroVideo.play().then(() => {
    if (!heroShouldPlay()) heroVideo.pause();
  }).catch(error => {
    // Bloqueios de autoplay mantêm o pôster e oferecem reprodução manual.
    if (error.name !== 'AbortError') heroPaused = true;
  }).finally(() => {
    heroPlayPending = false;
    updateHeroControl();
    if (heroShouldPlay() && heroVideo.paused) syncHeroVideo();
  });
}
heroPause.onclick = () => {
  heroPaused = !heroVideo.paused;
  syncHeroVideo();
};
heroVideo.addEventListener('playing', () => {
  heroVideo.classList.add('has-frame');
  updateHeroControl();
});
heroVideo.addEventListener('pause', updateHeroControl);
heroVideo.addEventListener('error', () => {
  heroFailed = true;
  heroVideo.classList.remove('has-frame');
  heroPause.hidden = true;
});
document.addEventListener('visibilitychange', syncHeroVideo);
const heroObserver = new IntersectionObserver(entries => {
  heroVisible = entries[0].isIntersecting;
  syncHeroVideo();
}, { threshold: 0 });
heroObserver.observe($('.film-hero'));
updateHeroControl();

/* ---------- frentes de atuação: acordeão + painel de imagem ---------- */
(function frentes() {
  const list = $('#svcList'), panel = $('#svcImg'); if (!list) return;
  const items = $$('.dif', list);
  items.forEach((it, i) => {
    const fig = document.createElement('figure');
    // O <source> só entra quando existe mesmo um recorte alternativo (data-img-wide).
    // Sem ele, a regra media servia o arquivo de 2200px justamente às telas pequenas.
    const larga = it.dataset.imgWide;
    fig.innerHTML = `<picture>
      ${larga ? `<source media="(max-width:1023px)" srcset="${larga}">` : ''}
      <img src="${it.dataset.img}" alt="" loading="lazy" decoding="async"
           sizes="(max-width:768px) 100vw, 45vw" style="--pos:${it.dataset.pos || 'center'}">
    </picture>`;
    panel.appendChild(fig);
  });
  const figsD = $$('figure', panel);
  let cur = -1;
  function open(i, { toggle = false } = {}) {
    if (toggle && mqMobile.matches && cur === i) {
      items[i].classList.remove('on');
      $('.dif-btn', items[i]).setAttribute('aria-expanded', 'false');
      $('.dif-body', items[i]).inert = true;
      cur = -1; return;
    }
    if (cur === i) return;
    items.forEach((it, k) => {
      const on = k === i;
      it.classList.toggle('on', on);
      $('.dif-btn', it).setAttribute('aria-expanded', on ? 'true' : 'false');
      $('.dif-body', it).inert = !on;
      if (on) {
        const im = $('.dif-inline img', it);
        if (im && !im.src && im.dataset.src) {
          // srcset antes do src: sem isso o navegador baixaria a versao de 2200px
          // ja no carregamento da home, com a pagina ainda escondida.
          if (im.dataset.srcset) { im.srcset = im.dataset.srcset; delete im.dataset.srcset; }
          im.src = im.dataset.src;
        }
      }
    });
    figsD.forEach((f, k) => {
      if (k === i) { f.classList.remove('out'); void f.offsetWidth; f.classList.add('on'); }
      else if (f.classList.contains('on')) { f.classList.remove('on'); f.classList.add('out'); }
      else f.classList.remove('out');
    });
    cur = i;
  }
  items.forEach((it, i) => {
    const b = $('.dif-btn', it);
    b.addEventListener('click', () => open(i, { toggle: true }));
    b.addEventListener('focus', () => { if (!mqMobile.matches) open(i); });
    it.addEventListener('mouseenter', () => { if (!mqMobile.matches) open(i); });
    b.addEventListener('keydown', e => {
      const n = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
      if (!n) return;
      e.preventDefault();
      $('.dif-btn', items[(i + n + items.length) % items.length]).focus();
    });
  });
  open(0);
  mqMobile.addEventListener('change', () => { if (!mqMobile.matches && cur < 0) open(0); });
})();

/* ---------- projetos: fotografias contínuas, legendas sobre a imagem ---------- */
function smallVariant(path) { return path && !/\.gif$/i.test(path) ? path.replace(/(\.[a-z0-9]+)$/i, '-small$1') : null; }
function responsiveAttrs(path) {
  const size = IMAGE_SIZES[path];
  if (size) return `srcset="${smallVariant(path)} ${size.smallW}w, ${path} ${size.w}w" width="${size.w}" height="${size.h}"`;
  // Sem medida conhecida não dá para afirmar que a variante -small existe.
  // Emitir um srcset para um arquivo inexistente quebraria a fotografia.
  return '';
}
function card(p, heading = 'h3') {
  const responsive = responsiveAttrs(p.cover);
  return `<a class="wall-card" href="#/projeto/${esc(p.slug)}" data-link
    aria-label="${esc(ui('viewProject'))} ${esc(p.title)}, ${esc(p.cidade)}" style="--pos:${esc(p.coverPosition || 'center')}">
    <span class="wall-picture"><img src="${esc(p.cover)}" ${responsive} sizes="(max-width:580px) 100vw, 50vw" alt="${esc(p.imageAlts?.[p.cover] || p.title)}" loading="lazy" decoding="async"></span>
    <div class="wall-copy"><div class="wall-kicker">${esc(p.cat)}${p.render ? ' · ' + esc(ui('rendering')) : ''}</div>
      <${heading}>${esc(p.title)}</${heading}>
      <div class="wall-meta"><span>${esc(p.cidade)}, ${esc(p.uf)}</span><span>${esc(p.render ? p.status : p.area || p.ano)}</span></div>
      <span class="wall-link">${esc(ui('viewProject'))} <svg class="wall-arrow" aria-hidden="true" viewBox="0 0 16 16"><path d="M4 12 12 4M6 4h6v6"/></svg></span>
    </div>
  </a>`;
}
function mosaic(list) { return list.map(p => card(p, 'h2')).join(''); }

const featured = (typeof HOME_FEATURED !== 'undefined'
  ? HOME_FEATURED.map(s => PROJECTS.find(p => p.slug === s)).filter(Boolean) : []);
function renderHomeGrid() { $('#homeGrid').innerHTML = mosaic(featured.length ? featured.map(f => PROJECTS.find(p => p.slug === f.slug) || f) : PROJECTS.slice(0, 4)); }
renderHomeGrid();

/* ---------- página Projetos: dois filtros + busca ---------- */
let CATS = [], STATUS = [];
const pills = (arr, attr) => arr.map((c, i) =>
  `<button class="${i ? '' : 'on'}" data-${attr}="${esc(c)}" aria-pressed="${i ? 'false' : 'true'}">${esc(c)}</button>`).join('');

const norm = s => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
let catAtual = ui('all'), stAtual = ui('all'), busca = '';
function renderFilters() {
  const all = ui('all');
  CATS = [all, ...new Set(PROJECTS.map(p => p.cat))];
  STATUS = [all, ...new Set(PROJECTS.map(p => p.status))];
  catAtual = all; stAtual = all;
  $('#filters').innerHTML = pills(CATS, 'f');
  $('#filtersSt').innerHTML = pills(STATUS, 's');
  ligaFiltro('#filters', 'f', v => catAtual = v);
  ligaFiltro('#filtersSt', 's', v => stAtual = v);
}

const gradeArquivo = $('#allGrid');
let trocaTimer = 0;
/* A grade some por um instante, o HTML e trocado e os novos cards entram
   pelo mesmo reveal da home. Digitar seguido apenas reinicia a espera. */
function pintaProjetos({ suave = true } = {}) {
  if (!suave || reduce || !ready) {
    clearTimeout(trocaTimer);
    gradeArquivo.classList.remove('swapping');
    desenhaProjetos();
    return;
  }
  gradeArquivo.classList.add('swapping');
  clearTimeout(trocaTimer);
  trocaTimer = setTimeout(() => {
    desenhaProjetos();
    gradeArquivo.classList.remove('swapping');
  }, 130);
}
/* A cada terceiro card a fotografia ocupa a largura toda. O sizes precisa
   acompanhar, senão o navegador escolhe a variante pequena e borra. */
function ajustaSizesDaGrade(grid) {
  $$(':scope > .wall-card', grid).forEach((c, i) => {
    const img = $('img', c);
    if (img) img.sizes = (i + 1) % 3 === 0
      ? '100vw'
      : '(max-width:580px) 100vw, 50vw';
  });
}
function desenhaProjetos() {
  const q = norm(busca);
  const lista = PROJECTS.filter(p => {
    if (catAtual !== ui('all') && p.cat !== catAtual) return false;
    if (stAtual !== ui('all') && p.status !== stAtual) return false;
    if (!q) return true;
    const alvo = [p.title, p.cat, p.cidade, p.ano, p.status, p.programa].join(' ');
    return q.split(/\s+/).every(t => norm(alvo).includes(t));
  });
  const grid = gradeArquivo;
  $$(SEL, grid).forEach(el => io.unobserve(el));
  grid.innerHTML = lista.length ? mosaic(lista) : `<div class="no-hit">
      <p>${esc(ui('noProjects'))}${busca ? esc(ui('forSearch', {q: busca})) : ''}${esc(ui('withFilters'))}</p>
      <button class="btn" id="limpaBusca"><span>${esc(ui('seeProjects', {n: PROJECTS.length}))}</span><i></i></button>
    </div>`;
  const n = $('#searchN');
  if (n) n.textContent = q ? `${lista.length} de ${PROJECTS.length}` : '';
  const zerar = $('#limpaBusca');
  if (zerar) zerar.onclick = () => limpaBusca(true);
  ajustaSizesDaGrade(grid);
  scan(grid);
}
function limpaBusca(tudo) {
  busca = ''; $('#projSearch').value = ''; $('#search').classList.remove('filled');
  if (tudo) {
    catAtual = ui('all'); stAtual = ui('all');
    [['#filters', 'f'], ['#filtersSt', 's']].forEach(([sel, attr]) =>
      $$(`${sel} button`).forEach(b => {
        const on = b.dataset[attr] === ui('all');
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      }));
  }
  pintaProjetos();
}
function ligaFiltro(sel, attr, set) {
  $$(`${sel} button`).forEach(b => b.onclick = () => {
    $$(`${sel} button`).forEach(x => { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); });
    b.classList.add('on'); b.setAttribute('aria-pressed', 'true');
    set(b.dataset[attr]); pintaProjetos();
  });
}
renderFilters();
$('#projSearch').addEventListener('input', e => {
  busca = e.target.value;
  $('#search').classList.toggle('filled', !!busca);
  pintaProjetos();
});
$('#projSearch').addEventListener('keydown', e => { if (e.key === 'Escape' && busca) limpaBusca(); });
$('#searchX').onclick = () => { limpaBusca(); $('#projSearch').focus(); };
pintaProjetos({ suave: false });

/* ---------- página de um projeto ---------- */
const ICON_PAUSE = '<svg class="ic-pause" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 2v8M9 2v8" stroke="currentColor" stroke-width="1.6"/></svg>';
const ICON_PLAY  = '<svg class="ic-play" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 2l7 4-7 4z" fill="currentColor"/></svg>';
const ICON_PREV  = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>';
const ICON_NEXT  = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>';
const ICON_FULL  = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>';
const pad2 = n => String(n).padStart(2, '0');

function renderProject(slug) {
  const p = PROJECTS.find(x => x.slug === slug);
  if (!p) {
    gal = null;
    $('#projPage').innerHTML = `<section class="page-head"><div class="wrap"><h1>${esc(ui('projectNotFound'))}</h1><a href="#/projetos" data-link class="btn"><span>${esc(ui('backProjects'))}</span><i></i></a></div></section>`;
    return;
  }
  const outros = PROJECTS.filter(x => x.slug !== p.slug).slice(0, 3);
  const imgs = [p.cover, ...(p.gallery || [])];
  const heroImg = p.heroImage || p.cover;
  const heroPos = p.heroPosition || p.coverPosition || 'center';
  const mediaImg = p.mediaImage || (p.gallery && p.gallery[0]) || p.cover;

  let media = `<img src="${mediaImg}" alt="${esc(p.title)}" loading="lazy">`;
  if (p.video?.type === 'local') {
    media = `<img src="${p.videoPoster || mediaImg}" alt="" loading="lazy">
       <video autoplay muted loop playsinline preload="metadata" ${p.videoPoster ? `poster="${p.videoPoster}"` : ''} aria-label="${esc(ui('project'))}: ${esc(p.title)}"><source src="${esc(p.video.src)}"></video>
       <button class="p-vid" id="pVid" aria-label="${esc(ui('pauseVideo'))}" aria-pressed="false">${ICON_PAUSE}${ICON_PLAY}</button>`;
  } else if (p.video?.type === 'youtube' && p.video.id) {
    media = reduce && p.videoPoster
      ? `<img src="${p.videoPoster}" alt="${esc(p.title)}" loading="lazy">`
      : `<iframe src="https://www.youtube-nocookie.com/embed/${esc(p.video.id)}?autoplay=1&mute=1&loop=1&playlist=${esc(p.video.id)}&controls=1&rel=0" title="${esc(p.title)}" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  }

  const dado = (r, v) => v ? `<div><small class="lbl">${r}</small><b>${v}</b></div>` : '';

  $$(SEL, $('#projPage')).forEach(el => io.unobserve(el));
  $('#projPage').innerHTML = `
  <div class="p-hero" style="--pos:${heroPos}">
    <img src="${heroImg}" alt="${esc(p.imageAlts?.[heroImg] || p.title)}" fetchpriority="high">
    <div class="in">
      <div class="kicker up">${esc(p.cat)} · ${esc(p.status)}${p.render ? ' · ' + esc(ui('rendering')) : ''}</div>
      <h1 data-split style="margin-top:20px">${esc(p.title)}</h1>
    </div>
  </div>
  <div class="p-meta">
    ${dado(ui('location'), [p.cidade,p.uf].filter(Boolean).map(esc).join(' / '))}
    ${dado(ui('year'), esc(p.ano))}
    ${dado(ui('area'), esc(p.area))}
    ${dado(p.programa ? ui('program') : ui('status'), esc(p.programa || p.status))}
  </div>
  <section class="p-edit">
    <div class="wrap">
      <div class="p-edit-text">
        <div class="kicker up">${esc(ui('project'))}</div>
        ${p.intro ? `<h2 class="up">${esc(p.intro)}</h2>` : ''}
        ${(p.texto || []).map(t => `<p class="up">${esc(t)}</p>`).join('')}
        ${p.photographer ? `<p class="credits up">${esc(ui('photography'))}: ${esc(p.photographer)}</p>` : ''}
        ${p.landscaping ? `<p class="credits up">${esc(ui('landscaping'))}: ${esc(p.landscaping)}</p>` : ''}
        ${p.engineering ? `<p class="credits up">${esc(ui('engineering'))}: ${esc(p.engineering)}</p>` : ''}
        ${p.renderCredit ? `<p class="credits up">${esc(ui('renderCredit'))}: ${esc(p.renderCredit)}</p>` : ''}
        ${p.render && !p.renderCredit ? `<p class="credits up">${esc(ui('renderImages'))}</p>` : ''}
        ${p.equipe ? `<p class="up" style="margin-top:26px;font-size:13px"><small class="lbl">${esc(ui('team'))}</small>${esc(p.equipe)}</p>` : ''}
      </div>
      <div class="p-edit-media diag">${media}</div>
    </div>
  </section>
  <section class="gal-sec" aria-roledescription="gallery" aria-label="${esc(ui('galleryOf', {title:p.title}))}">
    <div class="gal-head">
      <div><div class="kicker up">${esc(ui('gallery'))}</div><h2 class="up">${esc(p.title)}</h2></div>
      <div class="gal-count"><b>${pad2(imgs.length)}</b></div>
    </div>
    <div class="gal-grid" id="galGrid">
      ${galleryMosaic(imgs, p)}
    </div>
  </section>
  <section>
    <div class="wrap">
      <div class="proj-head">
        <div><div class="kicker up">${esc(ui('continueSeeing'))}</div><h2 class="up">${esc(ui('otherProjects'))}</h2></div>
        <a href="#/projetos" data-link class="btn up"><span>${esc(ui('seeAll'))}</span><i></i></a>
      </div>
      <div class="grid">${outros.map(o => card(o)).join('')}</div>
    </div>
  </section>`;

  const vb = $('#pVid');
  if (vb) {
    const v = $('.p-edit-media video'); v.muted = true;
    if (reduce) {
      v.removeAttribute('autoplay'); v.pause();
      vb.classList.add('paused'); vb.setAttribute('aria-label', ui('playVideo'));
    }
    v.addEventListener('error', () => { v.remove(); vb.remove(); }, true);
    vb.onclick = () => {
      const pausado = v.paused;
      if (pausado) v.play(); else v.pause();
      vb.classList.toggle('paused', !pausado);
      vb.setAttribute('aria-label', pausado ? ui('pauseVideo') : ui('playVideo'));
      vb.setAttribute('aria-pressed', pausado ? 'false' : 'true');
    };
  }
  initGallery(imgs);
}

/* ---------- galeria do projeto ---------- */
let gal = null;

function galleryMosaic(imgs, p) {
  /* Só a primeira fotografia nasce com src. As demais guardam o endereço em
     data-src e são soltas quando a página deixa de ser display:none — sem isso
     o navegador ignora o loading="lazy" e baixa a galeria inteira de uma vez. */
  const item = (src, i, largo) => {
    const alt = esc(p.imageAlts?.[src] || (p.title + ' — ' + ui('image').toLowerCase() + ' ' + (i + 1)));
    const attrs = responsiveAttrs(src).replace(/^srcset=/, i ? 'data-srcset=' : 'srcset=');
    const sizes = largo ? '100vw' : '(max-width:768px) 100vw, 50vw';
    const fonte = i ? `data-src="${src}" loading="lazy"` : `src="${src}" loading="eager" fetchpriority="high"`;
    return `<figure class="gal-item" data-gal-index="${i}">
      <button type="button" aria-label="${esc(ui('fullscreen'))}: ${alt}">
        <img ${fonte} ${attrs} sizes="${sizes}" alt="${alt}" decoding="async" draggable="false">
      </button>
    </figure>`;
  };

  if (!imgs.length) return '';
  const rows = [`<div class="gal-row gal-row-wide">${item(imgs[0], 0, true)}</div>`];
  for (let i = 1; i < imgs.length; i += 2) {
    const sozinha = !imgs[i + 1];
    const pair = [item(imgs[i], i, sozinha)];
    if (imgs[i + 1]) pair.push(item(imgs[i + 1], i + 1, false));
    rows.push(`<div class="gal-row${sozinha ? ' gal-row-wide' : ''}">${pair.join('')}</div>`);
  }
  return rows.join('');
}

function initGallery(imgs) {
  const grid = $('#galGrid');
  if (!grid) { gal = null; return; }

  const items = $$('.gal-item', grid);
  const setRatio = item => {
    const img = $('img', item);
    if (!img?.naturalWidth || !img?.naturalHeight) return;
    item.style.setProperty('--ratio', (img.naturalWidth / img.naturalHeight).toFixed(5));
  };

  items.forEach(item => {
    const img = $('img', item);
    if (img.complete) setRatio(item);
    else img.addEventListener('load', () => setRatio(item), { once: true });
  });

  grid.addEventListener('click', e => {
    const item = e.target.closest('.gal-item');
    if (!item) return;
    openLb(imgs, Number(item.dataset.galIndex) || 0);
  });

  // A navegação por setas fica reservada ao lightbox; a página usa o mosaico editorial.
  gal = null;
}

/* ---------- tela cheia ---------- */
let lbSet = [], lbI = 0, lbLast = null;
const lb = $('#lb'), lbStage = $('#lbStage');
function openLb(set, i) {
  lbSet = set; lbI = i; lbLast = document.activeElement;
  lbStage.innerHTML = set.map((s, k) =>
    `<figure class="${k === i ? 'on' : ''}"><img ${k === i ? `src="${s}"` : `data-src="${s}"`} alt="Imagem ${k + 1} de ${set.length}" draggable="false"></figure>`).join('');
  lb.inert = false; $('main').inert = true; $('footer').inert = true; $('#hd').inert = true;
  lb.classList.add('on'); lb.setAttribute('aria-hidden', 'false');
  document.body.classList.add('lock');
  paintLb(); $('#lbX').focus();
}
function paintLb(dir) {
  const fg = $$('figure', lbStage);
  lb.dataset.dir = dir || 'next';
  const load = k => { const im = $('img', fg[k]); if (im && !im.src && im.dataset.src) im.src = im.dataset.src; };
  load(lbI);
  if (lbSet.length > 1) { load((lbI + 1) % lbSet.length); load((lbI - 1 + lbSet.length) % lbSet.length); }
  fg.forEach((f, k) => {
    f.setAttribute('aria-hidden', String(k !== lbI));
    if (k === lbI) { f.classList.remove('out'); void f.offsetWidth; f.classList.add('on'); }
    else if (f.classList.contains('on')) { f.classList.remove('on'); f.classList.add('out'); }
    else f.classList.remove('out');
  });
  $('#lbC').textContent = `${pad2(lbI + 1)} / ${pad2(lbSet.length)}`;
  if (gal) gal.show(lbI);
}
function closeLb() {
  lb.classList.remove('on'); lb.setAttribute('aria-hidden', 'true');
  lb.inert = true; $('main').inert = false; $('footer').inert = false; $('#hd').inert = false;
  document.body.classList.remove('lock');
  if (lbLast && lbLast.focus) lbLast.focus();
}
$('#lbX').onclick = closeLb;
$('#lbP').onclick = () => { lbI = (lbI - 1 + lbSet.length) % lbSet.length; paintLb('prev'); };
$('#lbN').onclick = () => { lbI = (lbI + 1) % lbSet.length; paintLb('next'); };
(function () {
  let sx = 0, sy = 0, sw = false, arrastou = false;
  lbStage.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; sw = true; });
  lbStage.addEventListener('pointerup', e => {
    if (!sw) return; sw = false;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      arrastou = true;
      (dx < 0 ? $('#lbN') : $('#lbP')).click();
      setTimeout(() => arrastou = false, 350);
    }
  });
  /* Com object-fit:contain a caixa do <img> cobre todo o palco, mesmo onde só
     existe fundo. Por isso o clique é medido contra a área realmente pintada:
     clicar na fotografia não fecha, clicar nas faixas vazias fecha. */
  const sobreAFoto = (img, x, y) => {
    const r = img.getBoundingClientRect();
    if (!img.naturalWidth || getComputedStyle(img).objectFit !== 'contain') return true;
    const escala = Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight);
    const w = img.naturalWidth * escala, h = img.naturalHeight * escala;
    const l = r.left + (r.width - w) / 2, t = r.top + (r.height - h) / 2;
    return x >= l && x <= l + w && y >= t && y <= t + h;
  };
  lb.addEventListener('click', e => {
    if (arrastou || e.target.closest('button')) return;
    if (e.target.tagName === 'IMG' && sobreAFoto(e.target, e.clientX, e.clientY)) return;
    closeLb();
  });
})();
addEventListener('keydown', e => {
  if (lb.classList.contains('on')) {
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') $('#lbP').click();
    if (e.key === 'ArrowRight') $('#lbN').click();
    if (e.key === 'Tab') {   // mantém o foco preso dentro do diálogo
      const f = $$('#lb button'), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    return;
  }
  if (gal && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') && $('.page[data-page="projeto"]').classList.contains('on')) {
    const r = gal.stage.getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight) {
      e.preventDefault();
      e.key === 'ArrowLeft' ? gal.show(gal.i - 1, 'prev') : gal.show(gal.i + 1, 'next');
    }
  }
});

/* ---------- roteador: um único plano horizontal ---------- */
const T_FECHA = 520;
const T_LIMPA = 1180;
const curtain = $('#curtain');
const TITULO = 'mf+arquitetos';
/* Troque SITE_URL pelo domínio definitivo antes de publicar. */
const SITE_URL = 'https://www.mfmaisarquitetos.com';
const DESCRICOES = {
  pt: {
    home: 'Arquitetura contemporânea, integração com a natureza e materiais brasileiros. Conheça os projetos do mf+arquitetos, escritório de Franca, São Paulo.',
    projetos: 'Casas, interiores e projetos comerciais do mf+arquitetos. Diferentes lugares, o mesmo cuidado em cada detalhe.',
    escritorio: 'Mariana Garcia Oliveira e Filipi Oliveira fundaram o mf+arquitetos em Franca, São Paulo. Arquitetura residencial, comercial, industrial e de interiores.',
    contato: 'Fale com o mf+arquitetos: WhatsApp, e-mail e telefone do escritório em Franca, São Paulo.'
  },
  en: {
    home: 'Contemporary architecture, connection with nature and Brazilian materials. Discover the projects of mf+arquitetos, a studio based in Franca, São Paulo.',
    projetos: 'Houses, interiors and commercial projects by mf+arquitetos. Different places, the same care in every detail.',
    escritorio: 'Mariana Garcia Oliveira and Filipi Oliveira founded mf+arquitetos in Franca, São Paulo. Residential, commercial, industrial and interior architecture.',
    contato: 'Get in touch with mf+arquitetos: WhatsApp, e-mail and phone of the studio in Franca, São Paulo.'
  }
};
const meta = (chave, valor, atributo = 'name') => {
  if (!valor) return;
  let tag = document.head.querySelector(`meta[${atributo}="${chave}"]`);
  if (!tag) { tag = document.createElement('meta'); tag.setAttribute(atributo, chave); document.head.append(tag); }
  tag.setAttribute('content', valor);
};
function metaDaRota(alvo, slug, titulo) {
  const idioma = CURRENT_LANG === 'en' ? 'en' : 'pt';
  const textos = DESCRICOES[idioma];
  const p = alvo === 'projeto' ? PROJECTS.find(x => x.slug === slug) : null;
  const desc = p
    ? [p.title, [p.cidade, p.uf].filter(Boolean).join(', '), p.cat].filter(Boolean).join(' · ')
    : (textos[alvo] || textos.home);
  const url = SITE_URL + '/' + (alvo === 'home' ? '' : location.hash);
  const img = SITE_URL + '/' + ((p && (p.heroImage || p.cover)) || 'img/og-mfmais.jpg');
  meta('description', desc);
  meta('og:title', titulo, 'property'); meta('og:description', desc, 'property');
  meta('og:url', url, 'property'); meta('og:image', img, 'property');
  meta('og:locale', idioma === 'en' ? 'en_US' : 'pt_BR', 'property');
  meta('twitter:title', titulo); meta('twitter:description', desc); meta('twitter:image', img);
  const can = document.head.querySelector('link[rel="canonical"]');
  if (can) can.href = url;
}

function route() {
  const h = location.hash.replace('#/', '') || '';
  const [page, slug] = h.split('/');
  const alvo = page === '' ? 'home' : page;
  const conhecida = ['home', 'projetos', 'projeto', 'escritorio', 'contato'].includes(alvo);
  const t = conhecida ? alvo : 'home';

  if (lb.classList.contains('on')) closeLb();
  if (t !== 'projeto') gal = null;
  if (t === 'projeto') renderProject(slug);

  $$('.page').forEach(pg => {
    const active = pg.dataset.page === t;
    pg.classList.toggle('on', active); pg.inert = !active;
    pg.setAttribute('aria-hidden', String(!active));
  });
  $$('.nav a').forEach(a => {
    const atual = a.dataset.route === t;
    a.classList.toggle('on', atual);
    if (atual) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  scrollTo({ top: 0, left: 0, behavior: 'instant' });
  const pagina = $(`.page[data-page="${t}"]`);
  preparaMidia(pagina);
  scan(pagina);
  heroAtual = $('.page.on .film-hero,.page.on .office-hero,.page.on .p-hero');
  medeDocumento(); pintaScroll(); syncHeroVideo();
  if (ready) $('main').focus({ preventScroll: true });

  const nomes = { projetos: ui('projects'), escritorio: ui('studio'), contato: ui('contact') };
  const nome = t === 'projeto' ? ((PROJECTS.find(p => p.slug === slug) || {}).title || ui('projectNotFound')) : nomes[t];
  const titulo = nome ? `${TITULO} | ${nome}` : (CURRENT_LANG === 'en' ? `${TITULO} | Contemporary architecture in Franca, SP` : `${TITULO} | Arquitetura contemporânea em Franca, SP`);
  document.title = titulo;
  metaDaRota(t, slug, titulo);
}

let navegando = false;
function nav() {
  if (reduce) { route(); return; }
  if (navegando) { route(); return; } navegando = true;
  curtain.classList.remove('out'); curtain.classList.add('in');
  setTimeout(route, T_FECHA);
  setTimeout(() => { curtain.classList.remove('in'); curtain.classList.add('out'); }, T_FECHA + 90);
  setTimeout(() => { curtain.classList.remove('out'); navegando = false; }, T_LIMPA);
}
document.addEventListener('click', e => {
  const a = e.target.closest('[data-link]'); if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault(); closeMenu();
  const to = a.getAttribute('href');
  if (to === location.hash || (to === '#/' && !location.hash)) {
    scrollTo({ top: 0, behavior: reduce ? 'instant' : 'smooth' }); return;
  }
  history.pushState(null, '', to); nav();
});
addEventListener('popstate', nav);
document.addEventListener('mf:langchange', () => {
  renderHomeGrid();
  renderFilters();
  pintaProjetos({ suave: false });
  const h = location.hash.replace('#/', '') || '';
  const [page, slug] = h.split('/');
  if (page === 'projeto' && slug) renderProject(slug);
  const active = $('.page.on');
  if (active) scan(active);
  const nomes = { projetos: ui('projects'), escritorio: ui('studio'), contato: ui('contact') };
  const alvo = page || 'home';
  const nome = alvo === 'projeto' ? ((PROJECTS.find(p => p.slug === slug) || {}).title || ui('projectNotFound')) : nomes[alvo];
  const titulo = nome ? `${TITULO} | ${nome}` : (CURRENT_LANG === 'en' ? `${TITULO} | Contemporary architecture in Franca, SP` : `${TITULO} | Arquitetura contemporânea em Franca, SP`);
  document.title = titulo;
  metaDaRota(alvo, slug, titulo);
});

// Links de âncora não alteram a rota da página.
$('a[href="#selecionados"]').addEventListener('click', e => { e.preventDefault(); $('#selecionados').scrollIntoView({behavior: reduce ? 'instant' : 'smooth'}); });
route();

$('#yr').textContent = new Date().getFullYear();
