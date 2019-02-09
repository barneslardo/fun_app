const express = require("express");
const path = require("path-parser");
const cors = require("cors");
const bodyParser = require("body-parser");
const Sequelize = require("sequelize");
const epilogue = require("epilogue");
const OktaJwtVerifier = require("@okta/jwt-verifier");
const app = express();

const oktaJwtVerifier = new OktaJwtVerifier({
  clientId: "0oaacx81uD0ndjUyF356",
  issuer: "https://bigfootwebservice.okta.com/oauth2/ausacu2zhRbgylKNP356"
});

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(async (req, res, next) => {
  try {
    if (!req.headers.authorization)
      throw new Error("Authorization header is required");

    const accessToken = req.headers.authorization.trim().split(" ")[1];
    await oktaJwtVerifier.verifyAccessToken(accessToken);
    next();
  } catch (error) {
    next(error.message);
  }
});

const database = new Sequelize({
  dialect: "sqlite",
  storage: "./test.sqlite"
});

const Post = database.define("posts", {
  title: Sequelize.STRING,
  body: Sequelize.TEXT
});

app.get("/", function(req, res) {
  res.send("You were right, Skylar");
});

epilogue.initialize({ app, sequelize: database });

epilogue.resource({
  model: Post,
  endpoints: ["/posts", "/posts/:id"]
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
  const path = require("path");
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

const PORT = process.env.PORT || 3007;

database.sync().then(() => {
  app.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
  });
});
