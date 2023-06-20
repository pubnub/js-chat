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
exports.extractMentionedUserIds = exports.waitForAllMessagesToBeDelivered = exports.initTestUser = exports.initTestChannel = exports.initTestChat = exports.createRandomUserId = void 0;
// lib/tests/testUtils.ts
var src_1 = require("../src");
var dotenv = require("dotenv");
var nanoid_1 = require("nanoid");
dotenv.config();
var createRandomUserId = function (prefix) {
    if (prefix === void 0) { prefix = "user"; }
    return "".concat(prefix, "_").concat((0, nanoid_1.nanoid)(8));
};
exports.createRandomUserId = createRandomUserId;
var initTestChat = function () {
    return src_1.Chat.init({
        publishKey: process.env.PUBLISH_KEY,
        subscribeKey: process.env.SUBSCRIBE_KEY,
        userId: process.env.USER_ID
    });
};
exports.initTestChat = initTestChat;
var initTestChannel = function (chat, channelName) {
    if (channelName === void 0) { channelName = "test-react-channel-C1"; }
    return __awaiter(void 0, void 0, void 0, function () {
        var channel;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, chat.getChannel(channelName)];
                case 1:
                    channel = _a.sent();
                    if (!!channel) return [3 /*break*/, 3];
                    return [4 /*yield*/, chat.createChannel(channelName, {
                            name: "test-channel"
                        })];
                case 2:
                    channel = _a.sent();
                    _a.label = 3;
                case 3: return [2 /*return*/, channel];
            }
        });
    });
};
exports.initTestChannel = initTestChannel;
var initTestUser = function (chat, userId) {
    if (userId === void 0) { userId = (0, exports.createRandomUserId)(); }
    return __awaiter(void 0, void 0, void 0, function () {
        var user;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, chat.getUser(userId)];
                case 1:
                    user = _a.sent();
                    if (!!user) return [3 /*break*/, 3];
                    return [4 /*yield*/, chat.createUser(userId, {
                            name: "Test User"
                        })];
                case 2:
                    user = _a.sent();
                    _a.label = 3;
                case 3: return [2 /*return*/, user];
            }
        });
    });
};
exports.initTestUser = initTestUser;
var waitForAllMessagesToBeDelivered = function (textMessages, messages) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, new Promise(function (resolveMainFunction) { return __awaiter(void 0, void 0, void 0, function () {
                    var i, allMessagesReceived;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                i = 0;
                                _a.label = 1;
                            case 1:
                                if (!(i < 3)) return [3 /*break*/, 5];
                                allMessagesReceived = textMessages.every(function (textMessage) {
                                    return messages.includes(textMessage);
                                });
                                if (!allMessagesReceived) return [3 /*break*/, 2];
                                return [3 /*break*/, 5];
                            case 2: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                            case 3:
                                _a.sent();
                                _a.label = 4;
                            case 4:
                                i++;
                                return [3 /*break*/, 1];
                            case 5:
                                resolveMainFunction();
                                return [2 /*return*/];
                        }
                    });
                }); })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.waitForAllMessagesToBeDelivered = waitForAllMessagesToBeDelivered;
var extractMentionedUserIds = function (messageText) {
    var regex = /@(\w+)(?!\.[^\s@])\b/g;
    var matches = messageText.match(regex);
    if (matches) {
        return matches.map(function (match) { return match.slice(1); });
    }
    return [];
};
exports.extractMentionedUserIds = extractMentionedUserIds;
