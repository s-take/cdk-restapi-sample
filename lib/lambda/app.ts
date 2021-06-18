import * as express from "express";
import * as aws from "aws-sdk";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const USER_TABLE = "take-sampleapi-users";

// ローカルで実行する際の設定
const dynamoOptions =
  process.env.NODE_ENV === "development"
    ? {
        region: "localhost",
        endpoint: "http://localhost:8000",
      }
    : { region: "ap-northeast-1" };
const documentClient = new aws.DynamoDB.DocumentClient(dynamoOptions);

/**
 * GET: /api/v1/message サンプル
 */
app.get("/api/v1/message", (req: express.Request, res: express.Response) => {
  res.send({ message: "Hello" });
});

/**
 * GET: /user/:userId ユーザー取得
 * @param userId 取得対象ユーザーのIDを指定
 */
app.get("/users/:id", (req: express.Request, res: express.Response) => {
  // app.get("/users/myprofile", (req, res) => {
  // 本来はtokenからlineIdを取得する
  documentClient
    .get({
      TableName: USER_TABLE,
      Key: {
        lineId: req.params.id,
      },
    })
    .promise()
    .then((result) => res.json(result["Item"]))
    .catch((e) => res.status(422).json({ errors: e }));
});

/**
 * POST: /users ユーザー作成API
 * @param {req.body} { id: id, nickname: ニックネーム, age: 年齢 }
 */
app.post("/users", (req: express.Request, res: express.Response) => {
  const { id, nickname, age } = req.body;
  documentClient
    .put({
      TableName: USER_TABLE,
      Item: {
        id: id,
        nickname: nickname,
        age: age,
      },
    })
    .promise()
    .then((result) => res.json(result))
    .catch((e) => res.status(422).json({ errors: e }));
});

export default app;
