import { Page } from 'puppeteer';
import { DOMInteractionEvent } from '@deep-age/shared';

export class DOMInspector {
  public static async inspect(page: Page): Promise<DOMInteractionEvent[]> {
    return (await page.evaluate(`(() => {
      const controls = [];
      const elements = document.querySelectorAll('button, a, input, select, form');

      for (let index = 0; index < elements.length; index++) {
        if (index > 30) break;
        const el = elements[index];
        const tag = el.tagName.toUpperCase();
        const text = (el.innerText || el.value || '').trim();
        const attrs = {};
        for (let i = 0; i < el.attributes.length; i++) {
          const attr = el.attributes[i];
          attrs[attr.name] = attr.value;
        }

        let selector = tag.toLowerCase();
        if (el.id) {
          selector += '#' + el.id;
        } else if (el.className && typeof el.className === 'string') {
          selector += '.' + el.className.split(' ').filter(Boolean).slice(0, 2).join('.');
        }

        controls.push({
          id: 'dom-' + Date.now() + '-' + index,
          type: 'visible_controls',
          selector: selector,
          elementTag: tag,
          text: text.slice(0, 80),
          attributes: attrs,
          timestamp: Date.now(),
        });
      }

      return controls;
    })()`)) as DOMInteractionEvent[];
  }
}
