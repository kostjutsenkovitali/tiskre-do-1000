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
        vendor
        tags
        collections(first: 10) { nodes { handle title } }
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
          sku
          availableForSale
          price { amount currencyCode }
        }
      }
      bulletPoints: metafield(namespace: "custom", key: "bullet_points") { 
        type 
        value
        reference {
          __typename
          ... on MediaImage { image { url altText } }
          ... on GenericFile { url }
          ... on Video { sources { url mimeType } }
        }
        references(first: 10) {
          nodes {
            __typename
            ... on MediaImage { image { url altText } }
            ... on GenericFile { url }
            ... on Video { sources { url mimeType } }
          }
        }
      }
      instructionJpg: metafield(namespace: "custom", key: "instruction_jpg") {
        value
        reference {
          __typename
          ... on MediaImage { image { url altText } }
          ... on GenericFile { url }
          ... on Video { sources { url mimeType } }
        }
        references(first: 10) {
          nodes {
            __typename
            ... on MediaImage { image { url altText } }
            ... on GenericFile { url }
            ... on Video { sources { url mimeType } }
          }
        }
      }
      instructionJpgEn: metafield(namespace: "custom", key: "instruction_jpg_en") {
        type
        value
        reference {
          __typename
          ... on MediaImage {
            image {
              url
            }
          }
          ... on GenericFile {
            url
          }
        }
      }
      instructionJpgEe: metafield(namespace: "custom", key: "instruction_jpg_ee") {
        type
        value
        reference {
          __typename
          ... on MediaImage {
            image {
              url
            }
          }
          ... on GenericFile {
            url
          }
        }
      }
      instructionJpgFi: metafield(namespace: "custom", key: "instruction_jpg_fi") {
        type
        value
        reference {
          __typename
          ... on MediaImage {
            image {
              url
            }
          }
          ... on GenericFile {
            url
          }
        }
      }
      instructionPdfEn: metafield(namespace: "custom", key: "instruction_pdf_en") {
        type
        value
        reference {
          __typename
          ... on GenericFile {
            url
          }
        }
      }
      instructionPdf: metafield(namespace: "custom", key: "instruction_pdf") {
        value
        reference { __typename ... on GenericFile { url } }
        references(first: 5) { nodes { __typename ... on GenericFile { url } } }
      }
      technicalParameters: metafield(namespace: "custom", key: "technical_parameters") {
        value
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

export const GET_COLLECTION_PRODUCTS = gql`
  query GetCollectionProducts($handle: String!, $first: Int = 8, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      products(first: $first) {
        nodes {
          id
          handle
          title
          featuredImage { url altText }
          priceRange { minVariantPrice { amount currencyCode } }
        }
      }
    }
  }
`;


