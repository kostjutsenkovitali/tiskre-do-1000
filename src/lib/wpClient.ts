import { GraphQLClient } from "graphql-request";

const fallbackEndpoint = "https://tiskre-do.eu/graphql";
const endpoint = process.env.NEXT_PUBLIC_WP_GRAPHQL_ENDPOINT || fallbackEndpoint;

export const wpClient = new GraphQLClient(endpoint);

export async function wpRequest<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  return wpClient.request<T>(query, variables);
}


