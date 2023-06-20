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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
exports.__esModule = true;
exports.Chat = void 0;
var pubnub_1 = require("pubnub");
var channel_1 = require("./channel");
var user_1 = require("./user");
var membership_1 = require("./membership");
var constants_1 = require("../constants");
var thread_channel_1 = require("./thread-channel");
var mentions_utils_1 = require("../mentions-utils");
var Chat = /** @class */ (function () {
    function Chat(params) {
        var saveDebugLog = params.saveDebugLog, typingTimeout = params.typingTimeout, storeUserActivityInterval = params.storeUserActivityInterval, storeUserActivityTimestamps = params.storeUserActivityTimestamps, mentionedUserCallback = params.mentionedUserCallback, pubnubConfig = __rest(params, ["saveDebugLog", "typingTimeout", "storeUserActivityInterval", "storeUserActivityTimestamps", "mentionedUserCallback"]);
        if (storeUserActivityInterval && storeUserActivityInterval < 600000) {
            throw "storeUserActivityInterval must be at least 600000ms";
        }
        this.sdk = new pubnub_1["default"](pubnubConfig);
        this.subscriptions = {};
        this.suggestedNamesCache = new Map();
        this.config = {
            saveDebugLog: saveDebugLog || false,
            typingTimeout: typingTimeout || 5000,
            storeUserActivityInterval: storeUserActivityInterval || 600000,
            storeUserActivityTimestamps: storeUserActivityTimestamps || false,
            mentionedUserCallback: mentionedUserCallback ||
                function (userId, mentionedName) {
                    return "<a href=\"https://pubnub.com/".concat(userId, "\">@").concat(mentionedName, "</a> ");
                }
        };
    }
    Chat.init = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var chat, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        chat = new Chat(params);
                        _a = chat;
                        return [4 /*yield*/, chat.getUser(chat.sdk.getUUID())];
                    case 1:
                        _b = (_c.sent());
                        if (_b) return [3 /*break*/, 3];
                        return [4 /*yield*/, chat.createUser(chat.sdk.getUUID(), { name: chat.sdk.getUUID() })];
                    case 2:
                        _b = (_c.sent());
                        _c.label = 3;
                    case 3:
                        _a.user = _b;
                        if (params.storeUserActivityTimestamps) {
                            chat.storeUserActivityTimestamp();
                        }
                        return [2 /*return*/, chat];
                }
            });
        });
    };
    /* @internal */
    Chat.prototype.subscribe = function (channel) {
        var _this = this;
        var _a;
        var subscriptionId = Math.floor(Math.random() * Date.now()).toString(36);
        var channelSubIds = ((_a = this.subscriptions)[channel] || (_a[channel] = new Set()));
        if (!channelSubIds.size)
            this.sdk.subscribe({ channels: [channel] });
        channelSubIds.add(subscriptionId);
        return function () {
            if (!channelSubIds || !channelSubIds.has(subscriptionId))
                return;
            channelSubIds["delete"](subscriptionId);
            if (!channelSubIds.size)
                _this.sdk.unsubscribe({ channels: [channel] });
        };
    };
    /* @internal */
    Chat.prototype.addListener = function (listener) {
        var _this = this;
        this.sdk.addListener(listener);
        return function () {
            _this.sdk.removeListener(listener);
        };
    };
    Object.defineProperty(Chat.prototype, "currentUser", {
        /**
         * Current user
         */
        get: function () {
            return this.user;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Users
     */
    Chat.prototype.getUser = function (id) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var response, error_1, e;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!id.length)
                            throw "ID is required";
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.sdk.objects.getUUIDMetadata({ uuid: id })];
                    case 2:
                        response = _c.sent();
                        return [2 /*return*/, user_1.User.fromDTO(this, response.data)];
                    case 3:
                        error_1 = _c.sent();
                        e = error_1;
                        if (((_b = (_a = e === null || e === void 0 ? void 0 : e.status) === null || _a === void 0 ? void 0 : _a.errorData) === null || _b === void 0 ? void 0 : _b.status) === 404)
                            return [2 /*return*/, null];
                        else
                            throw error_1;
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Chat.prototype.createUser = function (id, data) {
        return __awaiter(this, void 0, void 0, function () {
            var existingUser, response, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!id.length)
                            throw "ID is required";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.getUser(id)];
                    case 2:
                        existingUser = _a.sent();
                        if (existingUser)
                            throw "User with this ID already exists";
                        return [4 /*yield*/, this.sdk.objects.setUUIDMetadata({ uuid: id, data: data })];
                    case 3:
                        response = _a.sent();
                        return [2 /*return*/, user_1.User.fromDTO(this, response.data)];
                    case 4:
                        error_2 = _a.sent();
                        throw error_2;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    Chat.prototype.updateUser = function (id, data) {
        return __awaiter(this, void 0, void 0, function () {
            var existingUser, response, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!id.length)
                            throw "ID is required";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.getUser(id)];
                    case 2:
                        existingUser = _a.sent();
                        if (!existingUser)
                            throw "User with this ID does not exist";
                        return [4 /*yield*/, this.sdk.objects.setUUIDMetadata({ uuid: id, data: data })];
                    case 3:
                        response = _a.sent();
                        return [2 /*return*/, user_1.User.fromDTO(this, response.data)];
                    case 4:
                        error_3 = _a.sent();
                        throw error_3;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    Chat.prototype.deleteUser = function (id, params) {
        if (params === void 0) { params = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var soft, response, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!id.length)
                            throw "ID is required";
                        soft = params.soft;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        if (!soft) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.sdk.objects.setUUIDMetadata({
                                uuid: id,
                                data: { status: "deleted" }
                            })];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, user_1.User.fromDTO(this, response.data)];
                    case 3: return [4 /*yield*/, this.sdk.objects.removeUUIDMetadata({ uuid: id })];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_4 = _a.sent();
                        throw error_4;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    Chat.prototype.getUsers = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var mandatoryOptions, options, response, error_5;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mandatoryOptions = {
                            include: {
                                totalCount: true,
                                customFields: true
                            }
                        };
                        options = Object.assign({}, params, mandatoryOptions);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.sdk.objects.getAllUUIDMetadata(options)];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, {
                                users: response.data.map(function (u) { return user_1.User.fromDTO(_this, u); }),
                                page: {
                                    next: response.next,
                                    prev: response.prev
                                },
                                total: response.totalCount
                            }];
                    case 3:
                        error_5 = _a.sent();
                        throw error_5;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Message threads
     */
    /** @internal */
    Chat.prototype.getThreadId = function (channelId, messageId) {
        return "".concat(constants_1.MESSAGE_THREAD_ID_PREFIX, "_").concat(channelId, "_").concat(messageId);
    };
    /** @internal */
    Chat.prototype.getThreadChannel = function (parentChannelId, timetoken) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var threadChannelId, response, error_6, e;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!parentChannelId.length)
                            throw "parentChannelId is required";
                        if (!timetoken.length)
                            throw "timetoken is required";
                        threadChannelId = this.getThreadId(parentChannelId, timetoken);
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.sdk.objects.getChannelMetadata({
                                channel: threadChannelId
                            })];
                    case 2:
                        response = _c.sent();
                        return [2 /*return*/, thread_channel_1.ThreadChannel.fromDTO(this, __assign(__assign({}, response.data), { parentChannelId: parentChannelId }))];
                    case 3:
                        error_6 = _c.sent();
                        e = error_6;
                        if (((_b = (_a = e === null || e === void 0 ? void 0 : e.status) === null || _a === void 0 ? void 0 : _a.errorData) === null || _b === void 0 ? void 0 : _b.status) === 404) {
                            throw "This message is not a thread";
                        }
                        else
                            throw error_6;
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /** @internal */
    Chat.prototype.createThread = function (parentChannelId, timetoken) {
        return __awaiter(this, void 0, void 0, function () {
            var threadChannelId, response, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        threadChannelId = this.getThreadId(parentChannelId, timetoken);
                        return [4 /*yield*/, this.sdk.objects.setChannelMetadata({
                                channel: threadChannelId,
                                data: {
                                    description: "Thread on channel ".concat(parentChannelId, " with message timetoken ").concat(timetoken)
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, thread_channel_1.ThreadChannel.fromDTO(this, __assign(__assign({}, response.data), { parentChannelId: parentChannelId }))];
                    case 2:
                        e_1 = _a.sent();
                        console.error(e_1);
                        throw e_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     *  Channels
     */
    Chat.prototype.getChannel = function (id) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var response, error_7, e;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!id.length)
                            throw "ID is required";
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.sdk.objects.getChannelMetadata({
                                channel: id
                            })];
                    case 2:
                        response = _c.sent();
                        return [2 /*return*/, channel_1.Channel.fromDTO(this, response.data)];
                    case 3:
                        error_7 = _c.sent();
                        e = error_7;
                        if (((_b = (_a = e === null || e === void 0 ? void 0 : e.status) === null || _a === void 0 ? void 0 : _a.errorData) === null || _b === void 0 ? void 0 : _b.status) === 404)
                            return [2 /*return*/, null];
                        else
                            throw error_7;
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Chat.prototype.updateChannel = function (id, data) {
        return __awaiter(this, void 0, void 0, function () {
            var existingChannel, response, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!id.length)
                            throw "ID is required";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.getChannel(id)];
                    case 2:
                        existingChannel = _a.sent();
                        if (!existingChannel)
                            throw "Channel with this ID does not exist";
                        return [4 /*yield*/, this.sdk.objects.setChannelMetadata({
                                channel: id,
                                data: data
                            })];
                    case 3:
                        response = _a.sent();
                        return [2 /*return*/, channel_1.Channel.fromDTO(this, response.data)];
                    case 4:
                        e_2 = _a.sent();
                        console.error(e_2);
                        throw e_2;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    Chat.prototype.createChannel = function (id, data) {
        return __awaiter(this, void 0, void 0, function () {
            var existingChannel, response, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!id.length)
                            throw "ID is required";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.getChannel(id)];
                    case 2:
                        existingChannel = _a.sent();
                        if (existingChannel)
                            throw "Channel with this ID already exists";
                        return [4 /*yield*/, this.sdk.objects.setChannelMetadata({
                                channel: id,
                                data: data
                            })];
                    case 3:
                        response = _a.sent();
                        return [2 /*return*/, channel_1.Channel.fromDTO(this, response.data)];
                    case 4:
                        e_3 = _a.sent();
                        console.error(e_3);
                        throw e_3;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    Chat.prototype.getChannels = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var mandatoryOptions, options, response, error_8;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mandatoryOptions = {
                            include: {
                                totalCount: true,
                                customFields: true
                            }
                        };
                        options = Object.assign({}, params, mandatoryOptions);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.sdk.objects.getAllChannelMetadata(options)];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, {
                                channels: response.data.map(function (u) { return channel_1.Channel.fromDTO(_this, u); }),
                                page: {
                                    next: response.next,
                                    prev: response.prev
                                },
                                total: response.totalCount
                            }];
                    case 3:
                        error_8 = _a.sent();
                        throw error_8;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Chat.prototype.deleteChannel = function (id, params) {
        if (params === void 0) { params = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var soft, response, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!id.length)
                            throw "ID is required";
                        soft = params.soft;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        if (!soft) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.sdk.objects.setChannelMetadata({
                                channel: id,
                                data: { status: "deleted" }
                            })];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, channel_1.Channel.fromDTO(this, response.data)];
                    case 3: return [4 /*yield*/, this.sdk.objects.removeChannelMetadata({ channel: id })];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_9 = _a.sent();
                        throw error_9;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     *  Presence
     */
    Chat.prototype.wherePresent = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!id.length)
                            throw "ID is required";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.sdk.whereNow({ uuid: id })];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, response.channels];
                    case 3:
                        error_10 = _a.sent();
                        throw error_10;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Chat.prototype.whoIsPresent = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!id.length)
                            throw "ID is required";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.sdk.hereNow({ channels: [id] })];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, response.channels[id].occupants.map(function (u) { return u.uuid; })];
                    case 3:
                        error_11 = _a.sent();
                        throw error_11;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Chat.prototype.isPresent = function (userId, channelId) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_12;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!userId.length)
                            throw "User ID is required";
                        if (!channelId.length)
                            throw "Channel ID is required";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.sdk.whereNow({ uuid: userId })];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, response.channels.includes(channelId)];
                    case 3:
                        error_12 = _a.sent();
                        throw error_12;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Messages
     */
    /** @internal */
    Chat.prototype.forwardMessage = function (message, channelId) {
        return __awaiter(this, void 0, void 0, function () {
            var existingChannel, error_13;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!channelId)
                            throw "Channel ID is required";
                        if (!message)
                            throw "Message is required";
                        if (message.channelId === channelId)
                            throw "You cannot forward the message to the same channel";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.getChannel(channelId)];
                    case 2:
                        existingChannel = _a.sent();
                        if (!existingChannel)
                            throw "Channel with this ID does not exist";
                        return [4 /*yield*/, existingChannel.sendText(message.content.text, {
                                meta: __assign(__assign({}, (message.meta || {})), { originalPublisher: message.userId })
                            })];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_13 = _a.sent();
                        throw error_13;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /** @internal */
    Chat.prototype.pinMessageToChannel = function (message, channel) {
        var customMetadataToSet = __assign({}, (channel.custom || {}));
        if (!message) {
            delete customMetadataToSet.pinnedMessageTimetoken;
            delete customMetadataToSet.pinnedMessageChannelID;
        }
        else {
            customMetadataToSet.pinnedMessageTimetoken = message.timetoken;
            customMetadataToSet.pinnedMessageChannelID = message.channelId;
        }
        return this.sdk.objects.setChannelMetadata({
            channel: channel.id,
            data: {
                custom: customMetadataToSet
            }
        });
    };
    /**
     * Save last activity timestamp
     */
    /** @internal */
    Chat.prototype.saveTimeStampFunc = function () {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.sdk.objects.setUUIDMetadata({
                            uuid: this.sdk.getUUID(),
                            data: {
                                custom: __assign(__assign({}, (((_a = this.user) === null || _a === void 0 ? void 0 : _a.custom) || {})), { lastActiveTimestamp: new Date().getTime() })
                            }
                        })];
                    case 1:
                        response = _b.sent();
                        this.user = user_1.User.fromDTO(this, response.data);
                        return [2 /*return*/];
                }
            });
        });
    };
    /** @internal */
    Chat.prototype.runSaveTimestampInterval = function () {
        var _this = this;
        this.saveTimeStampFunc();
        this.lastSavedActivityInterval = setInterval(function () {
            _this.saveTimeStampFunc();
        }, this.config.storeUserActivityInterval);
    };
    /** @internal */
    Chat.prototype.storeUserActivityTimestamp = function () {
        return __awaiter(this, void 0, void 0, function () {
            var user, currentTime, elapsedTimeSinceLastCheck, remainingTime, error_14;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.lastSavedActivityInterval) {
                            clearInterval(this.lastSavedActivityInterval);
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.getUser(this.sdk.getUUID())];
                    case 2:
                        user = _a.sent();
                        if (!user || !user.lastActiveTimestamp) {
                            this.runSaveTimestampInterval();
                            return [2 /*return*/];
                        }
                        currentTime = new Date().getTime();
                        elapsedTimeSinceLastCheck = currentTime - user.lastActiveTimestamp;
                        if (elapsedTimeSinceLastCheck >= this.config.storeUserActivityInterval) {
                            this.runSaveTimestampInterval();
                            return [2 /*return*/];
                        }
                        remainingTime = this.config.storeUserActivityInterval - elapsedTimeSinceLastCheck;
                        setTimeout(function () {
                            _this.runSaveTimestampInterval();
                        }, remainingTime);
                        return [3 /*break*/, 4];
                    case 3:
                        error_14 = _a.sent();
                        throw error_14;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Chat.prototype.createDirectConversation = function (_a) {
        var user = _a.user, channelData = _a.channelData, _b = _a.membershipData, membershipData = _b === void 0 ? {} : _b;
        return __awaiter(this, void 0, void 0, function () {
            var sortedUsers, channelName, channel, _c, custom, rest, hostMembershipPromise, _d, hostMembershipResponse, inviteeMembership, error_15;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 5, , 6]);
                        if (!this.user) {
                            throw "Chat user is not set. Set them by calling setChatUser on the Chat instance.";
                        }
                        sortedUsers = [this.user.id, user.id].sort();
                        channelName = "direct.".concat(sortedUsers[0], "&").concat(sortedUsers[1]);
                        return [4 /*yield*/, this.getChannel(channelName)];
                    case 1:
                        _c = (_e.sent());
                        if (_c) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.createChannel(channelName, channelData)];
                    case 2:
                        _c = (_e.sent());
                        _e.label = 3;
                    case 3:
                        channel = _c;
                        custom = membershipData.custom, rest = __rest(membershipData, ["custom"]);
                        hostMembershipPromise = this.sdk.objects.setMemberships(__assign(__assign({}, rest), { channels: [{ id: channel.id, custom: custom }], include: {
                                totalCount: true,
                                customFields: true,
                                channelFields: true,
                                customChannelFields: true
                            }, filter: "channel.id == '".concat(channel.id, "'") }));
                        return [4 /*yield*/, Promise.all([
                                hostMembershipPromise,
                                channel.invite(user),
                            ])];
                    case 4:
                        _d = _e.sent(), hostMembershipResponse = _d[0], inviteeMembership = _d[1];
                        return [2 /*return*/, {
                                channel: channel,
                                hostMembership: membership_1.Membership.fromMembershipDTO(this, hostMembershipResponse.data[0], this.user),
                                inviteeMembership: inviteeMembership
                            }];
                    case 5:
                        error_15 = _e.sent();
                        throw error_15;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    Chat.prototype.getSuggestedGlobalUsers = function (text, options) {
        if (options === void 0) { options = { limit: 10 }; }
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, usersResponse;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cacheKey = mentions_utils_1.MentionsUtils.getPhraseToLookFor(text);
                        if (!cacheKey) {
                            return [2 /*return*/, []];
                        }
                        if (this.suggestedNamesCache.get(cacheKey)) {
                            return [2 /*return*/, this.suggestedNamesCache.get(cacheKey)];
                        }
                        return [4 /*yield*/, this.getUsers({
                                filter: "name LIKE \"".concat(cacheKey, "*\""),
                                limit: options.limit
                            })];
                    case 1:
                        usersResponse = _a.sent();
                        this.suggestedNamesCache.set(cacheKey, usersResponse.users);
                        return [2 /*return*/, this.suggestedNamesCache.get(cacheKey)];
                }
            });
        });
    };
    return Chat;
}());
exports.Chat = Chat;
