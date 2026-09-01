import { Page } from 'puppeteer';
import { DOMInteractionEvent, DOMTreeNode } from '@deep-age/shared';

export class DOMInspector {
  public static async inspect(page: Page): Promise<{ controls: DOMInteractionEvent[]; tree: DOMTreeNode }> {
    try {
      const result = await page.evaluate(`(() => {
        var controls = [];
        var interactiveEls = document.querySelectorAll('button, a, input, select, form, textarea, [role="button"], [onclick]');
        
        for (var idx = 0; idx < interactiveEls.length; idx++) {
          if (idx > 40) break;
          var el = interactiveEls[idx];
          var tag = el.tagName.toUpperCase();
          var text = (el.textContent || el.value || '').trim();
          var attrs = {};
          for (var i = 0; i < el.attributes.length; i++) {
            var attr = el.attributes[i];
            attrs[attr.name] = attr.value;
          }

          var selector = tag.toLowerCase();
          if (el.id) {
            selector += '#' + el.id;
          } else if (el.className && typeof el.className === 'string') {
            selector += '.' + el.className.split(' ').filter(Boolean).slice(0, 2).join('.');
          }

          controls.push({
            id: 'dom-' + Date.now() + '-' + idx,
            type: 'visible_controls',
            selector: selector,
            elementTag: tag,
            text: text.slice(0, 80),
            attributes: attrs,
            timestamp: Date.now(),
          });
        }

        var nodeCounter = 0;
        var serializeNode = function(element, depth) {
          if (depth > 6 || nodeCounter > 150) return null;
          var tag = element.tagName.toUpperCase();
          if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'SVG', 'PATH'].indexOf(tag) !== -1) {
            return null;
          }

          nodeCounter++;
          var idAttr = element.id || undefined;
          var className = typeof element.className === 'string' ? element.className.trim() : undefined;
          var role = element.getAttribute('role') || undefined;
          var ariaLabel = element.getAttribute('aria-label') || element.getAttribute('title') || element.getAttribute('alt') || undefined;
          
          var selector = tag.toLowerCase();
          if (idAttr) selector += '#' + idAttr;
          else if (className) selector += '.' + className.split(' ').filter(Boolean).slice(0, 2).join('.');

          var isInteractive = ['BUTTON', 'A', 'INPUT', 'SELECT', 'FORM', 'TEXTAREA'].indexOf(tag) !== -1 ||
            element.hasAttribute('onclick') ||
            role === 'button' ||
            role === 'link';

          var directText = '';
          for (var j = 0; j < element.childNodes.length; j++) {
            var child = element.childNodes[j];
            if (child.nodeType === 3) {
              directText += (child.textContent || '').trim() + ' ';
            }
          }
          directText = directText.trim();
          if (!directText && (tag === 'INPUT' || tag === 'BUTTON')) {
            directText = element.value || '';
          }

          var children = [];
          for (var k = 0; k < element.children.length; k++) {
            var childNode = serializeNode(element.children[k], depth + 1);
            if (childNode) children.push(childNode);
          }

          var attrs = {};
          if (element.hasAttribute('href')) attrs['href'] = element.getAttribute('href');
          if (element.hasAttribute('type')) attrs['type'] = element.getAttribute('type');
          if (element.hasAttribute('name')) attrs['name'] = element.getAttribute('name');
          if (element.hasAttribute('placeholder')) attrs['placeholder'] = element.getAttribute('placeholder');

          return {
            id: 'node-' + nodeCounter,
            tag: tag,
            role: role,
            idAttr: idAttr,
            className: className ? className.split(' ').slice(0, 3).join(' ') : undefined,
            selector: selector,
            text: directText ? directText.slice(0, 70) : undefined,
            ariaLabel: ariaLabel,
            isInteractive: isInteractive,
            attributes: Object.keys(attrs).length > 0 ? attrs : undefined,
            children: children,
          };
        };

        var rootTree = serializeNode(document.body || document.documentElement, 0) || {
          id: 'node-root',
          tag: 'BODY',
          selector: 'body',
          isInteractive: false,
          children: [],
        };

        return {
          controls: controls,
          tree: rootTree,
        };
      })()`) as any;

      return {
        controls: result.controls as DOMInteractionEvent[],
        tree: result.tree as DOMTreeNode,
      };
    } catch (err) {
      console.warn('[DOMInspector] Failed to extract DOM tree:', err);
      return {
        controls: [],
        tree: {
          id: 'node-fallback',
          tag: 'BODY',
          selector: 'body',
          isInteractive: false,
          children: [],
        },
      };
    }
  }
}
