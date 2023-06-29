# What is this?

This repo implements contains a WASM library meant to be used by https://github.com/pianity/arsnap.
The library exposes a single `keygen` function that derivate an Arweave key froma seed passed as an array of 32 bytes.

A simple npm package is also included in the directory `test` that illustrate how such a library
could be used in a NodeJS environment to create an Arweave key. It also tests the same algorithms
implemented in the package `human-crypto-keys`. The resulting key should in theory be the same as
the algorithm and the seed used for the PRNG should be identical but in practice, for a reason that
I ignore, they aren't.

# How to try this project

1. Install `wasm-pack` with `cargo install wasm-pack`
1. In `arsnap-keygen` run `wasm-pack build --target nodejs`
1. In `test` run `yarn && yarn start`
