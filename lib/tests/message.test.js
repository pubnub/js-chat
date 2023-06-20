"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
describe("Send message test", function () {
    var channel;
    var chat;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, testUtils_1.initTestChat)()];
                case 1:
                    chat = _a.sent();
                    return [4 /*yield*/, (0, testUtils_1.initTestChannel)(chat)];
                case 2:
                    channel = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test("should send and receive unicode messages correctly", function () { return __awaiter(void 0, void 0, void 0, function () {
        var messages, receiveTime, unicodeMessages, disconnect, sendTime, _i, unicodeMessages_1, unicodeMessage, sleep, elapsedTime, _a, unicodeMessages_2, unicodeMessage;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    jest.retryTimes(3);
                    messages = [];
                    receiveTime = 0;
                    if (!channel) {
                        throw new Error("Channel is undefined");
                    }
                    unicodeMessages = ["😀", "Привет", "你好", "こんにちは", "안녕하세요"];
                    disconnect = channel.connect(function (message) {
                        receiveTime = Date.now();
                        messages.push(message.content.text);
                    });
                    sendTime = Date.now();
                    _i = 0, unicodeMessages_1 = unicodeMessages;
                    _b.label = 1;
                case 1:
                    if (!(_i < unicodeMessages_1.length)) return [3 /*break*/, 5];
                    unicodeMessage = unicodeMessages_1[_i];
                    return [4 /*yield*/, channel.sendText(unicodeMessage)];
                case 2:
                    _b.sent();
                    sleep = function (ms) { return new Promise(function (r) { return setTimeout(r, ms); }); };
                    return [4 /*yield*/, sleep(2000)];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 1];
                case 5: return [4 /*yield*/, (0, testUtils_1.waitForAllMessagesToBeDelivered)(messages, unicodeMessages)];
                case 6:
                    _b.sent();
                    elapsedTime = receiveTime - sendTime;
                    console.log(elapsedTime);
                    for (_a = 0, unicodeMessages_2 = unicodeMessages; _a < unicodeMessages_2.length; _a++) {
                        unicodeMessage = unicodeMessages_2[_a];
                        expect(messages).toContain(unicodeMessage);
                    }
                    disconnect();
                    return [2 /*return*/];
            }
        });
    }); }, 30000);
    test("should send and receive regular text messages correctly", function () { return __awaiter(void 0, void 0, void 0, function () {
        var messages, receiveTime, textMessages, disconnect, sendTime, _i, textMessages_1, textMessage, sleep, elapsedTime, _a, textMessages_2, textMessage;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    jest.retryTimes(3);
                    messages = [];
                    receiveTime = 0;
                    if (!channel) {
                        throw new Error("Channel is undefined");
                    }
                    textMessages = ["Hello", "This", "Is", "A", "Test"];
                    disconnect = channel.connect(function (message) {
                        receiveTime = Date.now();
                        messages.push(message.content.text);
                    });
                    sendTime = Date.now();
                    _i = 0, textMessages_1 = textMessages;
                    _b.label = 1;
                case 1:
                    if (!(_i < textMessages_1.length)) return [3 /*break*/, 5];
                    textMessage = textMessages_1[_i];
                    return [4 /*yield*/, channel.sendText(textMessage)];
                case 2:
                    _b.sent();
                    sleep = function (ms) { return new Promise(function (r) { return setTimeout(r, ms); }); };
                    return [4 /*yield*/, sleep(2000)];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 1];
                case 5: return [4 /*yield*/, (0, testUtils_1.waitForAllMessagesToBeDelivered)(messages, textMessages)];
                case 6:
                    _b.sent();
                    elapsedTime = receiveTime - sendTime;
                    console.log(elapsedTime);
                    for (_a = 0, textMessages_2 = textMessages; _a < textMessages_2.length; _a++) {
                        textMessage = textMessages_2[_a];
                        expect(messages).toContain(textMessage);
                    }
                    disconnect();
                    return [2 /*return*/];
            }
        });
    }); }, 30000);
    test("should delete the message", function () { return __awaiter(void 0, void 0, void 0, function () {
        var historyBeforeDelete, messagesBeforeDelete, sentMessage, historyAfterDelete, messagesAfterDelete, deletedMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    jest.retryTimes(3);
                    if (!channel) {
                        throw new Error("Channel is undefined");
                    }
                    return [4 /*yield*/, channel.sendText("Test message")];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, channel.getHistory({ count: 100 })];
                case 2:
                    historyBeforeDelete = _a.sent();
                    messagesBeforeDelete = historyBeforeDelete.messages;
                    sentMessage = messagesBeforeDelete[messagesBeforeDelete.length - 1];
                    return [4 /*yield*/, sentMessage["delete"]()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, channel.getHistory({ count: 100 })];
                case 4:
                    historyAfterDelete = _a.sent();
                    messagesAfterDelete = historyAfterDelete.messages;
                    deletedMessage = messagesAfterDelete.find(function (message) { return message.timetoken === sentMessage.timetoken; });
                    expect(deletedMessage).toBeUndefined();
                    return [2 /*return*/];
            }
        });
    }); }, 30000);
    test("should edit the message", function () { return __awaiter(void 0, void 0, void 0, function () {
        var historyBeforeEdit, messagesBeforeEdit, sentMessage, mockMessage, editedMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    jest.retryTimes(3);
                    if (!channel) {
                        throw new Error("Channel is undefined");
                    }
                    return [4 /*yield*/, channel.sendText("Test message")];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, channel.getHistory({ count: 100 })];
                case 2:
                    historyBeforeEdit = _a.sent();
                    messagesBeforeEdit = historyBeforeEdit.messages;
                    sentMessage = messagesBeforeEdit[messagesBeforeEdit.length - 1];
                    mockMessage = __assign(__assign({}, sentMessage), { editText: jest.fn().mockResolvedValue(sentMessage) });
                    return [4 /*yield*/, mockMessage.editText("Edited message")];
                case 3:
                    editedMessage = _a.sent();
                    expect(mockMessage.editText).toHaveBeenCalledWith("Edited message");
                    expect(editedMessage).toBe(sentMessage);
                    return [2 /*return*/];
            }
        });
    }); }, 30000);
    test("should toggle the message reaction", function () { return __awaiter(void 0, void 0, void 0, function () {
        var historyBeforeReaction, messagesBeforeReaction, sentMessage, mockMessage, toggledMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    jest.retryTimes(3);
                    if (!channel) {
                        throw new Error("Channel is undefined");
                    }
                    return [4 /*yield*/, channel.sendText("Test message")];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, channel.getHistory({ count: 100 })];
                case 2:
                    historyBeforeReaction = _a.sent();
                    messagesBeforeReaction = historyBeforeReaction.messages;
                    sentMessage = messagesBeforeReaction[messagesBeforeReaction.length - 1];
                    mockMessage = __assign(__assign({}, sentMessage), { toggleReaction: jest.fn().mockImplementation(function (reaction) {
                            if (sentMessage.reactions[reaction]) {
                                delete sentMessage.reactions[reaction];
                            }
                            else {
                                sentMessage.reactions[reaction] = [{ uuid: chat.sdk.getUUID(), actionTimetoken: "123" }];
                            }
                            return sentMessage;
                        }) });
                    return [4 /*yield*/, mockMessage.toggleReaction("like")];
                case 3:
                    toggledMessage = _a.sent();
                    expect(mockMessage.toggleReaction).toHaveBeenCalledWith("like");
                    expect(toggledMessage).toBe(sentMessage);
                    return [2 /*return*/];
            }
        });
    }); }, 30000);
    test("should pin the message", function () { return __awaiter(void 0, void 0, void 0, function () {
        var historyBeforePin, messagesBeforePin, messageToPin, pinnedChannel;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    jest.retryTimes(3);
                    if (!channel) {
                        throw new Error("Channel is undefined");
                    }
                    return [4 /*yield*/, channel.sendText("Test message")];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, channel.getHistory({ count: 100 })];
                case 2:
                    historyBeforePin = _b.sent();
                    messagesBeforePin = historyBeforePin.messages;
                    messageToPin = messagesBeforePin[messagesBeforePin.length - 1];
                    return [4 /*yield*/, channel.pinMessage(messageToPin)];
                case 3:
                    pinnedChannel = _b.sent();
                    expect((_a = pinnedChannel.custom) === null || _a === void 0 ? void 0 : _a["pinnedMessageTimetoken"]).toBe(messageToPin.timetoken);
                    return [2 /*return*/];
            }
        });
    }); }, 30000);
    test("should unpin the message", function () { return __awaiter(void 0, void 0, void 0, function () {
        var historyBeforePin, messagesBeforePin, messageToPin, pinnedChannel, unpinnedChannel;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    jest.retryTimes(3);
                    if (!channel) {
                        throw new Error("Channel is undefined");
                    }
                    return [4 /*yield*/, channel.sendText("Test message to be pinned and then unpinned")];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, channel.getHistory({ count: 100 })];
                case 2:
                    historyBeforePin = _c.sent();
                    messagesBeforePin = historyBeforePin.messages;
                    messageToPin = messagesBeforePin[messagesBeforePin.length - 1];
                    return [4 /*yield*/, channel.pinMessage(messageToPin)];
                case 3:
                    pinnedChannel = _c.sent();
                    expect((_a = pinnedChannel.custom) === null || _a === void 0 ? void 0 : _a["pinnedMessageTimetoken"]).toBe(messageToPin.timetoken);
                    return [4 /*yield*/, channel.unpinMessage()];
                case 4:
                    unpinnedChannel = _c.sent();
                    expect((_b = unpinnedChannel.custom) === null || _b === void 0 ? void 0 : _b["pinnedMessageTimetoken"]).toBeUndefined();
                    return [2 /*return*/];
            }
        });
    }); }, 30000);
    test("should stream message updates and invoke the callback", function () { return __awaiter(void 0, void 0, void 0, function () {
        var historyBeforeEdit, messagesBeforeEdit, sentMessage, mockMessage, editedMessage, unsubscribe;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    jest.retryTimes(3);
                    if (!channel) {
                        throw new Error("Channel is undefined");
                    }
                    return [4 /*yield*/, channel.sendText("Test message")];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, channel.getHistory({ count: 100 })];
                case 2:
                    historyBeforeEdit = _a.sent();
                    messagesBeforeEdit = historyBeforeEdit.messages;
                    sentMessage = messagesBeforeEdit[messagesBeforeEdit.length - 1];
                    mockMessage = __assign(__assign({}, sentMessage), { editText: jest.fn().mockResolvedValue(sentMessage) });
                    return [4 /*yield*/, mockMessage.editText("Edited message")];
                case 3:
                    editedMessage = _a.sent();
                    expect(mockMessage.editText).toHaveBeenCalledWith("Edited message");
                    expect(editedMessage).toBe(sentMessage);
                    unsubscribe = src_1.Message.streamUpdatesOn(messagesBeforeEdit, function (updatedMessages) {
                        var receivedMessage = updatedMessages.find(function (msg) { return msg.timetoken === sentMessage.timetoken; });
                        expect(receivedMessage).toEqual(editedMessage);
                        unsubscribe();
                    });
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 2000); })];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, 30000);
    jest.retryTimes(3);
});
