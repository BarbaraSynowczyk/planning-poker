import pino from "pino";
import { v4 as uuidv4 } from "uuid";

export const logger = pino();

export const requestLogger = (req, res, next) => {
    const requestId = uuidv4();
    const startTime = process.hrtime.bigint();

    req.requestId = requestId;

    res.on("finish", () => {
        const durationMs =
            Number(process.hrtime.bigint() - startTime) / 1_000_000;

        logger.info(
            {
                requestId,
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

    next();
};
