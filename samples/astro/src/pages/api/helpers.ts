import { Chat } from "@pubnub/chat"

const serverId = "auth-server"

export const chat = Chat.init({
  subscribeKey: import.meta.env.PUBLIC_SUB_KEY || "",
  publishKey: import.meta.env.PUBLIC_PUB_KEY || "",
  secretKey: import.meta.env.SECRET_KEY || "",
  userId: serverId,
})

export const headers = {
  "Content-Type": "application/json",
}

export const getGrantParams = (id) => ({
  ttl: 60,
  authorized_uuid: id,
  resources: {
    uuids: {
      [`${id}`]: {
        delete: true,
        get: true,
        update: true,
      },
    },
  },
  patterns: {
    channels: {
      ".*": {
        delete: true,
        get: true,
        join: true,
        read: true,
        update: true,
        write: true,
      },
    },
    uuids: {
      ".*": {
        get: true,
      },
    },
  },
})
