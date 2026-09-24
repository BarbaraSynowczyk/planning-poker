import pino from "pino";
import { v4 as uuidv4 } from "uuid";
import { AsyncLocalStorage } from "node:async_hooks";

export const logger = pino();

const asyncLocalStorage = new AsyncLocalStorage();

export const getLogger = () => {
    return asyncLocalStorage.getStore()?.logger ?? logger;
};

export const requestLogger = (req, res, next) => {
    const requestId = uuidv4();
    const startTime = process.hrtime.bigint();

    const requestLogger = logger.child({ requestId });

    req.requestId = requestId;

    res.on("finish", () => {
        const durationMs =
            Number(process.hrtime.bigint() - startTime) / 1_000_000;

        requestLogger.info(
            {
                timestamp: new Date().toISOString(),
                method: req.method,
                url: req.originalUrl,
                user: req.session?.user?.userName ?? null,
                durationMs: Math.round(durationMs),
                statusCode: res.statusCode,
            },
            "HTTP request",
        );
    });

    asyncLocalStorage.run({ logger: requestLogger }, next);
};
