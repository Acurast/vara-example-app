import { GearApi } from "@gear-js/api";
import { Signer } from "@polkadot/api/types";
import { SignerPayloadRaw, SignerResult } from "@polkadot/types/types";
import { hexToU8a } from "@polkadot/util";
import { blake2AsHex, encodeAddress } from "@polkadot/util-crypto";
import { Program } from "./lib";

declare const _STD_: any;

const varaApi = GearApi.create({
  providerAddress: "wss://testnet.vara.network",
});

async function main() {
  const text = new Date().toISOString();
  console.log("Fulfilling with text as payload: ", text);
  await fulfill(
    getJobId(),
    ("0x" +
      Buffer.from(new TextEncoder().encode(text)).toString(
        "hex"
      )) as `0x${string}`
  );
}

function getJobId(): string {
  const jobId: JobId = _STD_.job.getId();
  return jobId.id;
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
  const address = encodeAddress(
    hexToU8a(blake2AsHex(hexToU8a(keys.secp256k1), 256)),
    137
  );

  console.log("Address: ", address);

  const { blockHash, response } = await (
    await program.varaProxy
      .fulfill(jobId, payload)
      .withAccount(address, { signer: new NativeSigner() })
      .calculateGas()
  ).signAndSend();
  console.log("TX hash:", blockHash);

  const result = await response();
  console.log("Result", result);
}

type PublicKeys = {
  p256: string;
  secp256k1: string;
  ed25519: string;
};

type JobId = {
  origin: {
    kind: string;
    source: string;
  };
  id: string;
};

class NativeSigner implements Signer {
  public async signRaw(raw: SignerPayloadRaw): Promise<SignerResult> {
    _STD_.chains.substrate.signer.setSigner("SECP256K1");

    const sig: string = _STD_.chains.substrate.signer.sign(raw.data);
    // prefix with the enum index for signature type; 02 corresponds to ecdsa
    const signature = ("0x02" + sig) as any;
    console.log("Signature:", signature);
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
