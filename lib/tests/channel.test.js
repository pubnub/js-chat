"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var src_1 = require("../src");
var dotenv = require("dotenv");
var testUtils_1 = require("./testUtils");
dotenv.config();
describe("Channel test", function () {
    var chat;
    var channel;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, testUtils_1.initTestChat)()];
                case 1:
                    chat = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    beforeEach(function () {
        jest.resetAllMocks();
    });
    test("should create a channel", function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, channelName, channelDescription, channelData, createdChannel;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    jest.retryTimes(3);
                    channelId = (0, testUtils_1.createRandomUserId)();
                    channelName = "Test Channel";
                    channelDescription = "This is a test channel";
                    channelData = {
                        name: channelName,
                        description: channelDescription
                    };
                    return [4 /*yield*/, chat.createChannel(channelId, channelData)];
                case 1:
                    createdChannel = _a.sent();
                    expect(createdChannel).toBeDefined();
                    expect(createdChannel.id).toEqual(channelId);
                    expect(createdChannel.name).toEqual(channelName);
                    expect(createdChannel.description).toEqual(channelDescription);
                    return [2 /*return*/];
            }
        });
    }); });
    test("should soft delete a channel", function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, channelName, channelDescription, channelData, createdChannel, deleteOptions, isDeleted;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    jest.retryTimes(3);
                    channelId = (0, testUtils_1.createRandomUserId)();
                    channelName = "Test Channel";
                    channelDescription = "This is a test channel";
                    channelData = {
                        name: channelName,
                        description: channelDescription
                    };
                    return [4 /*yield*/, chat.createChannel(channelId, channelData)];
                case 1:
                    createdChannel = _a.sent();
                    deleteOptions = {
                        soft: true
                    };
                    return [4 /*yield*/, createdChannel["delete"](deleteOptions)];
                case 2:
                    isDeleted = _a.sent();
                    expect(isDeleted).toBeTruthy();
                    return [2 /*return*/];
            }
        });
    }); });
    test("should create a thread", function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, channelName, channelDescription, channelData, createdChannel, messageText, messageInTheCreatedChannel, thread, threadMessages;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    jest.retryTimes(3);
                    channelId = (0, testUtils_1.createRandomUserId)();
                    channelName = "Test Channel";
                    channelDescription = "This is a test channel";
                    channelData = {
                        name: channelName,
                        description: channelDescription
                    };
                    return [4 /*yield*/, chat.createChannel(channelId, channelData)];
                case 1:
                    createdChannel = _a.sent();
                    messageText = "Test message";
                    return [4 /*yield*/, createdChannel.sendText(messageText)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, createdChannel.getHistory()];
                case 3:
                    messageInTheCreatedChannel = _a.sent();
                    return [4 /*yield*/, createdChannel.sendText("Whatever text", {
                            rootMessage: messageInTheCreatedChannel.messages[0]
                        })];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, createdChannel.getHistory()];
                case 5:
                    messageInTheCreatedChannel = _a.sent();
                    expect(messageInTheCreatedChannel.messages[0].threadRootId).toBeDefined();
                    return [4 /*yield*/, messageInTheCreatedChannel.messages[0].getThread()];
                case 6:
                    thread = _a.sent();
                    return [4 /*yield*/, thread.getHistory()];
                case 7:
                    threadMessages = _a.sent();
                    expect(threadMessages.messages[0].text).toContain("Whatever text");
                    return [2 /*return*/];
            }
        });
    }); });
    test("should get channel history", function () { return __awaiter(void 0, void 0, void 0, function () {
        var messageText1, messageText2, history_1, message1InHistory, message2InHistory;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    jest.retryTimes(3);
                    messageText1 = "Test message 1";
                    messageText2 = "Test message 2";
                    if (!channel) return [3 /*break*/, 4];
                    return [4 /*yield*/, channel.sendText(messageText1)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, channel.sendText(messageText2)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, channel.getHistory()];
                case 3:
                    history_1 = _a.sent();
                    message1InHistory = history_1.messages.some(function (message) { return message.content.text === messageText1; });
                    message2InHistory = history_1.messages.some(function (message) { return message.content.text === messageText2; });
                    expect(message1InHistory).toBeTruthy();
                    expect(message2InHistory).toBeTruthy();
                    return [3 /*break*/, 5];
                case 4:
                    expect(channel).not.toBeNull();
                    _a.label = 5;
                case 5: return [2 /*return*/];
            }
        });
    }); });
    test("should get channel history with pagination", function () { return __awaiter(void 0, void 0, void 0, function () {
        var messageText1, messageText2, messageText3, result1, result2, result3, history_2, secondPage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    jest.retryTimes(3);
                    messageText1 = "Test message 1";
                    messageText2 = "Test message 2";
                    messageText3 = "Test message 3";
                    if (!channel) return [3 /*break*/, 6];
                    return [4 /*yield*/, channel.sendText(messageText1)];
                case 1:
                    result1 = _a.sent();
                    return [4 /*yield*/, channel.sendText(messageText2)];
                case 2:
                    result2 = _a.sent();
                    return [4 /*yield*/, channel.sendText(messageText3)];
                case 3:
                    result3 = _a.sent();
                    return [4 /*yield*/, channel.getHistory({ count: 2 })];
                case 4:
                    history_2 = _a.sent();
                    expect(history_2.messages.length).toBe(2);
                    expect(history_2.isMore).toBeTruthy();
                    return [4 /*yield*/, channel.getHistory({ startTimetoken: history_2.messages[0].timetoken })];
                case 5:
                    secondPage = _a.sent();
                    expect(secondPage.messages.length).toBeGreaterThanOrEqual(1);
                    return [3 /*break*/, 7];
                case 6:
                    expect(channel).not.toBeNull();
                    _a.label = 7;
                case 7: return [2 /*return*/];
            }
        });
    }); });
    test("should fail when trying to create a channel without required parameters", function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    jest.retryTimes(3);
                    channelId = (0, testUtils_1.createRandomUserId)();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, chat.createChannel(channelId, {})];
                case 2:
                    _a.sent();
                    fail("Should have thrown an error");
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    expect(error_1).toBeInstanceOf(Error);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    test("should fail when trying to send a message to a non-existent channel", function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, nonExistentChannel, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    jest.retryTimes(3);
                    channelId = (0, testUtils_1.createRandomUserId)();
                    return [4 /*yield*/, chat.getChannel(channelId)];
                case 1:
                    nonExistentChannel = _a.sent();
                    if (!nonExistentChannel) return [3 /*break*/, 6];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, nonExistentChannel.sendText("Test message")];
                case 3:
                    _a.sent();
                    expect(true).toBe(false); // Fail the test if no error is thrown
                    return [3 /*break*/, 5];
                case 4:
                    error_2 = _a.sent();
                    expect(error_2).toBeInstanceOf(Error);
                    return [3 /*break*/, 5];
                case 5: return [3 /*break*/, 7];
                case 6:
                    expect(nonExistentChannel).toBeNull();
                    _a.label = 7;
                case 7: return [2 /*return*/];
            }
        });
    }); });
    test("should fail when trying to send a message to a deleted channel", function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, channelName, channelDescription, channelData, createdChannel, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    jest.retryTimes(3);
                    channelId = (0, testUtils_1.createRandomUserId)();
                    channelName = "Test Channel";
                    channelDescription = "This is a test channel";
                    channelData = {
                        name: channelName,
                        description: channelDescription
                    };
                    return [4 /*yield*/, chat.createChannel(channelId, channelData)];
                case 1:
                    createdChannel = _a.sent();
                    return [4 /*yield*/, createdChannel["delete"]()];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, createdChannel.sendText("Test message")];
                case 4:
                    _a.sent();
                    fail("Should have thrown an error");
                    return [3 /*break*/, 6];
                case 5:
                    error_3 = _a.sent();
                    expect(error_3).toBeInstanceOf(Error);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); });
    jest.retryTimes(3);
    test("should fail when trying to get history of a deleted channel", function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, channelName, channelDescription, channelData, createdChannel, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    jest.retryTimes(3);
                    channelId = (0, testUtils_1.createRandomUserId)();
                    channelName = "Test Channel";
                    channelDescription = "This is a test channel";
                    channelData = {
                        name: channelName,
                        description: channelDescription
                    };
                    return [4 /*yield*/, chat.createChannel(channelId, channelData)];
                case 1:
                    createdChannel = _a.sent();
                    return [4 /*yield*/, createdChannel["delete"]()];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, createdChannel.getHistory()];
                case 4:
                    _a.sent();
                    fail("Should have thrown an error");
                    return [3 /*break*/, 6];
                case 5:
                    error_4 = _a.sent();
                    expect(error_4).toBeInstanceOf(Error);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); });
    test("should edit membership metadata", function () { return __awaiter(void 0, void 0, void 0, function () {
        var user1, user2, channelId, channelData, createdChannel, membership1, membership2, updatedMembership1, updatedMembership2;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    jest.retryTimes(3);
                    user1 = new src_1.User(chat, { id: "user1" });
                    user2 = new src_1.User(chat, { id: "user2" });
                    channelId = (0, testUtils_1.createRandomUserId)();
                    channelData = {
                        name: "Test Channel",
                        description: "This is a test channel"
                    };
                    return [4 /*yield*/, chat.createChannel(channelId, channelData)];
                case 1:
                    createdChannel = _c.sent();
                    return [4 /*yield*/, createdChannel.join(function (message) {
                            // Message callback
                        })];
                case 2:
                    membership1 = _c.sent();
                    return [4 /*yield*/, createdChannel.join(function (message) {
                            // Message callback
                        })];
                case 3:
                    membership2 = _c.sent();
                    return [4 /*yield*/, membership1.update({
                            custom: { role: "admin" }
                        })];
                case 4:
                    updatedMembership1 = _c.sent();
                    expect((_a = updatedMembership1.custom) === null || _a === void 0 ? void 0 : _a.role).toBe("admin");
                    return [4 /*yield*/, membership2.update({
                            custom: { role: "member" }
                        })];
                case 5:
                    updatedMembership2 = _c.sent();
                    expect((_b = updatedMembership2.custom) === null || _b === void 0 ? void 0 : _b.role).toBe("member");
                    return [2 /*return*/];
            }
        });
    }); });
    test("should create direct conversation and send message", function () { return __awaiter(void 0, void 0, void 0, function () {
        var user1Id, user1, _a, channelData, directConversation, messageText, history, messageInHistory;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    jest.retryTimes(3);
                    user1Id = "testUser1";
                    return [4 /*yield*/, chat.getUser(user1Id)];
                case 1:
                    _a = (_b.sent());
                    if (_a) return [3 /*break*/, 3];
                    return [4 /*yield*/, chat.createUser(user1Id, { name: "Test User 1" })];
                case 2:
                    _a = (_b.sent());
                    _b.label = 3;
                case 3:
                    user1 = _a;
                    channelData = {
                        name: "Direct Conversation",
                        description: "Direct conversation for Test User 1"
                    };
                    return [4 /*yield*/, chat.createDirectConversation({
                            user: user1,
                            channelData: channelData
                        })];
                case 4:
                    directConversation = _b.sent();
                    expect(directConversation).toBeDefined();
                    messageText = "Hello from User1";
                    return [4 /*yield*/, directConversation.channel.sendText(messageText)];
                case 5:
                    _b.sent();
                    return [4 /*yield*/, directConversation.channel.getHistory()];
                case 6:
                    history = _b.sent();
                    messageInHistory = history.messages.some(function (message) { return message.content.text === messageText; });
                    expect(messageInHistory).toBeTruthy();
                    return [2 /*return*/];
            }
        });
    }); });
    test("should stream channel updates and invoke the callback", function () { return __awaiter(void 0, void 0, void 0, function () {
        var channel1Id, channel2Id, channel1, channel2, channels, callback, unsubscribe;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    channel1Id = "channel1_".concat(Date.now());
                    channel2Id = "channel2_".concat(Date.now());
                    return [4 /*yield*/, chat.createChannel(channel1Id, {})];
                case 1:
                    channel1 = _a.sent();
                    return [4 /*yield*/, chat.createChannel(channel2Id, {})];
                case 2:
                    channel2 = _a.sent();
                    channels = [channel1, channel2];
                    callback = jest.fn(function (updatedChannels) {
                        expect(updatedChannels).toEqual(channels);
                        Promise.all(channels.map(function (channel) { return channel["delete"](); }))["catch"](function (error) {
                            throw error;
                        });
                    });
                    unsubscribe = src_1.Channel.streamUpdatesOn(channels, callback);
                    return [4 /*yield*/, Promise.all(channels.map(function (channel) { return channel.update({ name: "Updated Name" }); }))];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 5000); })];
                case 4:
                    _a.sent();
                    unsubscribe();
                    return [2 /*return*/];
            }
        });
    }); }, 10000);
    test("should stream membership updates and invoke the callback", function () { return __awaiter(void 0, void 0, void 0, function () {
        var channel1Id, channel2Id, channel1, channel2, channels, callback, user1, user2, memberships, unsubscribe;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    channel1Id = "channel1_".concat(Date.now());
                    channel2Id = "channel2_".concat(Date.now());
                    return [4 /*yield*/, chat.createChannel(channel1Id, {})];
                case 1:
                    channel1 = _a.sent();
                    return [4 /*yield*/, chat.createChannel(channel2Id, {})];
                case 2:
                    channel2 = _a.sent();
                    channels = [channel1, channel2];
                    callback = jest.fn(function (updatedMemberships) {
                        expect(updatedMemberships).toEqual(memberships);
                        Promise.all(channels.map(function (channel) { return channel["delete"](); }))["catch"](function (error) {
                            throw error;
                        });
                    });
                    user1 = new src_1.User(chat, { id: "user1" });
                    user2 = new src_1.User(chat, { id: "user2" });
                    memberships = channels.map(function (channel) {
                        var membershipData = {
                            channel: channel,
                            user: channel === channel1 ? user1 : user2,
                            custom: null
                        };
                        return new src_1.Membership(chat, membershipData);
                    });
                    unsubscribe = src_1.Membership.streamUpdatesOn(memberships, callback);
                    return [4 /*yield*/, Promise.all(channels.map(function (channel) { return channel.update({ name: "Updated Name" }); }))];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 5000); })];
                case 4:
                    _a.sent();
                    unsubscribe();
                    return [2 /*return*/];
            }
        });
    }); }, 10000);
    test("should get unread messages count", function () { return __awaiter(void 0, void 0, void 0, function () {
        var messageText1, messageText2, membership, unreadCount;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    jest.retryTimes(3);
                    messageText1 = "Test message 1";
                    messageText2 = "Test message 2";
                    if (!channel) return [3 /*break*/, 5];
                    return [4 /*yield*/, channel.sendText(messageText1)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, channel.sendText(messageText2)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, channel.join(function (message) {
                            // Handle received messages
                        })];
                case 3:
                    membership = _a.sent();
                    return [4 /*yield*/, membership.getUnreadMessagesCount()];
                case 4:
                    unreadCount = _a.sent();
                    expect(unreadCount).toBe(2);
                    return [3 /*break*/, 6];
                case 5:
                    expect(channel).not.toBeNull();
                    _a.label = 6;
                case 6: return [2 /*return*/];
            }
        });
    }); });
    test("should mention users in a message and validate mentioned users", function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, channelData, createdChannel, user1Id, user1, user2Id, user2, messageText, history, messageInHistory, mentionedUserIds, mentionedUsers;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    jest.retryTimes(3);
                    channelId = (0, testUtils_1.createRandomUserId)();
                    channelData = {
                        name: "Test Channel",
                        description: "This is a test channel"
                    };
                    return [4 /*yield*/, chat.createChannel(channelId, channelData)];
                case 1:
                    createdChannel = _a.sent();
                    user1Id = "user1_".concat(Date.now());
                    return [4 /*yield*/, chat.createUser(user1Id, { name: "User 1" })];
                case 2:
                    user1 = _a.sent();
                    user2Id = "user2_".concat(Date.now());
                    return [4 /*yield*/, chat.createUser(user2Id, { name: "User 2" })];
                case 3:
                    user2 = _a.sent();
                    messageText = "Hello, @".concat(user1.id, " and @").concat(user2.id, " here is my mail test@pubnub.com");
                    return [4 /*yield*/, createdChannel.sendText(messageText)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, createdChannel.getHistory()];
                case 5:
                    history = _a.sent();
                    messageInHistory = history.messages.find(function (message) { return message.content.text === messageText; });
                    expect(messageInHistory).toBeDefined();
                    mentionedUserIds = (0, testUtils_1.extractMentionedUserIds)(messageText);
                    mentionedUsers = [user1, user2].filter(function (user) { return mentionedUserIds.includes(user.id); });
                    expect(mentionedUsers.length).toBe(2);
                    expect(mentionedUsers[0].id).toBe(user1.id);
                    expect(mentionedUsers[1].id).toBe(user2.id);
                    return [4 /*yield*/, chat.deleteUser(user1.id)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, chat.deleteUser(user2.id)];
                case 7:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    jest.retryTimes(3);
});
