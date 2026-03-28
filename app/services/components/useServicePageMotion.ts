'use client';

import { useEffect } from 'react';

export default function useServicePageMotion(): void {
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-service-reveal]'));
    if (!sections.length) return;

    const reveal = (root: HTMLElement) => {
      root.classList.add('service-reveal-visible');

      const children = Array.from(root.querySelectorAll<HTMLElement>('.service-reveal'));
      children.forEach((node, index) => {
        node.style.transitionDelay = `${Math.min(index * 65, 340)}ms`;
        node.classList.add('service-reveal-visible');
      });
    };

    if (!('IntersectionObserver' in window)) {
      sections.forEach(reveal);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal(entry.target as HTMLElement);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -8% 0px' },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    const magnets = Array.from(document.querySelectorAll<HTMLElement>('[data-service-magnetic]'));
    if (!magnets.length) return;

    const cleanupFns = magnets.map((element) => {
      const onMove = (event: MouseEvent) => {
        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        const moveX = (x / rect.width) * 10;
        const moveY = (y / rect.height) * 8;
        element.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
      };

      const onLeave = () => {
        element.style.transform = 'translate3d(0, 0, 0)';
      };

      element.addEventListener('mousemove', onMove);
      element.addEventListener('mouseleave', onLeave);

      return () => {
        element.removeEventListener('mousemove', onMove);
        element.removeEventListener('mouseleave', onLeave);
      };
    });

    return () => cleanupFns.forEach((cleanup) => cleanup());
  }, []);

  useEffect(() => {
    if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    const heroes = Array.from(document.querySelectorAll<HTMLElement>('[data-service-hero]'));
    if (!heroes.length) return;

    const listeners = heroes.map((hero) => {
      const onMove = (event: MouseEvent) => {
        const rect = hero.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 28;
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * 22;
        hero.style.setProperty('--service-mx', `${x.toFixed(2)}px`);
        hero.style.setProperty('--service-my', `${y.toFixed(2)}px`);
      };

      const onLeave = () => {
        hero.style.setProperty('--service-mx', '0px');
        hero.style.setProperty('--service-my', '0px');
      };

      hero.addEventListener('mousemove', onMove);
      hero.addEventListener('mouseleave', onLeave);

      return () => {
        hero.removeEventListener('mousemove', onMove);
        hero.removeEventListener('mouseleave', onLeave);
      };
    });

    return () => listeners.forEach((cleanup) => cleanup());
  }, []);
}
