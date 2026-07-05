(function attachDeckStack(globalScope) {
  function initDeckStack(root, options = {}) {
    if (!root) {
      return { destroy() {} };
    }

    const cards = Array.from(root.querySelectorAll('[data-deck-stack-card]'));

    if (cards.length < 2) {
      return { destroy() {} };
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const config = {
      mobileBreakpoint: Number(options.mobileBreakpoint || 820),
      desktop: {
        cardShift: Number(options.desktopCardShift || 44),
        cardScaleLoss: Number(options.desktopCardScaleLoss || 0.02),
        mediaShift: Number(options.desktopMediaShift || -22),
        mediaRotate: Number(options.desktopMediaRotate || -4.5),
        mediaScaleGain: Number(options.desktopMediaScaleGain || 0.03),
      },
      mobile: {
        cardShift: Number(options.mobileCardShift || 24),
        cardScaleLoss: Number(options.mobileCardScaleLoss || 0.014),
        mediaShift: Number(options.mobileMediaShift || -12),
        mediaRotate: Number(options.mobileMediaRotate || -2.2),
        mediaScaleGain: Number(options.mobileMediaScaleGain || 0.018),
      },
    };

    let ticking = false;

    const clearTransforms = () => {
      cards.forEach((card) => {
        card.style.transform = '';
        const media = card.querySelector('[data-deck-stack-media]');
        if (media) {
          media.style.transform = '';
        }
      });
    };

    const updateCards = () => {
      if (reduceMotion.matches) {
        clearTransforms();
        return;
      }

      const viewportHeight = window.innerHeight;
      const mode =
        window.innerWidth <= config.mobileBreakpoint
          ? config.mobile
          : config.desktop;

      clearTransforms();

      cards.forEach((card, index) => {
        if (index === 0) {
          return;
        }

        const previousCard = cards[index - 1];
        const previousMedia = previousCard.querySelector(
          '[data-deck-stack-media]',
        );
        const rect = card.getBoundingClientRect();
        const progress = clamp(
          (viewportHeight - rect.top) / viewportHeight,
          0,
          1,
        );

        previousCard.style.transform =
          `translate3d(0, ${progress * mode.cardShift}px, 0) ` +
          `scale(${1 - progress * mode.cardScaleLoss})`;

        if (previousMedia) {
          previousMedia.style.transform =
            `translate3d(0, ${progress * mode.mediaShift}px, 0) ` +
            `rotate(${progress * mode.mediaRotate}deg) ` +
            `scale(${1 + progress * mode.mediaScaleGain})`;
        }
      });
    };

    const requestUpdate = () => {
      if (ticking) {
        return;
      }

      ticking = true;

      window.requestAnimationFrame(() => {
        updateCards();
        ticking = false;
      });
    };

    updateCards();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    reduceMotion.addEventListener('change', requestUpdate);

    return {
      destroy() {
        window.removeEventListener('scroll', requestUpdate);
        window.removeEventListener('resize', requestUpdate);
        reduceMotion.removeEventListener('change', requestUpdate);
        clearTransforms();
      },
    };
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  globalScope.initDeckStack = initDeckStack;
})(window);
