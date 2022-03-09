import { JWKInterface } from "arweave/node/lib/wallet";
import forge from "node-forge";
import { ChaChaRng } from "randchacha";

import { SECRET } from "./generatedPem";
import { testJwk } from ".";

function generateKey(): Promise<forge.pki.rsa.KeyPair> {
    const chacha = new ChaChaRng(SECRET);

    return new Promise((resolve, reject) => {
        const prng = forge.random.createInstance();

        prng.seedFile = (needed, callback) => {
            new Promise<string>((resolve, _) => {
                const bytes = new Uint8Array(needed);

                chacha.fillBytes(bytes);

                resolve(String.fromCharCode.apply(null, [...bytes]));
            }).then((seed) => {
                callback(null, seed);
            });
        };

        forge.pki.rsa.generateKeyPair(
            {
                bits: 4096,
                e: 0x10001,
                // Comment the following line for forge to not use a custom PRNG and use the native
                // WebCrypto implementation instead of its JS one.
                prng,
                workers: -1,
            },
            (err, keypair) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(keypair);
                }
            },
        );
    });
}

function forgeKeyToJwk(key: forge.pki.rsa.PrivateKey): JWKInterface {
    const { n, e, d, p, q, dP, dQ, qInv } = key;

    return {
        kty: "RSA",
        n: Buffer.from(n.toByteArray()).toString("base64"),
        e: Buffer.from(e.toByteArray()).toString("base64"),
        d: Buffer.from(d.toByteArray()).toString("base64"),
        p: Buffer.from(p.toByteArray()).toString("base64"),
        q: Buffer.from(q.toByteArray()).toString("base64"),
        dp: Buffer.from(dP.toByteArray()).toString("base64"),
        dq: Buffer.from(dQ.toByteArray()).toString("base64"),
        qi: Buffer.from(qInv.toByteArray()).toString("base64"),
    };
}

/**
 * Achieve the same result as the self executing function of `src/index.ts` but with node-forge
 */
export async function forgeExample() {
    console.log("generating the using forge key...");

    const time = Date.now();

    const key = await generateKey();

    console.log("generated the key in", (Date.now() - time) / 1000, "seconds");

    const jwk = forgeKeyToJwk(key.privateKey);

    const isKeyValid = await testJwk(jwk);

    if (isKeyValid) {
        console.log("the generated key is valid");
    } else {
        console.log("the generated key is invalid");
    }
}
