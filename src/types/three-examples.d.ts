declare module "three/examples/jsm/loaders/GLTFLoader" {
  export class GLTFLoader {
    constructor();
    setDRACOLoader(loader: any): void;
    load(
      url: string,
      onLoad: (gltf: any) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: any) => void
    ): void;
  }
}

declare module "three/examples/jsm/loaders/DRACOLoader" {
  export class DRACOLoader {
    constructor();
    setDecoderPath(path: string): void;
  }
}


