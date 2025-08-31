import { sf } from "./shopify";
import { gql } from "graphql-request";

// Customer mutations/queries for Classic customer accounts

export const CUSTOMER_CREATE = gql`
  mutation CustomerCreate($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer { id email firstName lastName }
      userErrors { field message }
    }
  }
`;

export const CUSTOMER_ACCESS_TOKEN_CREATE = gql`
  mutation CustomerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
    customerAccessTokenCreate(input: $input) {
      customerAccessToken { accessToken expiresAt }
      userErrors { field message }
    }
  }
`;

export const CUSTOMER_ACCESS_TOKEN_DELETE = gql`
  mutation CustomerAccessTokenDelete($accessToken: String!) {
    customerAccessTokenDelete(customerAccessToken: $accessToken) {
      deletedAccessToken
      userErrors { field message }
    }
  }
`;

export const CUSTOMER_QUERY = gql`
  query GetCustomer($accessToken: String!) {
    customer(customerAccessToken: $accessToken) {
      id
      firstName
      lastName
      email
      orders(first: 10, sortKey: PROCESSED_AT, reverse: true) {
        nodes {
          id
          name
          processedAt
          financialStatus
          totalPrice { amount currencyCode }
          lineItems(first: 10) { nodes { title quantity } }
        }
      }
    }
  }
`;

export const CUSTOMER_UPDATE = gql`
  mutation CustomerUpdate($accessToken: String!, $customer: CustomerUpdateInput!) {
    customerUpdate(customerAccessToken: $accessToken, customer: $customer) {
      customer { id firstName lastName email }
      userErrors { field message }
    }
  }
`;

export async function customerCreate(input: { email: string; password: string; firstName?: string; lastName?: string }) {
  const res = await sf<{ customerCreate: { customer: any; userErrors?: Array<{ message: string }> } }>(CUSTOMER_CREATE, { input });
  if (!res.customerCreate.customer) throw new Error(res.customerCreate.userErrors?.map(e => e.message).join(", ") || "Customer create failed");
  return res.customerCreate.customer;
}

export async function customerAccessTokenCreate(input: { email: string; password: string }) {
  const res = await sf<{ customerAccessTokenCreate: { customerAccessToken: { accessToken: string; expiresAt: string } | null; userErrors?: Array<{ message: string }> } }>(CUSTOMER_ACCESS_TOKEN_CREATE, { input });
  const tok = res.customerAccessTokenCreate.customerAccessToken;
  if (!tok?.accessToken) throw new Error(res.customerAccessTokenCreate.userErrors?.map(e => e.message).join(", ") || "Login failed");
  return tok;
}

export async function customerAccessTokenDelete(accessToken: string) {
  await sf(CUSTOMER_ACCESS_TOKEN_DELETE, { accessToken });
}

export async function getCustomer(accessToken: string) {
  const res = await sf<{ customer: any }>(CUSTOMER_QUERY, { accessToken });
  return res.customer || null;
}

export async function customerUpdateProfile(accessToken: string, customer: { firstName?: string; lastName?: string; email?: string }) {
  const res = await sf<{ customerUpdate: { customer: any; userErrors?: Array<{ message: string }> } }>(CUSTOMER_UPDATE, { accessToken, customer });
  if (!res.customerUpdate.customer) throw new Error(res.customerUpdate.userErrors?.map(e => e.message).join(", ") || "Update failed");
  return res.customerUpdate.customer;
}


