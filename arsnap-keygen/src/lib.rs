use wasm_bindgen::prelude::*;

use hmac_drbg::HmacDRBG;
use rand::RngCore;
use rsa::{pkcs8::ToPrivateKey, RsaPrivateKey};
use sha2::Sha256;

struct Prng {
    drbg: HmacDRBG<Sha256>,
}

impl Prng {
    fn new(seed: &[u8]) -> Self {
        let drbg = HmacDRBG::<Sha256>::new(seed, &[], &[]);

        Self { drbg }
    }
}

impl RngCore for Prng {
    fn next_u32(&mut self) -> u32 {
        let mut output = [0u8; 4];
        self.drbg.generate_to_slice(&mut output, None);
        u32::from_ne_bytes(output)
    }

    fn next_u64(&mut self) -> u64 {
        let mut output = [0u8; 8];
        self.drbg.generate_to_slice(&mut output, None);
        u64::from_ne_bytes(output)
    }

    fn fill_bytes(&mut self, dest: &mut [u8]) {
        self.drbg.generate_to_slice(dest, None);
    }

    fn try_fill_bytes(&mut self, dest: &mut [u8]) -> Result<(), rand::Error> {
        Ok(self.fill_bytes(dest))
    }
}

#[wasm_bindgen]
pub fn keygen(secret: &[u8]) -> String {
    if secret.len() != 32 {
        panic!("Secret must be 32 bytes long");
    }

    let size: usize = 4096;

    let mut seed: [u8; 32] = [0u8; 32];
    seed.clone_from_slice(&secret[0..32]);

    let mut rng = Prng::new(&seed);

    let key = RsaPrivateKey::new(&mut rng, size).unwrap();
    let pem = key.to_pkcs8_der().unwrap().to_pem().to_string();

    pem
}
