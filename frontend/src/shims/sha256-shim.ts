import { sha256 as nobleSha256 } from '@noble/hashes/sha256';

function toUint8Array(message: any): Uint8Array {
  if (typeof message === 'string') {
    return new TextEncoder().encode(message);
  }
  if (message instanceof Uint8Array) {
    return message;
  }
  if (Array.isArray(message)) {
    return new Uint8Array(message);
  }
  if (message instanceof ArrayBuffer) {
    return new Uint8Array(message);
  }
  if (ArrayBuffer.isView(message)) {
    return new Uint8Array(message.buffer, message.byteOffset, message.byteLength);
  }
  return new TextEncoder().encode(String(message));
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

export function sha256(message: any): string {
  const bytes = nobleSha256(toUint8Array(message));
  return bytesToHex(bytes);
}

sha256.hex = function (message: any): string {
  return sha256(message);
};

sha256.array = function (message: any): number[] {
  const bytes = nobleSha256(toUint8Array(message));
  return Array.from(bytes);
};

sha256.digest = function (message: any): number[] {
  return sha256.array(message);
};

sha256.arrayBuffer = function (message: any): ArrayBuffer {
  const bytes = nobleSha256(toUint8Array(message));
  const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return buf as ArrayBuffer;
};

sha256.create = function () {
  let hashInstance = nobleSha256.create();
  return {
    update(message: any) {
      hashInstance.update(toUint8Array(message));
      return this;
    },
    hex() {
      return bytesToHex(hashInstance.digest());
    },
    digest() {
      return Array.from(hashInstance.digest());
    },
    array() {
      return Array.from(hashInstance.digest());
    },
    arrayBuffer(): ArrayBuffer {
      const d = hashInstance.digest();
      const buf = d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength);
      return buf as ArrayBuffer;
    },
  };
};

sha256.sha256 = sha256;
sha256.sha224 = sha256; // Fallback

export default sha256;
