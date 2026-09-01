import { Page } from 'puppeteer';
import { AgentStateDump, SemanticElement, InteractionElement, WebMCPTool } from '@deep-age/shared';

export class AgentStateDumper {
  public static async captureStateDump(
    page: Page,
    stateIndex: number,
    label: string,
    discoveredTools: WebMCPTool[] = [],
    previousDump?: AgentStateDump
  ): Promise<AgentStateDump> {
    try {
      const rawDump = await page.evaluate(`(() => {
        // 1. PAGE LAYER
        var url = window.location.href;
        var title = document.title || '';
        var viewport = {
          width: window.innerWidth || 1280,
          height: window.innerHeight || 800
        };

        // 2. UI STATE LAYER
        var scroll = {
          x: window.scrollX || window.pageXOffset || 0,
          y: window.scrollY || window.pageYOffset || 0
        };
        var activeEl = document.activeElement;
        var focusedRef = undefined;
        var dialogs = [];
        var dialogEls = document.querySelectorAll('dialog, [role="dialog"], .modal, [aria-modal="true"]');
        for (var d = 0; d < dialogEls.length; d++) {
          var dEl = dialogEls[d];
          var isOpen = dEl.hasAttribute('open') || !dEl.classList.contains('hidden') && dEl.getAttribute('aria-hidden') !== 'true';
          dialogs.push({
            id: dEl.id || ('dialog-' + d),
            title: dEl.getAttribute('aria-label') || dEl.querySelector('h1, h2, h3, h4')?.textContent?.trim() || 'Dialog',
            open: isOpen
          });
        }
        var loading = document.readyState !== 'complete' || document.querySelector('[aria-busy="true"]') !== null;

        // 3. REF COUNTER & INTERACTION MAPPING
        var refCounter = 0;
        var semanticTree = [];
        var interactionState = [];

        // Helper to get clean accessible name
        var getAccessibleName = function(el) {
          var aria = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('title') || el.getAttribute('alt');
          if (aria) return aria.trim();
          var text = el.textContent || '';
          return text.replace(/\\s+/g, ' ').trim().slice(0, 80);
        };

        // Helper to check element visibility
        var isVisible = function(el) {
          if (!el) return false;
          var style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
          var rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        };

        // Extract Headings & Landmarks (Semantic Tree)
        var semanticEls = document.querySelectorAll('h1, h2, h3, h4, header, nav, main, section, article, footer');
        for (var s = 0; s < semanticEls.length; s++) {
          if (s > 25) break;
          var sEl = semanticEls[s];
          var sTag = sEl.tagName.toUpperCase();
          var sRole = 'region';
          var level = undefined;
          if (sTag === 'H1') { sRole = 'heading'; level = 1; }
          else if (sTag === 'H2') { sRole = 'heading'; level = 2; }
          else if (sTag === 'H3') { sRole = 'heading'; level = 3; }
          else if (sTag === 'H4') { sRole = 'heading'; level = 4; }
          else if (sTag === 'HEADER') sRole = 'banner';
          else if (sTag === 'NAV') sRole = 'navigation';
          else if (sTag === 'MAIN') sRole = 'main';
          else if (sTag === 'ARTICLE') sRole = 'article';

          refCounter++;
          var sRef = 'e' + refCounter;
          var sName = getAccessibleName(sEl) || sTag.toLowerCase();

          semanticTree.push({
            ref: sRef,
            role: sRole,
            name: sName,
            level: level,
            visible: isVisible(sEl)
          });
        }

        // Extract Interactive Elements (Interaction State)
        var interactiveEls = document.querySelectorAll('button, input, select, textarea, a[href], [role="button"], [onclick]');
        for (var i = 0; i < interactiveEls.length; i++) {
          if (i > 40) break;
          var iEl = interactiveEls[i];
          var iTag = iEl.tagName.toUpperCase();
          var iRole = 'button';
          var actions = ['click'];
          var val = undefined;
          var placeholder = iEl.getAttribute('placeholder') || undefined;
          var enabled = !iEl.disabled && !iEl.hasAttribute('aria-disabled');

          if (iTag === 'INPUT') {
            var type = (iEl.getAttribute('type') || 'text').toLowerCase();
            if (type === 'checkbox') {
              iRole = 'checkbox';
              actions = ['click', 'check'];
              val = iEl.checked ? 'true' : 'false';
            } else if (type === 'radio') {
              iRole = 'radio';
              actions = ['click', 'check'];
              val = iEl.checked ? 'true' : 'false';
            } else {
              iRole = 'textbox';
              actions = ['fill', 'focus', 'click'];
              val = iEl.value || '';
            }
          } else if (iTag === 'TEXTAREA') {
            iRole = 'textbox';
            actions = ['fill', 'focus'];
            val = iEl.value || '';
          } else if (iTag === 'SELECT') {
            iRole = 'combobox';
            actions = ['select', 'click'];
            val = iEl.value || '';
          } else if (iTag === 'A') {
            iRole = 'link';
            actions = ['click'];
          }

          refCounter++;
          var iRef = 'e' + refCounter;
          if (activeEl === iEl) {
            focusedRef = iRef;
          }

          var iName = getAccessibleName(iEl) || placeholder || (iTag.toLowerCase() + '-' + i);

          var selector = iTag.toLowerCase();
          if (iEl.id) selector += '#' + iEl.id;
          else if (iEl.className && typeof iEl.className === 'string') {
            selector += '.' + iEl.className.split(' ').filter(Boolean).slice(0, 2).join('.');
          }

          interactionState.push({
            ref: iRef,
            role: iRole,
            name: iName,
            value: val,
            placeholder: placeholder,
            visible: isVisible(iEl),
            enabled: enabled,
            actions: actions,
            selector: selector
          });
        }

        // 4. ENVIRONMENT LAYER
        var localStorageKeys = [];
        try {
          for (var k = 0; k < localStorage.length; k++) {
            localStorageKeys.push(localStorage.key(k) || '');
          }
        } catch (e) {}

        return {
          page: {
            url: url,
            title: title,
            viewport: viewport
          },
          uiState: {
            scroll: scroll,
            focusedRef: focusedRef,
            dialogs: dialogs,
            loading: loading
          },
          semanticTree: semanticTree,
          interactionState: interactionState,
          environment: {
            cookieCount: (document.cookie ? document.cookie.split(';').length : 0),
            localStorageKeys: localStorageKeys,
            online: navigator.onLine !== false
          }
        };
      })()`) as any;

      const currentDump: AgentStateDump = {
        id: `state_${String(stateIndex).padStart(3, '0')}`,
        stateIndex,
        timestamp: Date.now(),
        label,
        page: rawDump.page,
        uiState: rawDump.uiState,
        semanticTree: rawDump.semanticTree as SemanticElement[],
        interactionState: rawDump.interactionState as InteractionElement[],
        environment: {
          ...rawDump.environment,
          discoveredTools: discoveredTools.map((t) => t.name),
        },
      };

      // Compute diff if previous state dump exists
      if (previousDump) {
        const prevRefs = new Set(previousDump.interactionState.map((e) => e.ref));
        const currRefs = new Set(currentDump.interactionState.map((e) => e.ref));

        const addedRefs = currentDump.interactionState.filter((e) => !prevRefs.has(e.ref)).map((e) => e.ref);
        const removedRefs = previousDump.interactionState.filter((e) => !currRefs.has(e.ref)).map((e) => e.ref);

        const mutatedValues: Record<string, { from?: string; to?: string }> = {};
        currentDump.interactionState.forEach((curr) => {
          const prev = previousDump.interactionState.find((p) => p.name === curr.name || p.selector === curr.selector);
          if (prev && prev.value !== curr.value) {
            mutatedValues[curr.ref] = { from: prev.value, to: curr.value };
          }
        });

        currentDump.diffFromPrevious = {
          addedRefs: addedRefs.length > 0 ? addedRefs : undefined,
          removedRefs: removedRefs.length > 0 ? removedRefs : undefined,
          mutatedValues: Object.keys(mutatedValues).length > 0 ? mutatedValues : undefined,
          scrollChange: {
            dx: currentDump.uiState.scroll.x - previousDump.uiState.scroll.x,
            dy: currentDump.uiState.scroll.y - previousDump.uiState.scroll.y,
          },
          focusChanged: previousDump.uiState.focusedRef !== currentDump.uiState.focusedRef
            ? { from: previousDump.uiState.focusedRef, to: currentDump.uiState.focusedRef }
            : undefined,
        };
      }

      return currentDump;
    } catch (err) {
      console.warn('[AgentStateDumper Error]:', err);
      return {
        id: `state_${String(stateIndex).padStart(3, '0')}`,
        stateIndex,
        timestamp: Date.now(),
        label,
        page: {
          url: page.url() || 'http://localhost',
          title: 'Error reading page state',
          viewport: { width: 1280, height: 800 },
        },
        uiState: {
          scroll: { x: 0, y: 0 },
          dialogs: [],
          loading: false,
        },
        semanticTree: [],
        interactionState: [],
        environment: {
          cookieCount: 0,
          localStorageKeys: [],
          online: true,
          discoveredTools: discoveredTools.map((t) => t.name),
        },
      };
    }
  }
}
