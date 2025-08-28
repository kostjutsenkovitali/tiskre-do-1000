import {gql} from "graphql-request";

// GraphQL strings to use with our sf() helper.

export const GET_PRODUCTS = gql`
  query GetProducts(
    $first: Int!
    $after: String
    $query: String
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    products(first: $first, after: $after, query: $query) {
      pageInfo {
        hasNextPage
        startCursor
        endCursor
      }
      nodes {
        handle
        title
        featuredImage {
          url
          altText
          width
          height
        }
        priceRange {
          minVariantPrice { amount currencyCode }
          maxVariantPrice { amount currencyCode }
        }
      }
    }
  }
`;

export const GET_PRODUCT = gql`
  query GetProduct($handle: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      handle
      id
      title
      descriptionHtml
      media(first: 20) {
        nodes {
          __typename
          ... on MediaImage { image { url altText width height } }
          ... on Video { id sources { url mimeType } }
        }
      }
      variants(first: 100) {
        nodes {
          id
          title
          price { amount currencyCode }
        }
      }
      collections(first: 4) {
        nodes { id handle title }
      }
    }
  }
`;

export const GET_COLLECTIONS = gql`
  query GetCollections($first: Int = 50, $after: String) {
    collections(first: $first, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes { id handle title }
    }
  }
`;


