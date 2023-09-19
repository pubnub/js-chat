"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  Channel,
  Chat,
  Membership,
  Message as PubNubMessage,
  MessageDraft,
  User,
  Event,
} from "@pubnub/chat"
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import styles from "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css"
import pageStyles from "./page.module.css"
import {
  MainContainer,
  MessageInput,
  Conversation,
  Avatar,
  ConversationList,
  Sidebar,
  ConversationHeader,
  ExpansionPanel,
  MessageList,
  VoiceCallButton,
  Button,
} from "@chatscope/chat-ui-kit-react"
import { AutosuggestionBox } from "@/app/components/autosuggestion-box/autosuggestion-box"
import { MentionPopup } from "@/app/components/mention-popup/mention-popup"
import { MessageInput as PubNubMessageInput } from "@/app/components/message-input/message-input"
import { CreateChannelDialog } from "@/app/components/create-channel-dialog/create-channel-dialog"
import { TypingIndicator as PubNubTypingIndicator } from "@/app/components/typing-indicator/typing-indicator"
import { Message as PubNubMessageComponent } from "@/app/components/message/message"

const userId = (new URLSearchParams(window.location.search).get("userid") as string) || "test-user"

const publishKey = "demo"
const subscribeKey = "demo"

export default function Home() {
  const [chat, setChat] = useState<Chat | null>(null)
  const [isChannelsPaginationEnd, setIsChannelsPaginationEnd] = useState(false)
  const [channels, setChannels] = useState<Channel[]>([])
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null)
  const [currentThreadChannel, setCurrentThreadChannel] = useState<Channel | null>(null)
  const [isMessagesPaginationEnd, setIsMessagesPaginationEnd] = useState(false)
  const [isThreadMessagesPaginationEnd, setIsThreadMessagesPaginationEnd] = useState(false)
  const [isUsersPaginationEnd, setIsUsersPaginationEnd] = useState(false)
  const [messages, setMessages] = useState<PubNubMessage[]>([])
  const [threadMessages, setThreadMessages] = useState<PubNubMessage[]>([])
  const [messageInputValue, setMessageInputValue] = useState("")
  const [messageThreadInputValue, setMessageThreadInputValue] = useState("")
  const [users, setUsers] = useState(new Map())
  const [channelsThumbnails, setChannelsThumbnails] = useState(new Map())
  const [messageDraft, setMessageDraft] = useState<MessageDraft | null>(null)
  const [threadMessageDraft, setThreadMessageDraft] = useState<MessageDraft | null>(null)
  const [typingData, setTypingData] = useState<string[]>([])
  const [threadTypingData, setThreadTypingData] = useState<string[]>([])
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([])
  const [threadSuggestedUsers, setThreadSuggestedUsers] = useState<User[]>([])
  const [lastAffectedNameOccurrenceIndex, setLastAffectedNameOccurrenceIndex] = useState(-1)
  const [lastThreadAffectedNameOccurrenceIndex, setLastThreadAffectedNameOccurrenceIndex] =
    useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const [quote, setQuote] = useState<PubNubMessage | null>(null)
  const [threadQuote, setThreadQuote] = useState<PubNubMessage | null>(null)
  const [threadStartMessage, setThreadStartMessage] = useState<PubNubMessage | null>(null)
  const [presentUsers, setPresentUsers] = useState<string[]>([])
  const [channelInfoOpen, setChannelInfoOpen] = useState(false)
  const [isCreateNewChannelDialogOpen, setIsCreateNewChannelDialogOpen] = useState(false)
  const [currentChannelMembers, setCurrentChannelMembers] = useState<Membership[]>([])
  const [mentionEventData, setMentionEventData] = useState<Event<"mention"> | null>(null)

  const updateUsersMap = useCallback((k: string, v: User | User[]) => {
    if (Array.isArray(v)) {
      v.forEach((user) => {
        setUsers(
          new Map(
            users.set(user.id, {
              ...user,
              thumbnail: `https://loremflickr.com/40/40?random=${user.id}`,
            })
          )
        )
      })
      return
    }

    setUsers(
      new Map(users.set(k, { ...v, thumbnail: `https://loremflickr.com/40/40?random=${k}` }))
    )
  }, [])

  useEffect(() => {
    async function init() {
      const chat = await Chat.init({
        publishKey,
        subscribeKey,
        userId,
        typingTimeout: 2000,
        storeUserActivityTimestamps: true,
      })

      setChat(chat)

      const channel =
        (await chat.getChannel("test-channel")) ||
        (await chat.createPublicConversation({
          channelId: "test-channel",
          channelData: { name: "Some test channel" },
        }))

      setChannelsThumbnails(
        channelsThumbnails.set(channel.id, `https://loremflickr.com/40/40?random=${channel.id}`)
      )
      setCurrentChannel(channel)
      styles

      chat.getUsers({}).then((usersObject) => {
        updateUsersMap("1", usersObject.users)
        setIsUsersPaginationEnd(!usersObject.page.next)
      })

      updateUsersMap(chat.currentUser.id, chat.currentUser)

      chat.getChannels({}).then((channelsObject) => {
        setChannels(channelsObject.channels)
        setIsChannelsPaginationEnd(!channelsObject.page.next)
        channelsObject.channels.forEach((c) => {
          setChannelsThumbnails(
            channelsThumbnails.set(c.id, `https://loremflickr.com/40/40?random=${c.id}`)
          )
        })
      })
    }

    init()
  }, [])

  useEffect(() => {
    if (!currentChannel) {
      return
    }

    async function switchChannelImplementation() {
      if (!currentChannel) {
        return
      }

      const historicalMessagesObject = await currentChannel.getHistory()

      setMessages((msgs) => [...historicalMessagesObject.messages, ...msgs])
      setIsMessagesPaginationEnd(!historicalMessagesObject.isMore)

      setMessageDraft(currentChannel.createMessageDraft({ userSuggestionSource: "global" }))

      currentChannel.getTyping((value) => {
        setTypingData(value)
      })

      const channelMembers = await currentChannel.getMembers()
      setCurrentChannelMembers(channelMembers.members)
    }

    switchChannelImplementation()

    const disconnect = currentChannel.connect((message) => {
      if (!users.get(message.userId)) {
        chat?.getUser(message.userId).then((newUser) => {
          if (newUser) {
            updateUsersMap(message.userId, newUser)
          }
        })
      }
      setMessages((currentMessages) => [...currentMessages, message])
    })

    return () => {
      disconnect()
      setMessages([])
    }
  }, [currentChannel, users])

  useEffect(() => {
    if (!chat || !currentChannel) {
      return
    }

    chat.whoIsPresent(currentChannel.id).then(setPresentUsers)
  }, [chat, currentChannel])

  useEffect(() => {
    if (!currentThreadChannel) {
      return
    }

    async function init() {
      if (!currentThreadChannel) {
        return
      }

      const historicalMessagesObject = await currentThreadChannel.getHistory()

      setThreadMessages((msgs) => [...historicalMessagesObject.messages, ...msgs])
      setIsThreadMessagesPaginationEnd(!historicalMessagesObject.isMore)

      setThreadMessageDraft(
        currentThreadChannel.createMessageDraft({ userSuggestionSource: "global" })
      )

      currentThreadChannel.getTyping((value) => {
        setThreadTypingData(value)
      })
    }

    init()

    const disconnect = currentThreadChannel.connect((message) => {
      if (!users.get(message.userId)) {
        chat?.getUser(message.userId).then((newUser) => {
          if (newUser) {
            updateUsersMap(message.userId, newUser)
          }
        })
      }

      setThreadMessages((currentMessages) => [...currentMessages, message])
    })

    return () => {
      disconnect()
      setThreadMessages([])
    }
  }, [currentThreadChannel])

  useEffect(() => {
    if (!chat) {
      return
    }

    const disconnect = chat.listenForEvents({
      channel: chat.currentUser.id,
      type: "mention",
      method: "publish",
      callback: (event) => {
        setMentionEventData(event)
      },
    })

    return disconnect
  }, [chat])

  const handleMessageInput = useCallback(
    (text: string) => {
      if (!messageDraft) {
        return
      }

      messageDraft.onChange(text).then((suggestionObject) => {
        setSuggestedUsers(suggestionObject.suggestedUsers)
        setLastAffectedNameOccurrenceIndex(suggestionObject.nameOccurrenceIndex)
      })
      setMessageInputValue(messageDraft.value)
    },
    [messageDraft]
  )

  const handleMessageSend = useCallback(() => {
    if (!messageDraft) {
      return
    }

    if (quote) {
      messageDraft.addQuote(quote)
    }
    messageDraft.send()
    messageDraft.onChange("")
    messageDraft.removeQuote()
    setQuote(null)
    setMessageInputValue(messageDraft.value)
  }, [messageDraft, quote])

  const toggleUserToNotify = useCallback(
    (user: User) => {
      if (!messageDraft) {
        return
      }

      messageDraft.addMentionedUser(user, lastAffectedNameOccurrenceIndex)
      setMessageInputValue(messageDraft.value)
      setSuggestedUsers([])
    },
    [messageDraft, lastAffectedNameOccurrenceIndex]
  )

  const toggleThreadUserToNotify = useCallback(
    (user: User) => {
      if (!threadMessageDraft) {
        return
      }

      threadMessageDraft.addMentionedUser(user, lastThreadAffectedNameOccurrenceIndex)
      setMessageThreadInputValue(threadMessageDraft.value)
      setThreadSuggestedUsers([])
    },
    [threadMessageDraft, lastThreadAffectedNameOccurrenceIndex]
  )

  const openFileDialog = useCallback(() => {
    if (!inputRef.current) {
      return
    }

    inputRef.current.click()
  }, [inputRef])

  const onFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!messageDraft) {
        return
      }

      if (!event.target.files) {
        messageDraft.files = []
        return
      }

      messageDraft.files = event.target.files
    },
    [messageDraft]
  )

  const switchCurrentChannel = useCallback((channel: Channel) => {
    setCurrentChannel(channel)
  }, [])

  const openThread = useCallback(async (message: PubNubMessage) => {
    setThreadMessages([])
    setThreadStartMessage(message)
    let threadChannel

    if (message.hasThread) {
      threadChannel = await message.getThread()
    } else {
      threadChannel = await message.createThread()
    }

    setCurrentThreadChannel(threadChannel)
    setThreadMessageDraft(threadChannel.createMessageDraft({ userSuggestionSource: "global" }))
  }, [])

  const handleThreadMessageInput = useCallback(
    (text: string) => {
      if (!threadMessageDraft) {
        return
      }

      threadMessageDraft.onChange(text).then((suggestionObject) => {
        setThreadSuggestedUsers(suggestionObject.suggestedUsers)
        setLastThreadAffectedNameOccurrenceIndex(suggestionObject.nameOccurrenceIndex)
      })
      setMessageThreadInputValue(threadMessageDraft.value)
    },
    [threadMessageDraft]
  )

  const sendMessageInThread = useCallback(() => {
    if (!threadStartMessage || !threadMessageDraft) {
      return
    }

    if (threadQuote) {
      threadMessageDraft.addQuote(threadQuote)
    }
    threadMessageDraft.send()
    threadMessageDraft.onChange("")
    threadMessageDraft.removeQuote()
    setThreadQuote(null)
    setMessageThreadInputValue(threadMessageDraft.value)
  }, [threadStartMessage, threadMessageDraft, threadQuote])

  const deleteMessage = useCallback(async (message: PubNubMessage) => {
    await message.delete()
    setMessages((msgs) => msgs.filter((m) => m.timetoken !== message.timetoken))
  }, [])

  const fetchFurtherHistory = useCallback(async () => {
    if (!currentChannel || isMessagesPaginationEnd) {
      return
    }

    const historicalMessagesObject = await currentChannel.getHistory({
      startTimetoken: messages[0]?.timetoken,
    })
    setMessages((msgs) => [...historicalMessagesObject.messages, ...msgs])
    setIsMessagesPaginationEnd(!historicalMessagesObject.isMore)
  }, [currentChannel, messages, isMessagesPaginationEnd])

  if (!chat || !messageDraft || !currentChannel) {
    return (
      <main>
        <span>Loading chat...</span>
      </main>
    )
  }

  return (
    <div
      style={{
        height: "100vh",
        position: "relative",
      }}
    >
      <MentionPopup
        mentionEventData={mentionEventData}
        userWhoMentioned={users.get(mentionEventData?.userId)}
        setMentionEventData={setMentionEventData}
      />
      <CreateChannelDialog
        isCreateNewChannelDialogOpen={isCreateNewChannelDialogOpen}
        setIsCreateNewChannelDialogOpen={setIsCreateNewChannelDialogOpen}
        setChannels={setChannels}
        setChannelsThumbnails={setChannelsThumbnails}
        channelsThumbnails={channelsThumbnails}
        chat={chat}
      />
      <MainContainer responsive>
        <Sidebar position="left" scrollable={false}>
          <div className={pageStyles["create-conversation-icon-container"]}>
            <img
              src="plus.jpeg"
              className={pageStyles["create-conversation-icon"]}
              onClick={() => setIsCreateNewChannelDialogOpen(true)}
            />
          </div>
          <ConversationList>
            {channels.map((channel) => (
              <Conversation
                key={channel.id}
                name={channel.name || channel.id}
                info={channel.description}
                onClick={() => switchCurrentChannel(channel)}
                style={channel.id === currentChannel?.id ? { backgroundColor: "aquamarine" } : {}}
              >
                <Avatar src={channelsThumbnails.get(channel.id)} name="Lilly" />
              </Conversation>
            ))}
          </ConversationList>
        </Sidebar>

        <div className="cs-chat-container">
          <ConversationHeader>
            <ConversationHeader.Back />
            <Avatar src={channelsThumbnails.get(currentChannel?.id)} name={currentChannel?.name} />
            <ConversationHeader.Content
              userName={currentChannel?.name}
              info={currentChannel?.description}
            />
            <ConversationHeader.Actions>
              <VoiceCallButton onClick={() => setChannelInfoOpen(!channelInfoOpen)} />
            </ConversationHeader.Actions>
          </ConversationHeader>
          <MessageList
            typingIndicator={<PubNubTypingIndicator typingData={typingData} users={users} />}
          >
            {isMessagesPaginationEnd ? (
              <p>No more messages</p>
            ) : (
              <Button border onClick={fetchFurtherHistory}>
                Fetch older messages
              </Button>
            )}
            {messages.map((msg) => (
              <PubNubMessageComponent
                key={msg.timetoken}
                message={msg}
                users={users}
                presentUsers={presentUsers}
                currentUser={chat.currentUser}
                isThread={false}
                setQuote={setQuote}
                openThread={openThread}
                deleteMessage={deleteMessage}
                renderThreadIcon
              />
            ))}
            <div style={{ position: "relative", marginTop: 32 }}>
              <AutosuggestionBox users={suggestedUsers} toggleUserToNotify={toggleUserToNotify} />
            </div>
          </MessageList>
          {!!quote && (
            <div className={pageStyles["quote-box"]}>
              <div>Author of the message: {users.get(quote.userId)?.name}</div>
              <div>Message: {quote.text}</div>
            </div>
          )}
          <PubNubMessageInput
            isMember={
              !!currentChannelMembers.find((member) => member.user.id === chat.currentUser.id)
            }
            currentChannel={currentChannel}
            messageDraft={messageDraft}
            onChangeInput={handleMessageInput}
            onMessageSend={handleMessageSend}
            onOpenFileDialog={openFileDialog}
            setCurrentChannelMembers={setCurrentChannelMembers}
          />
          <input
            ref={inputRef}
            id="fileInput"
            type="file"
            style={{ display: "none" }}
            onChange={onFileChange}
          />
        </div>

        {!!threadStartMessage && (
          <Sidebar position="right">
            <ExpansionPanel open title="Thread">
              <div>
                <div className={pageStyles["thread-start-message-container"]}>
                  <PubNubMessageComponent
                    message={threadStartMessage}
                    users={users}
                    presentUsers={presentUsers}
                    currentUser={chat.currentUser}
                    isThread
                    setQuote={setThreadQuote}
                    openThread={openThread}
                    deleteMessage={deleteMessage}
                    renderThreadIcon={false}
                  />
                </div>
                <MessageList
                  typingIndicator={
                    <PubNubTypingIndicator typingData={threadTypingData} users={users} />
                  }
                >
                  {threadMessages.map((msg) => (
                    <PubNubMessageComponent
                      key={msg.timetoken}
                      message={msg}
                      users={users}
                      presentUsers={presentUsers}
                      currentUser={chat.currentUser}
                      isThread
                      setQuote={setThreadQuote}
                      openThread={openThread}
                      deleteMessage={deleteMessage}
                      renderThreadIcon={false}
                    />
                  ))}
                  <AutosuggestionBox
                    users={threadSuggestedUsers}
                    toggleUserToNotify={toggleThreadUserToNotify}
                  />
                </MessageList>
                {!!threadQuote && (
                  <div className={pageStyles["quote-box"]}>
                    <div>Author of the message: {users.get(threadQuote.userId)?.name}</div>
                    <div>Message: {threadQuote.text}</div>
                  </div>
                )}
                <MessageInput
                  placeholder="Type message here"
                  onSend={sendMessageInThread}
                  onChange={handleThreadMessageInput}
                  value={threadMessageDraft?.value}
                />
              </div>
            </ExpansionPanel>
          </Sidebar>
        )}
        {channelInfoOpen && (
          <Sidebar position="right">
            <ExpansionPanel open title="Channel members">
              {currentChannelMembers.length ? (
                currentChannelMembers.map((member) => (
                  <p key={member.user.id}>
                    Name: {member.user.name}, id: {member.user.id}
                  </p>
                ))
              ) : (
                <p>No channel members</p>
              )}
            </ExpansionPanel>
          </Sidebar>
        )}
      </MainContainer>
    </div>
  )
}
