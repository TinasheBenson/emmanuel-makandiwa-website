/**
 * Site-wide motion engine.
 *
 * Tiers (set on <html data-motion> by the inline script in Base.astro):
 *   full    – desktop / Wi-Fi: background films, smooth scroll, every effect
 *   lite    – mobile data, Save-Data, low memory: all GSAP motion, but no
 *             autoplay video and native scrolling (posters + CSS Ken Burns)
 *   reduced – prefers-reduced-motion: no movement, content simply appears
 *
 * Astro's ClientRouter swaps pages without a full reload, so everything here
 * is set up on `astro:page-load` inside a gsap.context and torn down on
 * `astro:before-swap`.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText, MorphSVGPlugin);

type Tier = 'full' | 'lite' | 'reduced';

const root = document.documentElement;
const tier = (): Tier => (root.dataset.motion as Tier) || 'lite';
const finePointer = () => matchMedia('(pointer: fine)').matches;

let ctx: gsap.Context | null = null;
let mm: gsap.MatchMedia | null = null;
let lenis: Lenis | null = null;
let lenisTick: ((time: number) => void) | null = null;
let videoObserver: IntersectionObserver | null = null;
const cleanups: Array<() => void> = [];

declare global {
  interface Window {
    __motionBooted?: boolean;
    __lenis?: Lenis | null;
  }
}

/* ---------------------------------------------------------------- scroll */

function startLenis() {
  if (tier() !== 'full' || !finePointer()) return;
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, anchors: true });
  window.__lenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  lenisTick = (time) => lenis?.raf(time * 1000);
  gsap.ticker.add(lenisTick);
  gsap.ticker.lagSmoothing(0);
}

function stopLenis() {
  if (lenisTick) gsap.ticker.remove(lenisTick);
  lenis?.destroy();
  lenis = null;
  lenisTick = null;
  window.__lenis = null;
}

/* ---------------------------------------------------------------- header */

function header() {
  const el = document.querySelector<HTMLElement>('[data-header]');
  if (!el) return;
  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    el.classList.toggle('is-scrolled', y > 40);
    const menuOpen = root.classList.contains('menu-open');
    el.classList.toggle('is-hidden', !menuOpen && y > lastY && y > 400);
    lastY = y;
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  cleanups.push(() => window.removeEventListener('scroll', onScroll));

  // Flip header colours when it sits over a light section.
  document.querySelectorAll<HTMLElement>('.section--light, [data-header-light]').forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top top+=40',
      end: 'bottom top+=40',
      toggleClass: { targets: el, className: 'on-light' },
    });
  });
}

/* ------------------------------------------------------------ text split */

function splitHeadings() {
  document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    const mode = el.dataset.split; // "hero" plays immediately; anything else on scroll
    gsap.set(el, { visibility: 'visible' });
    SplitText.create(el, {
      type: 'lines,words',
      mask: 'lines',
      linesClass: 'split-line',
      autoSplit: true,
      onSplit(self) {
        return gsap.from(self.words, {
          yPercent: 115,
          rotate: 4,
          duration: 1.15,
          ease: 'expo.out',
          stagger: 0.045,
          delay: mode === 'hero' ? 0.25 : 0,
          scrollTrigger:
            mode === 'hero' ? undefined : { trigger: el, start: 'top 85%', once: true },
        });
      },
    });
  });
}

/* Statement paragraphs whose words brighten one by one as you scroll. */
function scrubWords() {
  document.querySelectorAll<HTMLElement>('[data-scrub-words]').forEach((el) => {
    const split = SplitText.create(el, { type: 'words', wordsClass: 'scrub-word' });
    gsap.fromTo(
      split.words,
      { opacity: 0.16 },
      {
        opacity: 1,
        ease: 'none',
        stagger: 0.1,
        scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true },
      },
    );
  });
}

/* --------------------------------------------------------------- reveals */

function reveals() {
  ScrollTrigger.batch('[data-reveal="up"], [data-reveal=""]', {
    start: 'top 88%',
    once: true,
    onEnter: (els) =>
      gsap.fromTo(
        els,
        { opacity: 0, y: 48 },
        { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.09, overwrite: true },
      ),
  });

  ScrollTrigger.batch('[data-reveal="fade"]', {
    start: 'top 90%',
    once: true,
    onEnter: (els) => gsap.to(els, { opacity: 1, duration: 1.2, ease: 'power2.out', stagger: 0.08 }),
  });

  // Image wipe: the frame un-clips upward while the image settles from a zoom.
  document.querySelectorAll<HTMLElement>('[data-reveal="clip"]').forEach((el) => {
    const media = el.querySelector('img, video');
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    tl.fromTo(
      el,
      { opacity: 1, clipPath: 'inset(100% 0% 0% 0% round 14px)' },
      { clipPath: 'inset(0% 0% 0% 0% round 14px)', duration: 1.4, ease: 'expo.inOut' },
    );
    if (media) tl.fromTo(media, { scale: 1.35 }, { scale: 1, duration: 1.8, ease: 'expo.out' }, 0);
  });
}

/* -------------------------------------------------------------- parallax */

function parallax() {
  document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
    const amount = parseFloat(el.dataset.parallax || '0.15');
    gsap.fromTo(
      el,
      { yPercent: -amount * 100 },
      {
        yPercent: amount * 100,
        ease: 'none',
        scrollTrigger: { trigger: el.parentElement || el, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });
}

/* ---------------------------------------------------- hero → card morph */

function heroMorph() {
  const hero = document.querySelector<HTMLElement>('[data-hero-morph]');
  if (!hero) return;
  const media = hero.querySelector<HTMLElement>('[data-hero-media]');
  const content = hero.querySelector<HTMLElement>('[data-hero-content]');
  if (!media) return;

  // As you scroll, the full-bleed film shrinks into a rounded card and the
  // headline drifts up and dims: one continuous "camera pull-back".
  const tl = gsap.timeline({
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 },
  });
  tl.to(media, { clipPath: 'inset(9% 6% 9% 6% round 24px)', scale: 0.96, ease: 'none' }, 0);
  if (content) tl.to(content, { yPercent: -35, opacity: 0, ease: 'none' }, 0);
}

/* ------------------------------------------------------- pinned stories */

function horizontalScroll() {
  mm?.add('(min-width: 900px)', () => {
    document.querySelectorAll<HTMLElement>('[data-hscroll]').forEach((section) => {
      const track = section.querySelector<HTMLElement>('[data-hscroll-track]');
      if (!track) return;
      const distance = () => track.scrollWidth - window.innerWidth;
      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      });
      // Each panel's image counter-moves for depth.
      track.querySelectorAll<HTMLElement>('[data-hscroll-media]').forEach((img) => {
        gsap.fromTo(
          img,
          { xPercent: -12 },
          {
            xPercent: 12,
            ease: 'none',
            scrollTrigger: {
              trigger: img.parentElement,
              containerAnimation: tween,
              start: 'left right',
              end: 'right left',
              scrub: true,
            },
          },
        );
      });
    });
  });
}

/* ---------------------------------------------------------- SVG morphs */

function svgMorphs() {
  // <svg data-morph> containing <path data-morph-shape> elements: the first is
  // visible and morphs through the others as the section scrolls.
  document.querySelectorAll<SVGSVGElement>('svg[data-morph]').forEach((svg) => {
    const shapes = Array.from(svg.querySelectorAll<SVGPathElement>('[data-morph-shape]'));
    if (shapes.length < 2) return;
    const [target, ...rest] = shapes;
    rest.forEach((s) => (s.style.visibility = 'hidden'));
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: svg.closest('section') || svg,
        start: 'top 70%',
        end: 'bottom 30%',
        scrub: 1,
      },
    });
    rest.forEach((shape) => tl.to(target, { morphSVG: shape, ease: 'power1.inOut', duration: 1 }));
    tl.to(svg, { rotate: 90, transformOrigin: '50% 50%', ease: 'none', duration: rest.length }, 0);
  });
}

/* --------------------------------------------------------------- numbers */

function counters() {
  document.querySelectorAll<HTMLElement>('[data-counter]').forEach((el) => {
    const end = parseFloat(el.dataset.counter || '0');
    const obj = { v: 0 };
    gsap.to(obj, {
      v: end,
      duration: 2.2,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => {
        const n = Math.round(obj.v);
        el.textContent = el.dataset.plain !== undefined ? String(n) : n.toLocaleString();
      },
    });
  });
}

/* --------------------------------------------------------------- marquee */

function marquees() {
  document.querySelectorAll<HTMLElement>('[data-marquee]').forEach((el) => {
    const track = el.querySelector<HTMLElement>('[data-marquee-track]');
    if (!track) return;
    const speed = parseFloat(el.dataset.marquee || '40');
    const loop = gsap.to(track, { xPercent: -50, ease: 'none', duration: speed, repeat: -1 });
    // Scroll velocity nudges the marquee, like a reel catching momentum.
    ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const v = gsap.utils.clamp(-4, 4, self.getVelocity() / 300);
        gsap.to(loop, { timeScale: 1 + Math.abs(v), duration: 0.3, overwrite: true });
        gsap.to(loop, { timeScale: 1, duration: 1.2, delay: 0.3, overwrite: false });
      },
    });
  });
}

/* -------------------------------------------------------------- magnetic */

function magnetic() {
  if (!finePointer()) return;
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
    };
    const leave = () => {
      xTo(0);
      yTo(0);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    cleanups.push(() => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    });
  });
}

/* ---------------------------------------------------------------- videos */

/**
 * <video data-adaptive-video data-src-webm data-src-mp4 poster>: sources are
 * only attached on the full tier (or after the visitor taps "play film"), so
 * mobile visitors never download video they didn't ask for.
 */
function attachSources(video: HTMLVideoElement) {
  if (video.dataset.loaded) return;
  const { srcWebm, srcMp4 } = video.dataset;
  if (srcWebm) video.insertAdjacentHTML('beforeend', `<source src="${srcWebm}" type="video/webm">`);
  if (srcMp4) video.insertAdjacentHTML('beforeend', `<source src="${srcMp4}" type="video/mp4">`);
  video.dataset.loaded = 'true';
  video.load();
}

function videos() {
  const list = Array.from(document.querySelectorAll<HTMLVideoElement>('video[data-adaptive-video]'));
  if (!list.length) return;

  videoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        const v = target as HTMLVideoElement;
        if (!v.dataset.loaded) return;
        if (isIntersecting) v.play().catch(() => {});
        else v.pause();
      });
    },
    { threshold: 0.15 },
  );

  list.forEach((video) => {
    if (tier() === 'full') attachSources(video);
    videoObserver!.observe(video);
    video.addEventListener('playing', () => video.closest('[data-film]')?.classList.add('is-playing'), {
      once: true,
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-play-film]').forEach((btn) => {
    const onClick = () => {
      const video = btn.closest('[data-film]')?.querySelector<HTMLVideoElement>('video[data-adaptive-video]');
      if (!video) return;
      attachSources(video);
      video.play().catch(() => {});
      btn.hidden = true;
    };
    btn.addEventListener('click', onClick);
    cleanups.push(() => btn.removeEventListener('click', onClick));
  });
}

/* ------------------------------------------------------------- lifecycle */

function reducedSetup() {
  // Content is already visible (CSS only hides it for animated tiers); just
  // wire up the essentials.
  header();
  videos();
}

function init() {
  window.__motionBooted = true;
  if (tier() === 'reduced') {
    ctx = gsap.context(reducedSetup);
    return;
  }
  startLenis();
  mm = gsap.matchMedia();
  ctx = gsap.context(() => {
    header();
    splitHeadings();
    scrubWords();
    reveals();
    parallax();
    heroMorph();
    horizontalScroll();
    svgMorphs();
    counters();
    marquees();
    magnetic();
    videos();
  });
  // Fonts and lazy images change layout; recalc trigger positions once settled.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}

function destroy() {
  cleanups.splice(0).forEach((fn) => fn());
  videoObserver?.disconnect();
  videoObserver = null;
  mm?.revert();
  mm = null;
  ctx?.revert();
  ctx = null;
  stopLenis();
}

document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', destroy);
