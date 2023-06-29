import { webcrypto } from "node:crypto";
import Arweave from "arweave";
import { JWKInterface } from "arweave/node/lib/wallet";
import { keygen } from "arsnap-keygen";

import { SECRET, PREGENERATED_PEM } from "./generatedPem";
import { humanKeysExample } from "./humanKeys";

/**
 * Convert the pem string to a binary representation
 */
function pemToBin(pem: string) {
    let encoded = "";
    const lines = pem.split("\n");
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].indexOf("-----") < 0) {
            encoded += lines[i];
        }
    }
    const byteStr = Buffer.from(encoded, "base64");
    const bytes = new Uint8Array(byteStr.length);
    for (let i = 0; i < byteStr.length; i++) {
        bytes[i] = byteStr[i];
    }
    return bytes.buffer;
}

/**
 * Convert the pem key to the official arweave key format
 */
export async function pemToJwk(pem: string): Promise<JWKInterface> {
    const cryptoKey = await webcrypto.subtle.importKey(
        "pkcs8",
        pemToBin(pem),
        {
            name: "RSA-PSS",
            hash: { name: "SHA-256" },
        },
        true,
        ["sign"],
    );

    const jwk = (await webcrypto.subtle.exportKey("jwk", cryptoKey)) as JWKInterface;

    return {
        kty: jwk.kty,
        n: jwk.n,
        e: jwk.e,
        d: jwk.d,
        p: jwk.p,
        q: jwk.q,
        dp: jwk.dp,
        dq: jwk.dq,
        qi: jwk.qi,
    };
}

/**
 * Try to use the key `jwk` to create an arweave transaction and sign it
 */
export async function testJwk(jwk: JWKInterface) {
    const arweave = Arweave.init({ host: "arweave.net", port: 443, protocol: "https" });

    const tx = await arweave.createTransaction({ data: Math.random().toString().slice(-4) }, jwk);

    await arweave.transactions.sign(tx, jwk);

    const isTxValid = await arweave.transactions.verify(tx);

    return isTxValid;
}

async function wasmExample(): Promise<JWKInterface> {
    console.log("generating using wasm method...");

    const time = Date.now();

    const pem = keygen(SECRET).trimEnd();

    console.log("generated the key in", (Date.now() - time) / 1000, "seconds");

    if (pem === PREGENERATED_PEM) {
        console.log("the new key has been generated with this secret:", "<redacted>");
    } else {
        console.log("the new key has been generated with an unknown secret");
    }

    const jwk = await pemToJwk(pem);

    const isKeyValid = await testJwk(jwk);

    if (isKeyValid) {
        console.log("the generated key is valid");
    } else {
        console.log("the generated key is invalid");
    }

    return jwk;
}

(async () => {
    const wasmJwk = await wasmExample();

    const humanJwk = await humanKeysExample();

    console.log("arsnap-keygen:", wasmJwk);
    console.log("human-crypto-keys:", humanJwk);
    console.log("equality test:", wasmJwk.n === humanJwk.n);
})();
