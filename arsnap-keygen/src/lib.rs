use wasm_bindgen::prelude::*;

use rand::SeedableRng;
use rand_chacha::ChaCha20Rng;
use rsa::{pkcs8::ToPrivateKey, RsaPrivateKey};

#[wasm_bindgen]
pub fn keygen(secret: &[u8]) -> String {
    if secret.len() != 32 {
        panic!("Secret must be at least 32 bytes long");
    }

    let size: usize = 4096;

    let mut seed: [u8; 32] = [0u8; 32];
    seed.clone_from_slice(&secret[0..32]);

    let mut rng = ChaCha20Rng::from_seed(seed);

    let key = RsaPrivateKey::new(&mut rng, size).unwrap();
    let pem = key.to_pkcs8_der().unwrap().to_pem().to_string();

    pem
}
