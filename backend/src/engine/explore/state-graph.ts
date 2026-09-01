import { StateTransitionGraph, SiteStateNode, WebMCPTool } from '@deep-age/shared';
import { ExtractedSiteData } from './site-crawler.js';

export function buildSiteStateGraph(
  siteUrl: string,
  discoveredTools: WebMCPTool[],
  siteData?: ExtractedSiteData
): StateTransitionGraph {
  const toolNames = discoveredTools.map((t) => t.name);

  const hasSearch = toolNames.some((n) => n.includes('search') || n.includes('filter'));
  const hasDetails = toolNames.some((n) => n.includes('detail') || n.includes('get_') || n.includes('view_item') || n.includes('read_'));
  const hasCart = toolNames.some((n) => n.includes('cart') || n.includes('add_') || n.includes('buy'));
  const hasCheckout = toolNames.some((n) => n.includes('checkout') || n.includes('payment') || n.includes('order'));

  const archetype = siteData?.archetype || (hasCart ? 'ecommerce' : 'general_web');
  const states: Record<string, SiteStateNode> = {};

  if (archetype === 'ecommerce') {
    // E-Commerce Archetype State Graph
    states['ANONYMOUS_BROWSING'] = {
      id: 'ANONYMOUS_BROWSING',
      label: 'Public Browsing & Discovery',
      description: 'Explore public catalog, categories, search queries, and product listings.',
      routePath: '/',
      availableTools: toolNames.filter((n) => !n.includes('checkout') && !n.includes('payment')),
      blockedTools: hasCheckout ? [{ name: 'complete_checkout', reason: 'Requires active cart items' }] : [],
      transitions: {
        inspectItem: {
          targetState: 'PRODUCT_DETAILS',
          actionTool: hasDetails ? toolNames.find(n => n.includes('detail') || n.includes('get_')) : undefined,
          description: 'View specific product attributes, specifications, and customer reviews.'
        },
        addToCart: {
          targetState: 'CART_ACTIVE',
          actionTool: hasCart ? toolNames.find(n => n.includes('cart') || n.includes('add_')) : undefined,
          description: 'Add matching item to shopping cart.'
        }
      }
    };

    states['PRODUCT_DETAILS'] = {
      id: 'PRODUCT_DETAILS',
      label: 'Product Details View',
      description: 'Review technical specifications, stock levels, and user reviews.',
      routePath: '/product/:id',
      availableTools: toolNames.filter((n) => !n.includes('payment')),
      transitions: {
        addToCart: {
          targetState: 'CART_ACTIVE',
          actionTool: hasCart ? toolNames.find(n => n.includes('cart') || n.includes('add_')) : undefined,
          description: 'Add configured item to cart.'
        },
        backToBrowse: {
          targetState: 'ANONYMOUS_BROWSING',
          actionTool: hasSearch ? toolNames.find(n => n.includes('search') || n.includes('filter')) : undefined,
          description: 'Return to catalog search.'
        }
      }
    };

    states['CART_ACTIVE'] = {
      id: 'CART_ACTIVE',
      label: 'Active Cart State',
      description: 'Items in cart. Tax calculations, discounts, and item quantities can be modified.',
      routePath: '/cart',
      availableTools: toolNames,
      transitions: {
        proceedToCheckout: {
          targetState: 'CHECKOUT_FLOW',
          actionTool: hasCheckout ? toolNames.find(n => n.includes('checkout') || n.includes('payment')) : undefined,
          description: 'Begin address verification and checkout.',
          guard: 'cart.itemCount > 0'
        },
        continueShopping: {
          targetState: 'ANONYMOUS_BROWSING',
          description: 'Return to catalog.'
        }
      }
    };

    states['CHECKOUT_FLOW'] = {
      id: 'CHECKOUT_FLOW',
      label: 'Checkout & Payment Gate',
      description: 'Order review, delivery address entry, and payment authorization.',
      routePath: '/checkout',
      availableTools: toolNames.filter((n) => n.includes('checkout') || n.includes('payment') || n.includes('cart') || n.includes('promo')),
      transitions: {
        authorizePayment: {
          targetState: 'ORDER_COMPLETED',
          actionTool: hasCheckout ? toolNames.find(n => n.includes('checkout') || n.includes('payment')) : undefined,
          description: 'Execute transaction (Requires biometric passkey on high-value items).',
          guard: 'payment.authorized == true',
          requiresAuth: true
        }
      }
    };

    states['ORDER_COMPLETED'] = {
      id: 'ORDER_COMPLETED',
      label: 'Order Confirmed',
      description: 'Purchase complete. Tracking numbers and receipt access enabled.',
      routePath: '/orders/:id',
      availableTools: toolNames.filter((n) => n.includes('track') || n.includes('order') || n.includes('return')),
      transitions: {
        newSearch: {
          targetState: 'ANONYMOUS_BROWSING',
          description: 'Start new exploration.'
        }
      }
    };
  } else if (archetype === 'docs') {
    // Documentation / Developer API Archetype
    states['DOCS_HOME'] = {
      id: 'DOCS_HOME',
      label: 'Documentation Hub',
      description: 'Entry point for developer guides, tutorials, and quickstart documentation.',
      routePath: '/',
      availableTools: toolNames,
      transitions: {
        searchDocs: { targetState: 'SEARCH_RESULTS', description: 'Search articles and code snippets.' },
        viewApiRef: { targetState: 'API_REFERENCE', description: 'View endpoint specifications and schemas.' }
      }
    };
    states['SEARCH_RESULTS'] = {
      id: 'SEARCH_RESULTS',
      label: 'Doc Search & Topics',
      description: 'Filtered documentation topics, guides, and SDK references.',
      routePath: '/search',
      availableTools: toolNames,
      transitions: {
        openTopic: { targetState: 'TOPIC_READER', description: 'Read full guide.' },
        backToHub: { targetState: 'DOCS_HOME', description: 'Return to docs hub.' }
      }
    };
    states['TOPIC_READER'] = {
      id: 'TOPIC_READER',
      label: 'Article / Guide View',
      description: 'Detailed code examples, installation commands, and architecture diagrams.',
      routePath: '/docs/:slug',
      availableTools: toolNames,
      transitions: {
        viewApiRef: { targetState: 'API_REFERENCE', description: 'Jump to related API reference.' },
        searchMore: { targetState: 'SEARCH_RESULTS', description: 'Search related guides.' }
      }
    };
    states['API_REFERENCE'] = {
      id: 'API_REFERENCE',
      label: 'API & Schema Reference',
      description: 'HTTP endpoints, parameter schemas, error codes, and SDK method signatures.',
      routePath: '/api',
      availableTools: toolNames,
      transitions: {
        returnHome: { targetState: 'DOCS_HOME', description: 'Return to hub.' }
      }
    };
  } else {
    // Dynamic General Web Archetype with live discovered routes
    const routes = (siteData?.routes && siteData.routes.length > 0)
      ? siteData.routes.slice(0, 6)
      : [
          { path: '/', label: 'Home Overview', description: 'Main landing page' },
          { path: '/explore', label: 'Explore & Search', description: 'Content discovery directory' },
          { path: '/details', label: 'Item & Details', description: 'Detailed resource view' },
          { path: '/account', label: 'User Account & Auth', description: 'Session management' },
        ];

    routes.forEach((r, idx) => {
      const stateId = `STATE_${r.path.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase() || 'HOME'}`;
      const nextRoute = routes[(idx + 1) % routes.length];
      const nextStateId = `STATE_${nextRoute.path.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase() || 'HOME'}`;

      states[stateId] = {
        id: stateId,
        label: r.label,
        description: r.description,
        routePath: r.path,
        availableTools: toolNames,
        transitions: {
          navigateNext: {
            targetState: nextStateId,
            description: `Navigate to ${nextRoute.label} (${nextRoute.path})`,
          },
          returnHome: {
            targetState: `STATE_HOME`,
            description: 'Return to homepage entry point',
          }
        }
      };
    });

    if (!states['STATE_HOME'] && Object.keys(states).length > 0) {
      const firstKey = Object.keys(states)[0];
      states['STATE_HOME'] = states[firstKey];
    }
  }

  const initialKey = Object.keys(states)[0] || 'ANONYMOUS_BROWSING';

  return {
    siteUrl,
    initialState: initialKey,
    states,
    version: '2.1.0'
  };
}
