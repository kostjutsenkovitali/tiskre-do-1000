import {gql} from "graphql-request";

export const LIST_ARTICLES = gql`
  query ListArticles($first: Int!, $query: String, $language: LanguageCode)
  @inContext(language: $language) {
    articles(first: $first, query: $query, sortKey: PUBLISHED_AT, reverse: true) {
      pageInfo { hasNextPage endCursor }
      nodes {
        handle
        title
        excerpt
        image { url altText width height }
        blog { handle }
        publishedAt
      }
    }
  }
`;

export const GET_BLOG_WITH_ARTICLES = gql`
  query GetBlogWithArticles($blogHandle: String!, $first: Int!, $language: LanguageCode)
  @inContext(language: $language) {
    blog(handle: $blogHandle) {
      title
      articles(first: $first, sortKey: PUBLISHED_AT, reverse: true) {
        pageInfo { hasNextPage endCursor }
        nodes {
          handle
          title
          excerpt
          contentHtml
          image { url altText width height }
          publishedAt
        }
      }
    }
  }
`;

export const GET_ARTICLE = gql`
  query GetArticle($blogHandle: String!, $articleHandle: String!, $language: LanguageCode)
  @inContext(language: $language) {
    blog(handle: $blogHandle) {
      articleByHandle(handle: $articleHandle) {
        id
        handle
        title
        contentHtml
        image { url altText width height }
        publishedAt
        authorV2 { name }
        seo { title description }
      }
    }
  }
`;


