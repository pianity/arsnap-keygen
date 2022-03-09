import { webcrypto } from "node:crypto";
import Arweave from "arweave";
import { JWKInterface } from "arweave/node/lib/wallet";
import Arlocal from "arlocal";
import { keygen } from "arsnap-keygen";

import { SECRET, PREGENERATED_PEM } from "./generatedPem";

// Dirty hack to get the right typings for SubtleCrypto as it is apparently not included in @types/node.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const subtle = (webcrypto as any).subtle as typeof crypto.subtle;

/**
 * Convert the pem string to a binary representation
 */
function PEM2Binary(pem: string) {
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
async function pemToJwk(pem: string): Promise<JWKInterface> {
    const cryptoKey = await subtle.importKey(
        "pkcs8",
        PEM2Binary(pem),
        {
            name: "RSA-PSS",
            hash: { name: "SHA-256" },
        },
        true,
        ["sign"],
    );

    const jwk = (await subtle.exportKey("jwk", cryptoKey)) as JWKInterface;

    return jwk;
}

/**
 * Try to use the key `jwk` to create an arweave transaction and sign it
 */
async function testJwk(jwk: JWKInterface) {
    // Start a local Arweave mock instance to avoid having to request arweave.net when creating the
    // Arweave instance.
    const arlocal = new Arlocal(undefined, false);
    await arlocal.start();
    const arweave = Arweave.init({ host: "localhost", port: 1984, protocol: "http" });

    const tx = await arweave.createTransaction({ data: Math.random().toString().slice(-4) }, jwk);

    await arweave.transactions.sign(tx, jwk);

    const isTxValid = await arweave.transactions.verify(tx);

    await arlocal.stop();

    return isTxValid;
}

(async () => {
    console.log("generating the key...");

    const time = Date.now();

    const pem = keygen(SECRET).trimEnd();

    console.log("generated the key in", (Date.now() - time) / 1000, "seconds");

    if (pem === PREGENERATED_PEM) {
        console.log("the key has been generated with secret:", SECRET);
    } else {
        console.log("the key has been generated with an unknown different secret");
    }

    const jwk = await pemToJwk(pem);

    const isKeyValid = await testJwk(jwk);

    if (isKeyValid) {
        console.log("the generated key is valid");
    } else {
        console.log("the generated key is invalid");
    }
})();
