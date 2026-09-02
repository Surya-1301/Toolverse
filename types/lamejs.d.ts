declare module "lamejs" {
  export class Mp3Encoder {
    constructor(channels: number, sampleRate: number, kbps: number);
    encodeBuffer(left: Int16Array, right?: Int16Array): Int8Array;
    flush(): Int8Array;
  }

  export class WavHeader {
    static readHeader(
      dataView: DataView,
      offset: number,
    ): {
      sampleRate: number;
      channels: number;
      bitsPerSample: number;
      dataOffset: number;
      dataSize: number;
    } | null;
  }
}
