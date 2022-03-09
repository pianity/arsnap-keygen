# What is this?

This repo showcases the usage of a Rust library to generate an Arweave key using a seed then import
it in a node.js environment. The code in `test` uses the WebCrypto library so it's entirely
compatible with any modern browser environment.

The directory `arsnap-keygen` is a Rust library containing a single function `keygen`
that generate an Arweave key. It takes as an argument an array of 32 bytes representing the seed
that will be used to generate the key in a deterministic manner.

A simple npm package is also included in the directory `test` that illustrate how such a library
could be used to create an Arweave key and sign transactions with it. It also includes a file at
`test/src/forgeExample.ts` achieving the exact same result using node-forge. The resulting key
should in theory be the same as the algorithm and the seed used for the PRNG should be identical
but in practice they aren't; probably due to some minor differences in the PRNG algorithm or the
key generation one.

# How to try this project

1. Install `wasm-pack` with `cargo install wasm-pack`
1. In `arsnap-keygen` run `wasm-pack build --target nodejs`
1. In `test` run `yarn && yarn start`
