import express from "express"
import * as dotenv from "dotenv"
import cors from "cors"
import PubNub from "pubnub"

dotenv.config({ debug: true, path: "../../.env" })

const app = express()

app.use(express.json())
app.use(cors())

const port = process.env.AUTH_PORT
const pubnub = new PubNub({
  publishKey: process.env.PUB_KEY,
  subscribeKey: process.env.SUB_KEY,
  secretKey: process.env.SECRET_KEY,
  userId: "auth-server",
})

app.get("/", (req, res) => {
  res.status(200).json({ hello: "world" })
})

app.post("/auth", async (req, res) => {
  const { user, password } = req.body
  const token = await pubnub.grantToken({
    ttl: 60,
    authorized_uuid: user,
    resources: {
      channels: {
        "*": {
          read: true,
          write: true,
          get: true,
        },
      },
      uuids: {
        "*": {
          get: true,
        },
        user: {
          get: true,
          update: true,
          delete: true,
        },
      },
    },
  })
  res.status(200).json({ token })
})

app.listen(port, () => {
  console.log(`PubNub authorization server is running on http://localhost:${port}`)
})
