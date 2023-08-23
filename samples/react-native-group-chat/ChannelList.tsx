import React, {useContext, useEffect, useState} from "react"
import {View, Text, ScrollView} from "react-native";
import { Drawer, Avatar } from 'react-native-paper';
import {ChatContext} from "./context";
import { Channel } from "@pubnub/js-chat"

export function ChannelList() {
  const [active, setActive] = React.useState('');
  const chatContext = useContext(ChatContext)
  const [channels, setChannels] = useState<Channel[]>([])
  const [channelsThumbnails, setChannelsThumbnails] = useState(new Map())

  useEffect(() => {
    const { chat } = chatContext

    if (!chat) {
      return
    }

    chat.getChannels({}).then((channelsObject) => {
      setChannels(channelsObject.channels)
      channelsObject.channels.forEach((c) => {
        setChannelsThumbnails(
          channelsThumbnails.set(c.id, `https://loremflickr.com/40/40?random=${c.id}`)
        )
      })
    })
  }, [chatContext])

  return (
    <ScrollView>
      <Drawer.Section title="Channel list">
        {channels.map((ch) => (
          <Drawer.Item
            key={ch.id}
            label={ch.name}
            active={active === ch.id}
            onPress={() => setActive(ch.id)}
            icon={{ uri: channelsThumbnails.get(ch.id) }}
          />
        ))}
      </Drawer.Section>
    </ScrollView>
  );
}
