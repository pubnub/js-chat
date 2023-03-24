import { Chat } from "@pubnub/chat"

const serverId = "auth-server"

export const chat = Chat.init({
  subscribeKey: import.meta.env.PUBLIC_SUB_KEY || "",
  publishKey: import.meta.env.PUBLIC_PUB_KEY || "",
  secretKey: import.meta.env.SECRET_KEY || "",
  userId: serverId,
})

chat.sdk.grantToken({
  ttl: 60,
  authorized_uuid: serverId,
  resources: {
    channels: {
      "*": {
        get: true,
        update: true,
        delete: true,
      },
    },
    uuids: {
      "*": {
        get: true,
        update: true,
        delete: true,
      },
    },
  },
})

export const headers = {
  "Content-Type": "application/json",
}

export const getGrantParams = (id) => ({
  ttl: 60,
  authorized_uuid: id,
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
      id: {
        get: true,
        update: true,
        delete: true,
      },
    },
  },
})
