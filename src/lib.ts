import { ActorId, TransactionBuilder, ZERO_ADDRESS } from "sails-js";
import { GearApi, decodeAddress } from "@gear-js/api";
import { TypeRegistry } from "@polkadot/types";

export type ConfigureArgument =
  | { owner: ActorId }
  | { iBCContract: ActorId }
  | { acurastPalletAccount: ActorId }
  | { paused: boolean }
  | { payloadVersion: number }
  | { maxMessageBytes: number }
  | { exchangeRatio: ExchangeRatio };

export interface ExchangeRatio {
  numerator: number;
  denominator: number;
}

export type UserAction =
  | { registerJob: RegisterJobUserInput }
  | { deregisterJob: number | string | bigint }
  | { finalizeJob: Array<number | string | bigint> }
  | { setJobEnvironment: SetJobEnvironmentUserInput }
  | { noop: null };

export interface RegisterJobUserInput {
  job_registration: JobRegistrationV1;
  destination: ActorId;
  expected_fulfillment_fee: number | string | bigint;
}

export interface JobRegistrationV1 {
  script: `0x${string}`;
  allowed_sources: Array<Array<number>> | null;
  allow_only_verified_sources: boolean;
  schedule: ScheduleV1;
  memory: number;
  network_requests: number;
  storage: number;
  required_modules: Array<number>;
  extra: JobRequirementsV1;
}

export interface ScheduleV1 {
  duration: number | string | bigint;
  start_time: number | string | bigint;
  end_time: number | string | bigint;
  interval: number | string | bigint;
  max_start_delay: number | string | bigint;
}

export interface JobRequirementsV1 {
  assignment_strategy: AssignmentStrategyV1;
  slots: number;
  reward: number | string | bigint;
  min_reputation: number | string | bigint | null;
}

export type AssignmentStrategyV1 =
  | { single: Array<PlannedExecutionV1> | null }
  | { competing: null };

export interface PlannedExecutionV1 {
  source: Array<number>;
  start_delay: number | string | bigint;
}

export interface SetJobEnvironmentUserInput {
  job_id: number | string | bigint;
  public_key: `0x${string}`;
  processors: Array<SetJobEnvironmentProcessor>;
}

export interface SetJobEnvironmentProcessor {
  address: ActorId;
  variables: Array<[`0x${string}`, `0x${string}`]>;
}

export interface Config {
  owner: ActorId;
  ibc: ActorId;
  acurast_pallet_account: ActorId;
  paused: boolean;
  payload_version: number;
  max_message_bytes: number;
  exchange_ratio: ExchangeRatio;
}

export type JobInformation = { v1: JobInformationV1 };

export interface JobInformationV1 {
  schedule: ScheduleV1;
  creator: ActorId;
  destination: ActorId;
  processors: Array<ActorId>;
  expected_fulfillment_fee: number | string | bigint;
  remaining_fee: number | string | bigint;
  maximum_reward: number | string | bigint;
  status: JobStatus;
  slots: number;
}

export type JobStatus =
  | "open"
  | "matched"
  | "assigned"
  | "finalizedOrCancelled";

export class Program {
  public readonly registry: TypeRegistry;
  public readonly varaProxy: VaraProxy;

  constructor(public api: GearApi, public programId?: `0x${string}`) {
    const types: Record<string, any> = {
      ConfigureArgument: {
        _enum: {
          Owner: "[u8;32]",
          IBCContract: "[u8;32]",
          AcurastPalletAccount: "[u8;32]",
          Paused: "bool",
          PayloadVersion: "u16",
          MaxMessageBytes: "u16",
          ExchangeRatio: "ExchangeRatio",
        },
      },
      ExchangeRatio: { numerator: "u16", denominator: "u16" },
      UserAction: {
        _enum: {
          RegisterJob: "RegisterJobUserInput",
          DeregisterJob: "u128",
          FinalizeJob: "Vec<u128>",
          SetJobEnvironment: "SetJobEnvironmentUserInput",
          Noop: "Null",
        },
      },
      RegisterJobUserInput: {
        job_registration: "JobRegistrationV1",
        destination: "[u8;32]",
        expected_fulfillment_fee: "u128",
      },
      JobRegistrationV1: {
        script: "Vec<u8>",
        allowed_sources: "Option<Vec<[u8; 32]>>",
        allow_only_verified_sources: "bool",
        schedule: "ScheduleV1",
        memory: "u32",
        network_requests: "u32",
        storage: "u32",
        required_modules: "Vec<u16>",
        extra: "JobRequirementsV1",
      },
      ScheduleV1: {
        duration: "u64",
        start_time: "u64",
        end_time: "u64",
        interval: "u64",
        max_start_delay: "u64",
      },
      JobRequirementsV1: {
        assignment_strategy: "AssignmentStrategyV1",
        slots: "u8",
        reward: "u128",
        min_reputation: "Option<u128>",
      },
      AssignmentStrategyV1: {
        _enum: { Single: "Option<Vec<PlannedExecutionV1>>", Competing: "Null" },
      },
      PlannedExecutionV1: { source: "[u8; 32]", start_delay: "u64" },
      SetJobEnvironmentUserInput: {
        job_id: "u128",
        public_key: "Vec<u8>",
        processors: "Vec<SetJobEnvironmentProcessor>",
      },
      SetJobEnvironmentProcessor: {
        address: "[u8;32]",
        variables: "Vec<(Vec<u8>, Vec<u8>)>",
      },
      Config: {
        owner: "[u8;32]",
        ibc: "[u8;32]",
        acurast_pallet_account: "[u8;32]",
        paused: "bool",
        payload_version: "u16",
        max_message_bytes: "u16",
        exchange_ratio: "ExchangeRatio",
      },
      JobInformation: { _enum: { V1: "JobInformationV1" } },
      JobInformationV1: {
        schedule: "ScheduleV1",
        creator: "[u8;32]",
        destination: "[u8;32]",
        processors: "Vec<[u8;32]>",
        expected_fulfillment_fee: "u128",
        remaining_fee: "u128",
        maximum_reward: "u128",
        status: "JobStatus",
        slots: "u8",
      },
      JobStatus: {
        _enum: ["Open", "Matched", "Assigned", "FinalizedOrCancelled"],
      },
    };

    this.registry = new TypeRegistry();
    this.registry.setKnownTypes({ types });
    this.registry.register(types);

    this.varaProxy = new VaraProxy(this);
  }

  newCtorFromCode(
    code: Uint8Array | Buffer,
    owner: ActorId | null,
    ibc: ActorId | null
  ): TransactionBuilder<null> {
    const builder = new TransactionBuilder<null>(
      this.api,
      this.registry,
      "upload_program",
      ["New", owner, ibc],
      "(String, Option<[u8;32]>, Option<[u8;32]>)",
      "String",
      code
    );

    this.programId = builder.programId;
    return builder;
  }

  newCtorFromCodeId(
    codeId: `0x${string}`,
    owner: ActorId | null,
    ibc: ActorId | null
  ) {
    const builder = new TransactionBuilder<null>(
      this.api,
      this.registry,
      "create_program",
      ["New", owner, ibc],
      "(String, Option<[u8;32]>, Option<[u8;32]>)",
      "String",
      codeId
    );

    this.programId = builder.programId;
    return builder;
  }
}

export class VaraProxy {
  constructor(private _program: Program) {}

  public configure(
    actions: Array<ConfigureArgument>
  ): TransactionBuilder<null> {
    if (!this._program.programId) throw new Error("Program ID is not set");
    return new TransactionBuilder<null>(
      this._program.api,
      this._program.registry,
      "send_message",
      ["VaraProxy", "Configure", actions],
      "(String, String, Vec<ConfigureArgument>)",
      "Null",
      this._program.programId
    );
  }

  public fulfill(
    job_id: number | string | bigint,
    payload: `0x${string}`
  ): TransactionBuilder<null> {
    if (!this._program.programId) throw new Error("Program ID is not set");
    return new TransactionBuilder<null>(
      this._program.api,
      this._program.registry,
      "send_message",
      ["VaraProxy", "Fulfill", job_id, payload],
      "(String, String, u128, Vec<u8>)",
      "Null",
      this._program.programId
    );
  }

  public receiveAction(payload: `0x${string}`): TransactionBuilder<null> {
    if (!this._program.programId) throw new Error("Program ID is not set");
    return new TransactionBuilder<null>(
      this._program.api,
      this._program.registry,
      "send_message",
      ["VaraProxy", "ReceiveAction", payload],
      "(String, String, Vec<u8>)",
      "Null",
      this._program.programId
    );
  }

  public sendActions(actions: Array<UserAction>): TransactionBuilder<null> {
    if (!this._program.programId) throw new Error("Program ID is not set");
    return new TransactionBuilder<null>(
      this._program.api,
      this._program.registry,
      "send_message",
      ["VaraProxy", "SendActions", actions],
      "(String, String, Vec<UserAction>)",
      "Null",
      this._program.programId
    );
  }

  public async config(
    originAddress?: string,
    value?: number | string | bigint,
    atBlock?: `0x${string}`
  ): Promise<Config> {
    const payload = this._program.registry
      .createType("(String, String)", ["VaraProxy", "Config"])
      .toHex();
    const reply = await this._program.api.message.calculateReply({
      destination: this._program.programId!,
      origin: originAddress ? decodeAddress(originAddress) : ZERO_ADDRESS,
      payload,
      value: value || 0,
      gasLimit: this._program.api.blockGasLimit.toBigInt(),
      at: atBlock,
    });
    if (!reply.code.isSuccess)
      throw new Error(
        this._program.registry.createType("String", reply.payload).toString()
      );
    const result = this._program.registry.createType(
      "(String, String, Config)",
      reply.payload
    );
    return result[2].toJSON() as unknown as Config;
  }

  public async job(
    job_id: number | string | bigint,
    originAddress?: string,
    value?: number | string | bigint,
    atBlock?: `0x${string}`
  ): Promise<JobInformation> {
    const payload = this._program.registry
      .createType("(String, String, u128)", ["VaraProxy", "Job", job_id])
      .toHex();
    const reply = await this._program.api.message.calculateReply({
      destination: this._program.programId!,
      origin: originAddress ? decodeAddress(originAddress) : ZERO_ADDRESS,
      payload,
      value: value || 0,
      gasLimit: this._program.api.blockGasLimit.toBigInt(),
      at: atBlock,
    });
    if (!reply.code.isSuccess)
      throw new Error(
        this._program.registry.createType("String", reply.payload).toString()
      );
    const result = this._program.registry.createType(
      "(String, String, JobInformation)",
      reply.payload
    );
    return result[2].toJSON() as unknown as JobInformation;
  }

  public async nextJobId(
    originAddress?: string,
    value?: number | string | bigint,
    atBlock?: `0x${string}`
  ): Promise<bigint> {
    const payload = this._program.registry
      .createType("(String, String)", ["VaraProxy", "NextJobId"])
      .toHex();
    const reply = await this._program.api.message.calculateReply({
      destination: this._program.programId!,
      origin: originAddress ? decodeAddress(originAddress) : ZERO_ADDRESS,
      payload,
      value: value || 0,
      gasLimit: this._program.api.blockGasLimit.toBigInt(),
      at: atBlock,
    });
    if (!reply.code.isSuccess)
      throw new Error(
        this._program.registry.createType("String", reply.payload).toString()
      );
    const result = this._program.registry.createType(
      "(String, String, u128)",
      reply.payload
    );
    return result[2].toBigInt() as unknown as bigint;
  }
}
