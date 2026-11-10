(() => {
  const media = (query) => window.matchMedia ? window.matchMedia(query) : { matches: false, addEventListener() {} };
  const reducedMedia = media('(prefers-reduced-motion: reduce)');
  const mobileMedia = media('(max-width: 620px)');
  const onMediaChange = (query, callback) => {
    if (query.addEventListener) query.addEventListener('change', callback);
    else if (query.addListener) query.addListener(callback);
  };
  let reduced = reducedMedia.matches;
  const sky = document.querySelector('.sky');

  // Decorative stars are generated once; text animation does not depend on them.
  if (sky && !sky.querySelector('.star')) {
    const starCount = mobileMedia.matches ? 18 : 30;
    const tones = ['', '', 'gold', 'violet'];
    const stars = document.createDocumentFragment();
    for (let index = 0; index < starCount; index += 1) {
      const star = document.createElement('span');
      const size = Math.random() < .84 ? 1.5 : 2.5;
      star.className = `star ${tones[index % tones.length]}`;
      star.style.cssText = `left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 100).toFixed(1)}%;width:${size}px;height:${size}px;--twinkle:${(4 + Math.random() * 4).toFixed(1)}s;--star-delay:-${(Math.random() * 6).toFixed(1)}s`;
      stars.appendChild(star);
    }
    sky.appendChild(stars);
  }

  const paths = [[1,1,35],[-1,1,-35],[1,-1,145],[-1,-1,-35],[1,1,-35],[-1,1,35],[1,-1,-35],[-1,-1,145],[1,1,35],[-1,1,-35]];
  const configureMeteors = (mobile) => {
    if (!sky) return;
    if (reduced) { sky.querySelectorAll('i').forEach((meteor) => { meteor.style.animation = 'none'; }); return; }
    const activeCount = mobile ? 6 : 10;
    sky.querySelectorAll('i').forEach((meteor, index) => {
      if (index >= activeCount) { meteor.style.display = 'none'; return; }
      meteor.style.display = 'block';
      const [dx, dy, angle] = paths[index % paths.length];
      const duration = 13 + Math.random() * 4;
      const reach = mobile ? 92 + Math.random() * 28 : 185 + Math.random() * 70;
      const delay = index * (duration * .78 / activeCount);
      meteor.style.cssText = `display:block;top:${(7 + Math.random() * 86).toFixed(1)}%;left:${(8 + Math.random() * 84).toFixed(1)}%;--meteor-angle:${angle}deg;--meteor-x:${Math.round(dx * reach)}px;--meteor-y:${Math.round(dy * reach * .68)}px;--meteor-duration:${duration.toFixed(1)}s;--meteor-delay:${delay.toFixed(2)}s;--meteor-length:${Math.round((mobile ? 58 : 84) + Math.random() * (mobile ? 30 : 60))}px`;
    });
  };
  configureMeteors(mobileMedia.matches);
  onMediaChange(mobileMedia, (event) => configureMeteors(event.matches));
  onMediaChange(reducedMedia, (event) => { reduced = event.matches; configureMeteors(mobileMedia.matches); });
  // GHEP TU BAN "title-motion-only" (2026-11-10): tach tung chu cai tieu de chinh
  // de hien lan luot, giu nguyen bo cuc chu. Chay ngay khi tai trang; chay lai khi
  // doan noi du lieu doi ten qua trang quan tri (su kien 'noidung:capnhat-tieu-de').
  const splitHeroTitle = () => {
    const heroTitle = document.querySelector('.hero h1');
    if (!heroTitle || heroTitle.querySelector('.title-char')) return;
    const accessibleTitle = heroTitle.textContent.replace(/\s+/g, ' ').trim();
    heroTitle.setAttribute('aria-label', accessibleTitle);
    let charIndex = 0;
    const splitTextNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const fragment = document.createDocumentFragment();
        for (const character of node.nodeValue) {
          if (/\s/.test(character)) { fragment.appendChild(document.createTextNode(character)); continue; }
          const span = document.createElement('span');
          span.className = 'title-char';
          span.setAttribute('aria-hidden', 'true');
          span.style.setProperty('--char-index', charIndex++);
          span.textContent = character;
          fragment.appendChild(span);
        }
        node.replaceWith(fragment);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        Array.from(node.childNodes).forEach(splitTextNode);
      }
    };
    Array.from(heroTitle.childNodes).forEach(splitTextNode);
  };
  splitHeroTitle();
  document.addEventListener('noidung:capnhat-tieu-de', splitHeroTitle);

  const headingGroups = [
    ['.hero h1', 'heading-hero'],
    ['#story .section-heading h2', 'heading-story'],
    ['#values .values-top h2', 'heading-values'],
    ['.value-card h3', 'heading-value-card'],
    ['#gallery .gallery-head h2', 'heading-gallery'],
    ['.video-card h2', 'heading-video'],
    ['#contact .connect-copy h2', 'heading-contact']
  ];
  const revealGroups = [
    ['.hero-copy', 'reveal-intro'], ['.hero-visual', 'reveal-image'],
    ['.section-heading,.values-top,.gallery-head', 'reveal-heading'],
    ['.story-copy,.connect-copy', 'reveal-copy'], ['.value-card', 'reveal-card'],
    ['.story-image,.gallery-item', 'reveal-gallery'], ['.video-card', 'reveal-video'],
    ['.contact-method,.channel-card', 'reveal-contact'], ['.footer', 'reveal-footer']
  ];
  const allHeadings = headingGroups.flatMap(([selector, effect]) =>
    Array.from(document.querySelectorAll(selector), (element) => ({ element, effect }))
  );

  // Text effects are a specific part of the requested design, so they are initialized
  // independently from the optional meteor and section-transition effects.
  if (!('IntersectionObserver' in window)) {
    allHeadings.forEach(({ element, effect }) => element.classList.add(effect, 'heading-in-view'));
    document.querySelectorAll('.hero-copy,.hero-visual,.section-heading,.values-top,.gallery-head,.story-copy,.connect-copy,.value-card,.story-image,.gallery-item,.video-card,.contact-method,.channel-card,.footer').forEach((element) => element.classList.add('visible'));
    return;
  }

  const watched = [];
  try {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('heading-in-view', 'visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });

    allHeadings.forEach(({ element, effect }) => {
      element.classList.add(effect);
      watched.push(element);
      observer.observe(element);
    });

    if (!reduced) {
      revealGroups.forEach(([selector, effect]) => document.querySelectorAll(selector).forEach((element) => {
        element.classList.add('reveal', effect);
        watched.push(element);
        observer.observe(element);
      }));
      document.body.classList.add('motion-ready');
    }
    document.body.classList.add('heading-effects-ready');
  } catch (error) {
    document.body.classList.remove('motion-ready', 'heading-effects-ready');
    watched.forEach((element) => element.classList.remove('reveal', 'visible', 'heading-in-view'));
    allHeadings.forEach(({ element, effect }) => element.classList.add(effect, 'heading-in-view'));
    console.warn('Heading animation fallback used; all text remains visible.', error);
  }
})();
