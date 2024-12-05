import express from "express";
import Session from 'express-session';
import cors from "cors";
import morgan from "morgan";

import * as middleware from "./utils/middleware";
import router from "./routes/router";
import authRouter from "./routes/auth";
import { DOMAIN, ENV, ENVIRONMENTS, SESSION_SECRET } from "./config/superChain/constants";

const app = express();
console.debug("ENV", ENV, DOMAIN);

const cookieConfig: Session.CookieOptions = {
  secure: ENV === ENVIRONMENTS.production,
  sameSite: ENV === ENVIRONMENTS.production ? "none" : true,
}

app.use(cors({
  origin: DOMAIN,
  credentials: true,
}));

app.use(express.json());
app.use(Session({
  name: 'Prosperity-passport-SIWE',
  secret: SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: cookieConfig
}));

if (ENV === ENVIRONMENTS.production) {
  console.log("Trust proxy");
  app.set('trust proxy', 1);
}
app.use(morgan("tiny"));

app.get("/", (req, res) => {
  res.status(200).send({ status: "ok" });
});

app.use("/api", router);
app.use('/auth', authRouter);

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

export default app;