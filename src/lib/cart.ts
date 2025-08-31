import { sf } from "./shopify";
import { gql } from "graphql-request";

const CART_FRAGMENT = gql`
  fragment CartBasic on Cart {
    id
    totalQuantity
    checkoutUrl
    lines(first: 50) {
      nodes {
        id
        quantity
        merchandise {
          __typename
          ... on ProductVariant {
            id
            title
            image { url altText }
            product { title handle }
            price { amount currencyCode }
          }
        }
      }
    }
  }
`;

const CART_CREATE = gql`
  ${CART_FRAGMENT}
  mutation CartCreate($lines: [CartLineInput!]) {
    cartCreate(input: { lines: $lines }) {
      cart { ...CartBasic }
      userErrors { field message }
    }
  }
`;

const CART_LINES_ADD = gql`
  ${CART_FRAGMENT}
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { ...CartBasic }
      userErrors { field message }
    }
  }
`;

const CART_LINES_UPDATE = gql`
  ${CART_FRAGMENT}
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { ...CartBasic }
      userErrors { field message }
    }
  }
`;

const CART_LINES_REMOVE = gql`
  ${CART_FRAGMENT}
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { ...CartBasic }
      userErrors { field message }
    }
  }
`;

const CART_GET = gql`
  ${CART_FRAGMENT}
  query GetCart($id: ID!) {
    cart(id: $id) { ...CartBasic }
  }
`;

const CART_BUYER_IDENTITY_UPDATE = gql`
  ${CART_FRAGMENT}
  mutation CartBuyerIdentityUpdate($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
    cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
      cart { ...CartBasic }
      userErrors { field message }
    }
  }
`;

export type Cart = {
  id: string;
  totalQuantity: number;
  checkoutUrl: string;
  lines: { nodes: Array<{ id: string; quantity: number; merchandise: any }> };
};

export async function cartCreate(lines?: Array<{ merchandiseId: string; quantity: number }>): Promise<Cart> {
  const res = await sf<{ cartCreate: { cart: Cart; userErrors?: Array<{ message: string }> } }>(CART_CREATE, { lines });
  const cart = res.cartCreate.cart;
  if (!cart) throw new Error(res.cartCreate.userErrors?.map((e) => e.message).join(", ") || "Cart create failed");
  return cart;
}

export async function cartLinesAdd(cartId: string, lines: Array<{ merchandiseId: string; quantity: number }>): Promise<Cart> {
  const res = await sf<{ cartLinesAdd: { cart: Cart; userErrors?: Array<{ message: string }> } }>(CART_LINES_ADD, { cartId, lines });
  const cart = res.cartLinesAdd.cart;
  if (!cart) throw new Error(res.cartLinesAdd.userErrors?.map((e) => e.message).join(", ") || "Cart add failed");
  return cart;
}

export async function cartLinesUpdate(cartId: string, lines: Array<{ id: string; quantity: number }>): Promise<Cart> {
  const res = await sf<{ cartLinesUpdate: { cart: Cart; userErrors?: Array<{ message: string }> } }>(CART_LINES_UPDATE, { cartId, lines });
  const cart = res.cartLinesUpdate.cart;
  if (!cart) throw new Error(res.cartLinesUpdate.userErrors?.map((e) => e.message).join(", ") || "Cart update failed");
  return cart;
}

export async function cartLinesRemove(cartId: string, lineIds: string[]): Promise<Cart> {
  const res = await sf<{ cartLinesRemove: { cart: Cart; userErrors?: Array<{ message: string }> } }>(CART_LINES_REMOVE, { cartId, lineIds });
  const cart = res.cartLinesRemove.cart;
  if (!cart) throw new Error(res.cartLinesRemove.userErrors?.map((e) => e.message).join(", ") || "Cart remove failed");
  return cart;
}

export async function cartGet(cartId: string): Promise<Cart> {
  const res = await sf<{ cart: Cart }>(CART_GET, { id: cartId });
  if (!res || !res.cart) throw new Error("Cart not found");
  return res.cart;
}

export async function cartBuyerIdentityUpdate(cartId: string, buyerIdentity: { customerAccessToken?: string }) {
  const res = await sf<{ cartBuyerIdentityUpdate: { cart: Cart; userErrors?: Array<{ message: string }> } }>(CART_BUYER_IDENTITY_UPDATE, { cartId, buyerIdentity });
  const cart = res.cartBuyerIdentityUpdate.cart;
  if (!cart) throw new Error(res.cartBuyerIdentityUpdate.userErrors?.map(e => e.message).join(", ") || "Buyer identity update failed");
  return cart;
}


