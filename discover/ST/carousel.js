// ...new file...
/*
  Converts the .grid in LC.html into an infinite carousel that always shows 4 items.
  - preserves existing markup inside .grid
  - clones ends for seamless looping
  - supports pointer/touch drag and mouse wheel (one-step)
*/

(function () {
  const grid = document.querySelector('.grid');
  if (!grid) return;

  const slides = Array.from(grid.children);
  if (slides.length === 0) return;

  const visible = 4;
  const cloneCount = Math.min(visible, slides.length);

  // build DOM: container -> track -> slides
  const container = document.createElement('div');
  container.className = 'grid-carousel-container';
  const track = document.createElement('div');
  track.className = 'grid-carousel-track';

  // move original slides into the track
  slides.forEach(s => track.appendChild(s));

  // replace grid with container and append track
  grid.parentNode.replaceChild(container, grid);
  container.appendChild(track);

  // ensure the track has the same gap as CSS (if any). fallback to 12px.
  const computedGap = parseFloat(getComputedStyle(track).gap) || 0;
  const gap = computedGap || 12;

  // clone last N to front and first N to end for looping
  const currentChildren = Array.from(track.children);
  const firstClones = currentChildren.slice(0, cloneCount).map(n => {
    const c = n.cloneNode(true);
    c.dataset.clone = 'first';
    return c;
  });
  const lastClones = currentChildren.slice(-cloneCount).map(n => {
    const c = n.cloneNode(true);
    c.dataset.clone = 'last';
    return c;
  });

  lastClones.reverse().forEach(c => track.insertBefore(c, track.firstChild));
  firstClones.forEach(c => track.appendChild(c));

  let allSlides = Array.from(track.children);
  let index = cloneCount; // start at real first slide
  let isAnimating = false;

  function slideSize() {
    const rect = allSlides[0].getBoundingClientRect();
    return rect.width + gap;
  }

  function setTransition(on) {
    track.style.transition = on ? 'transform 0.35s ease' : 'none';
  }

  function goTo(i, withTransition = true) {
    setTransition(withTransition);
    const offset = -i * slideSize();
    track.style.transform = `translateX(${offset}px)`;
    index = i;
  }

  function init() {
    allSlides = Array.from(track.children);
    // ensure track uses flex gap if not set inline
    track.style.display = 'flex';
    track.style.gap = `${gap}px`;
    // position to first real slide
    goTo(cloneCount, false);
  }

  track.addEventListener('transitionend', () => {
    allSlides = Array.from(track.children);
    const current = allSlides[index];
    if (!current) return;
    if (current.dataset.clone === 'first') {
      index = cloneCount;
      goTo(index, false);
    } else if (current.dataset.clone === 'last') {
      index = allSlides.length - cloneCount - 1;
      goTo(index, false);
    }
    isAnimating = false;
  });

  function next() {
    if (isAnimating) return;
    isAnimating = true;
    goTo(index + 1, true);
  }
  function prev() {
    if (isAnimating) return;
    isAnimating = true;
    goTo(index - 1, true);
  }

  // wheel -> one-step carousel
  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (delta > 0) {
      if ((e.deltaY > 0) || (e.deltaX > 0)) next();
      else prev();
    }
  }, { passive: false });

  // pointer drag support
  let pointerDown = false;
  let startX = 0;
  let dragging = false;

  container.addEventListener('pointerdown', (e) => {
    pointerDown = true;
    startX = e.clientX;
    setTransition(false);
    container.setPointerCapture(e.pointerId);
  });

  container.addEventListener('pointermove', (e) => {
    if (!pointerDown) return;
    dragging = true;
    const dx = e.clientX - startX;
    const base = -index * slideSize();
    track.style.transform = `translateX(${base + dx}px)`;
  });

  container.addEventListener('pointerup', (e) => {
    if (!pointerDown) return;
    pointerDown = false;
    setTransition(true);

    if (!dragging) { container.releasePointerCapture(e.pointerId); return; }
    dragging = false;
    const dx = e.clientX - startX;
    const threshold = slideSize() * 0.25;
    if (dx < -threshold) next();
    else if (dx > threshold) prev();
    else { goTo(index, true); isAnimating = false; }
    container.releasePointerCapture(e.pointerId);
  });

  // touch fallback
  container.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    setTransition(false);
  }, { passive: true });

  container.addEventListener('touchmove', (e) => {
    const dx = e.touches[0].clientX - startX;
    const base = -index * slideSize();
    track.style.transform = `translateX(${base + dx}px)`;
  }, { passive: true });

  container.addEventListener('touchend', (e) => {
    const dx = (e.changedTouches[0] && e.changedTouches[0].clientX) - startX || 0;
    setTransition(true);
    const threshold = slideSize() * 0.25;
    if (dx < -threshold) next();
    else if (dx > threshold) prev();
    else { goTo(index, true); isAnimating = false; }
  });

  window.addEventListener('resize', () => {
    setTimeout(() => goTo(index, false), 60);
  });

  if (document.readyState === 'complete' || document.readyState === 'interactive') init();
  else document.addEventListener('DOMContentLoaded', init);
})();