
(function () {
  const container = document.querySelector('.carousel-container');
  const track = container && container.querySelector('.carousel-track');
  if (!container || !track) return;

  let slides = Array.from(track.children);
  const computed = getComputedStyle(track);
  const gap = parseFloat(computed.gap || 0);

  const firstClone = slides[0].cloneNode(true);
  const lastClone = slides[slides.length - 1].cloneNode(true);
  firstClone.dataset.clone = 'first';
  lastClone.dataset.clone = 'last';
  track.appendChild(firstClone);
  track.insertBefore(lastClone, track.firstChild);

  slides = Array.from(track.children);
  let index = 1; 
  let isAnimating = false;

  function slideSize() {
    const w = slides[0].getBoundingClientRect().width;
    return w + gap;
  }

  function setTransition(enabled) {
    track.style.transition = enabled ? 'transform 0.4s ease' : 'none';
  }

  function goToIndex(i, withTransition = true) {
    setTransition(withTransition);
    const offset = -i * slideSize();
    track.style.transform = `translateX(${offset}px)`;
    index = i;
  }

  function init() {
    goToIndex(1, false);
  }

  track.addEventListener('transitionend', () => {
    const current = slides[index];
    if (!current) return;
    if (current.dataset.clone === 'first') {
      goToIndex(1, false);
    } else if (current.dataset.clone === 'last') {
      goToIndex(slides.length - 2, false);
    }
    isAnimating = false;
  });

  function next() {
    if (isAnimating) return;
    isAnimating = true;
    goToIndex(index + 1, true);
  }
  function prev() {
    if (isAnimating) return;
    isAnimating = true;
    goToIndex(index - 1, true);
  }

  let wheelTimeout = null;
  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.deltaY > 0 || e.deltaX > 0) next();
    else prev();

    clearTimeout(wheelTimeout);
    wheelTimeout = setTimeout(() => { }, 150);
  }, { passive: false });

  let pointerDown = false;
  let startX = 0;
  let currentTranslate = 0;
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
    if (dx < -threshold) {
      next();
    } else if (dx > threshold) {
      prev();
    } else {
      goToIndex(index, true);
      isAnimating = false;
    }
    container.releasePointerCapture(e.pointerId);
  });

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
    else { goToIndex(index, true); isAnimating = false; }
  });

  window.addEventListener('resize', () => {
    setTimeout(() => goToIndex(index, false), 50);
  });

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
