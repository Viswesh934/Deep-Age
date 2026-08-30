import { StateTransitionGraph, SiteStateNode, WebMCPTool } from '@deep-age/shared';

export function buildSiteStateGraph(siteUrl: string, discoveredTools: WebMCPTool[]): StateTransitionGraph {
  const toolNames = discoveredTools.map((t) => t.name);

  const hasSearch = toolNames.some((n) => n.includes('search') || n.includes('filter'));
  const hasDetails = toolNames.some((n) => n.includes('detail') || n.includes('get_'));
  const hasCart = toolNames.some((n) => n.includes('cart') || n.includes('add_'));
  const hasCheckout = toolNames.some((n) => n.includes('checkout') || n.includes('payment') || n.includes('order'));

  const states: Record<string, SiteStateNode> = {
    ANONYMOUS_BROWSING: {
      id: 'ANONYMOUS_BROWSING',
      label: 'Public Browsing & Discovery',
      description: 'The user is exploring public pages, catalogs, articles, or products without an active transaction.',
      routePath: '/',
      availableTools: toolNames.filter((n) => !n.includes('checkout') && !n.includes('payment')),
      blockedTools: hasCheckout ? [{ name: 'completeCheckout', reason: 'Requires active cart and address selection' }] : [],
      transitions: {
        inspectItem: {
          targetState: 'PRODUCT_DETAILS',
          actionTool: hasDetails ? 'get_product_details' : undefined,
          description: 'View specific product attributes, specifications, and availability.'
        },
        addToCart: {
          targetState: 'CART_ACTIVE',
          actionTool: hasCart ? 'add_to_cart' : undefined,
          description: 'Add selected item to current shopping cart session.'
        }
      }
    },
    PRODUCT_DETAILS: {
      id: 'PRODUCT_DETAILS',
      label: 'Item Details View',
      description: 'Viewing specifications, customer reviews, and stock quantities.',
      routePath: '/product/:id',
      availableTools: toolNames.filter((n) => !n.includes('payment')),
      transitions: {
        addToCart: {
          targetState: 'CART_ACTIVE',
          actionTool: hasCart ? 'add_to_cart' : undefined,
          description: 'Add configured item to cart.'
        },
        backToSearch: {
          targetState: 'ANONYMOUS_BROWSING',
          actionTool: hasSearch ? 'search_products' : undefined,
          description: 'Return to catalog search.'
        }
      }
    },
    CART_ACTIVE: {
      id: 'CART_ACTIVE',
      label: 'Active Cart State',
      description: 'Items are present in the user cart. Pricing, taxes, and shipping can be evaluated.',
      routePath: '/cart',
      availableTools: toolNames,
      transitions: {
        proceedToCheckout: {
          targetState: 'CHECKOUT_FLOW',
          actionTool: hasCheckout ? 'initiateCheckout' : undefined,
          description: 'Begin address, payment method selection, and order finalization.',
          guard: 'cart.itemCount > 0'
        },
        continueShopping: {
          targetState: 'ANONYMOUS_BROWSING',
          description: 'Return to browsing.'
        }
      }
    },
    CHECKOUT_FLOW: {
      id: 'CHECKOUT_FLOW',
      label: 'Checkout & Payment Gate',
      description: 'Order review, address entry, discount code application, and payment authorization.',
      routePath: '/checkout',
      availableTools: toolNames.filter((n) => n.includes('checkout') || n.includes('payment') || n.includes('cart')),
      transitions: {
        authorizePayment: {
          targetState: 'ORDER_COMPLETED',
          actionTool: hasCheckout ? 'completeCheckout' : undefined,
          description: 'Execute payment transaction (Tier 3 Critical Action - Requires Biometric Passkey).',
          guard: 'payment.authorized == true',
          requiresAuth: true
        }
      }
    },
    ORDER_COMPLETED: {
      id: 'ORDER_COMPLETED',
      label: 'Order Confirmed',
      description: 'Purchase complete. Tracking, receipt download, and return flows available.',
      routePath: '/orders/:id',
      availableTools: toolNames.filter((n) => n.includes('track') || n.includes('invoice') || n.includes('return')),
      transitions: {
        returnHome: {
          targetState: 'ANONYMOUS_BROWSING',
          description: 'Start new session.'
        }
      }
    }
  };

  return {
    siteUrl,
    initialState: 'ANONYMOUS_BROWSING',
    states,
    version: '2.0.0'
  };
}
