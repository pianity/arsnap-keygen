import { webcrypto } from "node:crypto";
import { JWKInterface } from "arweave/node/lib/wallet";
import { getKeyPairFromMnemonic, getKeyPairFromSeed } from "human-crypto-keys";

import { SECRET } from "./generatedPem";
import { testJwk } from "./index";

/**
 * Generate a JWK from a mnemonic seedphrase
 *
 * @param mnemonic Mnemonic seedphrase to generate wallet from
 *
 * @returns Wallet JWK
 */
export async function jwkFromMnemonic(mnemonic: string) {
    const { privateKey } = await getKeyPairFromMnemonic(
        mnemonic,
        {
            id: "rsa",
            modulusLength: 4096,
        },
        { privateKeyFormat: "pkcs8-der" },
    );
    const jwk = pkcs8ToJwk(privateKey as any);

    return jwk;
}

/**
 * Generate a JWK from a mnemonic seedphrase
 *
 * @param mnemonic Mnemonic seedphrase to generate wallet from
 *
 * @returns Wallet JWK
 */
export async function jwkFromSeed(seed: Uint8Array) {
    const { privateKey } = await getKeyPairFromSeed(
        seed as unknown as string,
        {
            id: "rsa",
            modulusLength: 4096,
        },
        { privateKeyFormat: "pkcs8-der" },
    );
    const jwk = pkcs8ToJwk(privateKey as any);

    return jwk;
}

/**
 * Convert a PKCS8 private key to a JWK
 *
 * @param privateKey PKCS8 private key to convert
 *
 * @returns JWK
 */
async function pkcs8ToJwk(privateKey: Uint8Array): Promise<JWKInterface> {
    const key = await webcrypto.subtle.importKey(
        "pkcs8",
        privateKey,
        { name: "RSA-PSS", hash: "SHA-256" },
        true,
        ["sign"],
    );
    const jwk = await webcrypto.subtle.exportKey("jwk", key);

    return {
        kty: jwk.kty!,
        e: jwk.e!,
        n: jwk.n!,
        d: jwk.d,
        p: jwk.p,
        q: jwk.q,
        dp: jwk.dp,
        dq: jwk.dq,
        qi: jwk.qi,
    };
}

export async function humanKeysExample(): Promise<JWKInterface> {
    console.log("generating using human keys method...");

    const time = Date.now();

    const jwk = await jwkFromSeed(SECRET);

    console.log("generated the key in", (Date.now() - time) / 1000, "seconds");

    const isKeyValid = await testJwk(jwk);

    if (isKeyValid) {
        console.log("the generated key is valid");
    } else {
        console.log("the generated key is invalid");
    }

    return jwk;
}
