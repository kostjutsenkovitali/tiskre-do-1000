export const QUERY_MENUS = /* GraphQL */ `
  query Menus($location: MenuLocationEnum) {
    menuItems(where: { location: $location }) {
      nodes {
        id
        label
        path
      }
    }
  }
`;

export const QUERY_PAGES_BY_SLUG = /* GraphQL */ `
  query PageBySlug($slug: ID!) {
    page(id: $slug, idType: URI) {
      id
      title
      content
      uri
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
    }
  }
`;

export const QUERY_POSTS = /* GraphQL */ `
  query Posts($first: Int = 10) {
    posts(first: $first, where: { status: PUBLISH }) {
      nodes {
        id
        slug
        title
        excerpt
        date
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
      }
    }
  }
`;

export const QUERY_CATEGORIES = /* GraphQL */ `
  query ProductCategories($first: Int = 50) {
    productCategories(first: $first) {
      nodes {
        id
        slug
        name
        description
      }
    }
  }
`;

export const QUERY_PRODUCTS = /* GraphQL */ `
  query Products($first: Int = 20, $category: [String]) {
    products(first: $first, where: { categoryIn: $category }) {
      nodes {
        id
        slug
        name
        description
        sku
        image {
          sourceUrl
          altText
        }
        galleryImages {
          nodes {
            sourceUrl
            altText
          }
        }
        ... on InventoriedProduct {
          stockStatus
        }
        ... on SimpleProduct {
          price
          regularPrice
          salePrice
        }
      }
    }
  }
`;



