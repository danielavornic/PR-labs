class TaggedBinarySerializer {
  private static readonly TYPE_TAGS = {
    NULL: 0,
    UNDEFINED: 1,
    BOOLEAN: 2,
    INT32: 3,
    FLOAT64: 4,
    STRING: 5,
    ARRAY: 6,
    OBJECT: 7,
    DATE: 8,
    URL: 9,
  };

  serialize(data: unknown): Uint8Array {
    const chunks: Uint8Array[] = [];
    this.serializeValue(data, chunks);
    return this.concatenateUint8Arrays(chunks);
  }

  deserialize(data: Uint8Array): unknown {
    const [value] = this.deserializeValue(data, 0);
    return value;
  }

  private serializeValue(value: unknown, chunks: Uint8Array[]): void {
    if (value === null) {
      this.serializeNull(chunks);
    } else if (value === undefined) {
      this.serializeUndefined(chunks);
    } else if (typeof value === "boolean") {
      this.serializeBoolean(value, chunks);
    } else if (typeof value === "number") {
      this.serializeNumber(value, chunks);
    } else if (typeof value === "string") {
      this.serializeString(value, chunks);
    } else if (Array.isArray(value)) {
      this.serializeArray(value, chunks);
    } else if (value instanceof Date) {
      this.serializeDate(value, chunks);
    } else if (value instanceof URL) {
      this.serializeURL(value, chunks);
    } else if (typeof value === "object") {
      this.serializeObject(value as Record<string, unknown>, chunks);
    } else {
      throw new Error(`Unsupported type: ${typeof value}`);
    }
  }

  private serializeNull(chunks: Uint8Array[]): void {
    chunks.push(new Uint8Array([TaggedBinarySerializer.TYPE_TAGS.NULL]));
  }

  private serializeUndefined(chunks: Uint8Array[]): void {
    chunks.push(new Uint8Array([TaggedBinarySerializer.TYPE_TAGS.UNDEFINED]));
  }

  private serializeBoolean(value: boolean, chunks: Uint8Array[]): void {
    chunks.push(
      new Uint8Array([TaggedBinarySerializer.TYPE_TAGS.BOOLEAN, value ? 1 : 0])
    );
  }

  private serializeNumber(value: number, chunks: Uint8Array[]): void {
    if (this.isInt32(value)) {
      this.serializeInt32(value, chunks);
    } else {
      this.serializeFloat64(value, chunks);
    }
  }

  private isInt32(value: number): boolean {
    return (
      Number.isInteger(value) && value >= -2147483648 && value <= 2147483647
    );
  }

  private serializeInt32(value: number, chunks: Uint8Array[]): void {
    chunks.push(new Uint8Array([TaggedBinarySerializer.TYPE_TAGS.INT32]));
    this.addPadding(chunks, 4);
    chunks.push(new Uint8Array(new Int32Array([value]).buffer));
  }

  private serializeFloat64(value: number, chunks: Uint8Array[]): void {
    chunks.push(new Uint8Array([TaggedBinarySerializer.TYPE_TAGS.FLOAT64]));
    this.addPadding(chunks, 8);
    chunks.push(new Uint8Array(new Float64Array([value]).buffer));
  }

  private serializeString(value: string, chunks: Uint8Array[]): void {
    const stringBytes = new TextEncoder().encode(value);
    chunks.push(new Uint8Array([TaggedBinarySerializer.TYPE_TAGS.STRING]));
    this.serializeUint32(stringBytes.length, chunks);
    chunks.push(stringBytes);
  }

  private serializeArray(value: unknown[], chunks: Uint8Array[]): void {
    chunks.push(new Uint8Array([TaggedBinarySerializer.TYPE_TAGS.ARRAY]));
    this.serializeUint32(value.length, chunks);
    for (const item of value) {
      this.serializeValue(item, chunks);
    }
  }

  private serializeDate(value: Date, chunks: Uint8Array[]): void {
    chunks.push(new Uint8Array([TaggedBinarySerializer.TYPE_TAGS.DATE]));
    this.addPadding(chunks, 8);
    chunks.push(new Uint8Array(new Float64Array([value.getTime()]).buffer));
  }

  private serializeURL(value: URL, chunks: Uint8Array[]): void {
    const urlString = value.toString();
    chunks.push(new Uint8Array([TaggedBinarySerializer.TYPE_TAGS.URL]));
    this.serializeString(urlString, chunks);
  }

  private serializeObject(
    value: Record<string, unknown>,
    chunks: Uint8Array[]
  ): void {
    const entries = Object.entries(value);
    chunks.push(new Uint8Array([TaggedBinarySerializer.TYPE_TAGS.OBJECT]));
    this.serializeUint32(entries.length, chunks);
    for (const [key, val] of entries) {
      this.serializeValue(key, chunks);
      this.serializeValue(val, chunks);
    }
  }

  private serializeUint32(value: number, chunks: Uint8Array[]): void {
    this.addPadding(chunks, 4);
    chunks.push(new Uint8Array(new Uint32Array([value]).buffer));
  }

  private deserializeValue(
    data: Uint8Array,
    offset: number
  ): [unknown, number] {
    const type = data[offset++];
    switch (type) {
      case TaggedBinarySerializer.TYPE_TAGS.NULL:
        return [null, offset];
      case TaggedBinarySerializer.TYPE_TAGS.UNDEFINED:
        return [undefined, offset];
      case TaggedBinarySerializer.TYPE_TAGS.BOOLEAN:
        return this.deserializeBoolean(data, offset);
      case TaggedBinarySerializer.TYPE_TAGS.INT32:
        return this.deserializeInt32(data, offset);
      case TaggedBinarySerializer.TYPE_TAGS.FLOAT64:
        return this.deserializeFloat64(data, offset);
      case TaggedBinarySerializer.TYPE_TAGS.STRING:
        return this.deserializeString(data, offset);
      case TaggedBinarySerializer.TYPE_TAGS.ARRAY:
        return this.deserializeArray(data, offset);
      case TaggedBinarySerializer.TYPE_TAGS.OBJECT:
        return this.deserializeObject(data, offset);
      case TaggedBinarySerializer.TYPE_TAGS.DATE:
        return this.deserializeDate(data, offset);
      case TaggedBinarySerializer.TYPE_TAGS.URL:
        return this.deserializeURL(data, offset);
      default:
        throw new Error(`Unknown type tag: ${type}`);
    }
  }

  private deserializeBoolean(
    data: Uint8Array,
    offset: number
  ): [boolean, number] {
    return [Boolean(data[offset++]), offset];
  }

  private deserializeInt32(data: Uint8Array, offset: number): [number, number] {
    offset = this.alignOffset(offset, 4);
    return [new Int32Array(data.buffer, offset, 1)[0], offset + 4];
  }

  private deserializeFloat64(
    data: Uint8Array,
    offset: number
  ): [number, number] {
    offset = this.alignOffset(offset, 8);
    return [new Float64Array(data.buffer, offset, 1)[0], offset + 8];
  }

  private deserializeString(
    data: Uint8Array,
    offset: number
  ): [string, number] {
    const [length, newOffset] = this.deserializeUint32(data, offset);
    const value = new TextDecoder().decode(
      data.subarray(newOffset, newOffset + length)
    );
    return [value, newOffset + length];
  }

  private deserializeArray(
    data: Uint8Array,
    offset: number
  ): [unknown[], number] {
    const [length, newOffset] = this.deserializeUint32(data, offset);
    const array = [];
    let currentOffset = newOffset;
    for (let i = 0; i < length; i++) {
      const [value, nextOffset] = this.deserializeValue(data, currentOffset);
      array.push(value);
      currentOffset = nextOffset;
    }
    return [array, currentOffset];
  }

  private deserializeObject(
    data: Uint8Array,
    offset: number
  ): [Record<string, unknown>, number] {
    const [length, newOffset] = this.deserializeUint32(data, offset);
    const obj: Record<string, unknown> = {};
    let currentOffset = newOffset;
    for (let i = 0; i < length; i++) {
      const [key, keyOffset] = this.deserializeValue(data, currentOffset);
      const [value, valueOffset] = this.deserializeValue(data, keyOffset);
      obj[key as string] = value;
      currentOffset = valueOffset;
    }
    return [obj, currentOffset];
  }

  private deserializeDate(data: Uint8Array, offset: number): [Date, number] {
    offset = this.alignOffset(offset, 8);
    return [new Date(new Float64Array(data.buffer, offset, 1)[0]), offset + 8];
  }

  private deserializeURL(data: Uint8Array, offset: number): [URL, number] {
    const [urlString, newOffset] = this.deserializeString(data, offset);
    return [new URL(urlString), newOffset];
  }

  private deserializeUint32(
    data: Uint8Array,
    offset: number
  ): [number, number] {
    offset = this.alignOffset(offset, 4);
    return [new Uint32Array(data.buffer, offset, 1)[0], offset + 4];
  }

  private concatenateUint8Arrays(arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
    }
    return result;
  }

  private addPadding(chunks: Uint8Array[], alignment: number): void {
    const currentLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const paddingLength = (alignment - (currentLength % alignment)) % alignment;
    if (paddingLength > 0) {
      chunks.push(new Uint8Array(paddingLength));
    }
  }

  private alignOffset(offset: number, alignment: number): number {
    return offset + ((alignment - (offset % alignment)) % alignment);
  }
}

export default TaggedBinarySerializer;
