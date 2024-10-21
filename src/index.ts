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
  providerAddress: "wss://testnet.vara.network",
});

async function main() {
  const text = "PING";
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
    "0x008c7b8e8af22f221bf9872c47a749aac51dc3c374b1ce384f4a43f6a2883afb"
  );

  // Acurast Consumer Contract
  // consumer = 0xae8e868b4685bab8bd2726339d90d6b6a29ae75cacdf1cf1a312e9f6512d625a

  const keys: PublicKeys = _STD_.job.getPublicKeys();
  const account = blake2AsHex(hexToU8a(keys.secp256k1), 256).replace(/^0x/, "");;
  const address = encodeAddress(hexToU8a(account), 137);

  logger?.info(`Fulfillment with address: ${address}, accountID: 0x${account}`);

  const { blockHash, response } = await (
    await program.varaProxy
      .fulfill(jobId, payload)
      .withAccount(account, { signer: new NativeSigner() })
      .calculateGas()
  ).signAndSend();
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
