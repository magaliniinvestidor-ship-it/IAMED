'use client';

import { useEffect } from 'react';

export default function HydrationFix() {
  useEffect(() => {
    function clean(el: Element | null) {
      if (el?.hasAttribute?.('bis_skin_checked')) {
        el.removeAttribute('bis_skin_checked');
      }
    }

    function cleanTree(root: Element | null) {
      if (!root) return;
      clean(root);
      root.querySelectorAll?.('[bis_skin_checked]').forEach(clean);
    }

    function handleNode(node: Node) {
      if (node.nodeType === 1) cleanTree(node as Element);
    }

    cleanTree(document.documentElement);

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes') clean(m.target as Element);
        for (const n of Array.from(m.addedNodes)) {
          if (n.nodeType === 1) handleNode(n);
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['bis_skin_checked'],
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
