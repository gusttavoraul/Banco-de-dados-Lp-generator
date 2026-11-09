import express from "express"
import cors from "cors"
import helmet from "helmet"
import { config } from "./config.js"
import { router } from "./routes/index.js"
import { errorHandler, notFound } from "./middlewares/error-handler.js"

export const app = express()

if (config.trustProxy) app.set("trust proxy", config.trustProxy)

app.use(helmet())
app.use(cors({ origin: config.corsOrigins }))
app.use(express.json({ limit: "100kb" }))

app.use("/api", router)

app.use(notFound)
app.use(errorHandler)
