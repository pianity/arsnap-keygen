declare module "randchacha" {
    class ChaChaRng {
        constructor(seed: Uint8Array);

        nextU32(): number;

        nextU64(): BigInt;

        fillBytes(buffer: Uint8Array): void;
    }
}
