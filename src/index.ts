import { GearApi } from "@gear-js/api";
import { Signer } from "@polkadot/api/types";
import { SignerPayloadRaw, SignerResult } from "@polkadot/types/types";
import { hexToU8a } from "@polkadot/util";
import { blake2AsHex, encodeAddress } from "@polkadot/util-crypto";
import { Program } from "./lib";
import { initLogger, logger, jobId } from "./logger";

declare const _STD_: any;

initLogger();

const varaApi = GearApi.create({
  providerAddress: "wss://testnet.vara.network", // devnet
  //   providerAddress: "wss://rpc.vara.network", // canary
});

async function main() {
  const text = new Date().toISOString();
  logger?.info(`Fulfillment with text as payload: ${text}`);
  await fulfill(
    jobId,
    ("0x" +
      Buffer.from(new TextEncoder().encode(text)).toString(
        "hex"
      )) as `0x${string}`
  );
}

async function fulfill(jobId: string, payload: `0x${string}`): Promise<void> {
  // Acurast Proxy Contract
  const program = new Program(
    await varaApi,
    "0x008c7b8e8af22f221bf9872c47a749aac51dc3c374b1ce384f4a43f6a2883afb" // devnet
    // "0x8d589e54da57f66fee61d3bc618ffa25d661d1306f4465da47591a907c7d616b" // canary
  );

  // Acurast Consumer Contract
  // devnet: 0x6586cb5caed4c0ee4f64c18be8c0b21f1489bc342289c7153b5ffdf22f7085ae
  // canary: 0x67e0c42d9bc6dca3788b0b7d923b57aa9389464d069c753021b8a80149e47024

  const keys: PublicKeys = _STD_.job.getPublicKeys();
  const account = blake2AsHex(hexToU8a(keys.secp256k1), 256);
  const address = encodeAddress(hexToU8a(account), 137);

  logger?.info(`Fulfillment with address: ${address}, accountID: ${account}`);

  const { blockHash, response } = await program.varaProxy
    .fulfill(jobId, payload)
    .withAccount(address, { signer: new NativeSigner() })
    .withGas(BigInt(100000000000))
    .signAndSend()
    .catch((e) => {
      logger?.error(e);
      throw e;
    });
  logger?.info(`Fulfillment tx hash: ${blockHash}`);

  const result = await response();
  logger?.info(`Fulfillment Result: ${result}`);
}

type PublicKeys = {
  p256: string;
  secp256k1: string;
  ed25519: string;
};

class NativeSigner implements Signer {
  public async signRaw(raw: SignerPayloadRaw): Promise<SignerResult> {
    _STD_.chains.substrate.signer.setSigner("SECP256K1");

    const sig: string = _STD_.chains.substrate.signer.sign(raw.data);
    // prefix with the enum index for signature type; 02 corresponds to ecdsa
    const signature = ("0x02" + sig) as any;
    logger?.info(`Fulfillment tx signature: ${signature}`);
    return {
      id: 0,
      // signature has to be 0x prefixed
      signature,
    };
  }
}

main().catch(async (e) => {
  //discconnet
  (await varaApi).provider.disconnect();

  throw e;
});
