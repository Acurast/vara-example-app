import winston, { Logger } from "winston";

declare const _STD_: any;

type JobId = {
  origin: {
    kind: string;
    source: string;
  };
  id: string;
};

export const jobId = (_STD_.job.getId() as JobId).id;

export let logger: Logger | undefined = undefined;

export const initLogger = () => {
  try {
    logger = winston.createLogger({
      transports: [
        new winston.transports.Http({
          level: "info",
          format: winston.format.json(),
          ssl: true,
          host: "vector.dev.gke.acurast.com",
        }),
        new winston.transports.Console({
          level: "info",
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
      ],
      defaultMeta: { jobId: `Vara#${jobId}` },
    });
    return;
  } catch (e) {
    // swallow and continue to default logger setup
  }
};
