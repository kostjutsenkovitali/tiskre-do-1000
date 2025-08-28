import type {CountryCode as CountryCodeEnum, LanguageCode as LanguageCodeEnum} from "../shopify";

export type CountryCode = CountryCodeEnum;
export type LanguageCode = LanguageCodeEnum;

export type Money = {
  amount: string;
  currencyCode: string;
};

export type Image = {
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

export type ProductListItem = {
  handle: string;
  title: string;
  featuredImage: Image | null;
  priceRange: {
    minVariantPrice: Money;
    maxVariantPrice: Money;
  };
};

export type ProductVariant = {
  id: string;
  title: string;
  price: Money;
};

export type ProductMediaImage = {
  __typename: "MediaImage";
  image: Image | null;
};

export type ProductVideoSource = {
  url: string;
  mimeType: string;
};

export type ProductVideo = {
  __typename: "Video";
  id: string;
  sources: ProductVideoSource[];
};

export type ProductDetail = {
  handle: string;
  id: string;
  title: string;
  descriptionHtml: string;
  media: {
    nodes: (ProductMediaImage | ProductVideo)[];
  };
  variants: {
    nodes: ProductVariant[];
  };
  collections?: {
    nodes: { id: string; handle: string; title: string }[];
  };
};

export type CollectionListItem = {
  id: string;
  handle: string;
  title: string;
};

export type GetProductsVariables = {
  first: number;
  after?: string;
  query?: string;
  country?: CountryCode;
  language?: LanguageCode;
};

export type GetProductsResponse = {
  products: {
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
    nodes: ProductListItem[];
  };
};

export type GetProductVariables = {
  handle: string;
  country?: CountryCode;
  language?: LanguageCode;
};

export type GetProductResponse = {
  product: ProductDetail | null;
};

export type GetCollectionsVariables = {
  first?: number;
  after?: string;
};

export type GetCollectionsResponse = {
  collections: {
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
    nodes: CollectionListItem[];
  };
};


