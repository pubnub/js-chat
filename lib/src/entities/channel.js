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
exports.Channel = void 0;
var message_1 = require("./message");
var membership_1 = require("./membership");
var constants_1 = require("../constants");
var thread_message_1 = require("./thread-message");
var mentions_utils_1 = require("../mentions-utils");
var Channel = /** @class */ (function () {
    /** @internal */
    function Channel(chat, params) {
        /** @internal */
        this.typingSent = false;
        /** @internal */
        this.typingIndicators = new Map();
        this.chat = chat;
        this.id = params.id;
        this.suggestedNames = new Map();
        Object.assign(this, params);
    }
    /** @internal */
    Channel.fromDTO = function (chat, params) {
        var data = {
            id: params.id,
            name: params.name || undefined,
            custom: params.custom || undefined,
            description: params.description || undefined,
            updated: params.updated || undefined,
            status: params.status || undefined,
            type: params.type || undefined
        };
        return new Channel(chat, data);
    };
    /*
     * CRUD
     */
    Channel.prototype.update = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.chat.updateChannel(this.id, data)];
            });
        });
    };
    Channel.prototype["delete"] = function (options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.chat.deleteChannel(this.id, options)];
            });
        });
    };
    /*
     * Updates
     */
    Channel.streamUpdatesOn = function (channels, callback) {
        if (!channels.length)
            throw "Cannot stream channel updates on an empty list";
        var listener = {
            objects: function (event) {
                if (event.message.type !== "channel")
                    return;
                var channel = channels.find(function (c) { return c.id === event.channel; });
                if (!channel)
                    return;
                var newChannel = Channel.fromDTO(channel.chat, event.message.data);
                var newChannels = channels.map(function (channel) {
                    return channel.id === newChannel.id ? newChannel : channel;
                });
                callback(newChannels);
            }
        };
        var chat = channels[0].chat;
        var removeListener = chat.addListener(listener);
        var subscriptions = channels.map(function (channel) { return chat.subscribe(channel.id); });
        return function () {
            removeListener();
            subscriptions.map(function (unsub) { return unsub(); });
        };
    };
    Channel.prototype.streamUpdates = function (callback) {
        return Channel.streamUpdatesOn([this], function (channels) { return callback(channels[0]); });
    };
    /*
     * Publishing
     */
    /** @internal */
    Channel.prototype.isThreadRoot = function () {
        return this.id.startsWith(constants_1.MESSAGE_THREAD_ID_PREFIX);
    };
    /** @internal */
    Channel.prototype.markMessageAsThreadRoot = function (timetoken) {
        var channelIdToSend = this.chat.getThreadId(this.id, timetoken);
        return this.chat.sdk.addMessageAction({
            channel: this.id,
            messageTimetoken: timetoken,
            action: {
                type: "threadRootId",
                value: channelIdToSend
            }
        });
    };
    Channel.prototype.sendText = function (text, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var mentionedUsers, rootMessage, rest, channelIdToSend, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        mentionedUsers = options.mentionedUsers, rootMessage = options.rootMessage, rest = __rest(options, ["mentionedUsers", "rootMessage"]);
                        channelIdToSend = this.id;
                        if (rootMessage && this.isThreadRoot()) {
                            throw "Only one level of thread nesting is allowed";
                        }
                        if (rootMessage && rootMessage instanceof thread_message_1.ThreadMessage) {
                            throw "rootMessage should be an instance of Message";
                        }
                        if (rootMessage && rootMessage.channelId !== this.id) {
                            throw "This 'rootMessage' you provided does not come from this channel";
                        }
                        if (!rootMessage) return [3 /*break*/, 2];
                        channelIdToSend = this.chat.getThreadId(this.id, rootMessage.timetoken);
                        if (!!rootMessage.threadRootId) return [3 /*break*/, 2];
                        return [4 /*yield*/, Promise.all([
                                this.markMessageAsThreadRoot(rootMessage.timetoken),
                                this.chat.createThread(this.id, rootMessage.timetoken),
                            ])];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [4 /*yield*/, this.chat.sdk.publish(__assign(__assign({}, rest), { channel: channelIdToSend, message: {
                                type: "text",
                                text: text
                            }, meta: __assign(__assign({}, (rest.meta || {})), { mentionedUsers: mentionedUsers }) }))];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4:
                        error_1 = _a.sent();
                        throw error_1;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    Channel.prototype.forwardMessage = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.chat.forwardMessage(message, this.id)];
            });
        });
    };
    /*
     * Typing indicator
     */
    /* @internal */
    Channel.prototype.sendTypingSignal = function (value) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.chat.sdk.signal({
                            channel: this.id,
                            message: {
                                type: "typing",
                                value: value
                            }
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Channel.prototype.startTyping = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.typingSent)
                            return [2 /*return*/];
                        this.typingSent = true;
                        this.typingSentTimer = setTimeout(function () { return (_this.typingSent = false); }, this.chat.config.typingTimeout - 1000);
                        return [4 /*yield*/, this.sendTypingSignal(true)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Channel.prototype.stopTyping = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        clearTimeout(this.typingSentTimer);
                        if (!this.typingSent)
                            return [2 /*return*/];
                        this.typingSent = false;
                        return [4 /*yield*/, this.sendTypingSignal(false)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Channel.prototype.getTyping = function (callback) {
        var _this = this;
        var listener = {
            signal: function (event) {
                var channel = event.channel, message = event.message, publisher = event.publisher;
                if (channel !== _this.id)
                    return;
                if (message.type !== "typing")
                    return;
                var timer = _this.typingIndicators.get(publisher);
                if (!message.value && timer) {
                    clearTimeout(timer);
                    _this.typingIndicators["delete"](publisher);
                }
                if (message.value && timer) {
                    clearTimeout(timer);
                    var newTimer = setTimeout(function () {
                        _this.typingIndicators["delete"](publisher);
                        callback(Array.from(_this.typingIndicators.keys()));
                    }, _this.chat.config.typingTimeout);
                    _this.typingIndicators.set(publisher, newTimer);
                }
                if (message.value && !timer) {
                    var newTimer = setTimeout(function () {
                        _this.typingIndicators["delete"](publisher);
                        callback(Array.from(_this.typingIndicators.keys()));
                    }, _this.chat.config.typingTimeout);
                    _this.typingIndicators.set(publisher, newTimer);
                }
                callback(Array.from(_this.typingIndicators.keys()));
            }
        };
        var removeListener = this.chat.addListener(listener);
        var unsubscribe = this.chat.subscribe(this.id);
        return function () {
            removeListener();
            unsubscribe();
        };
    };
    /*
     * Streaming messages
     */
    Channel.prototype.connect = function (callback) {
        var _this = this;
        var listener = {
            message: function (event) {
                var message = event.message, channel = event.channel;
                if (channel !== _this.id)
                    return;
                if (!["text"].includes(message.type))
                    return;
                callback(message_1.Message.fromDTO(_this.chat, event));
            }
        };
        var removeListener = this.chat.addListener(listener);
        var unsubscribe = this.chat.subscribe(this.id);
        return function () {
            removeListener();
            unsubscribe();
        };
    };
    /*
     * Presence
     */
    Channel.prototype.whoIsPresent = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.chat.whoIsPresent(this.id)];
            });
        });
    };
    Channel.prototype.isPresent = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.chat.isPresent(userId, this.id)];
            });
        });
    };
    Channel.prototype.getHistory = function (params) {
        var _a, _b;
        if (params === void 0) { params = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var options, response, error_2;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        options = {
                            channels: [this.id],
                            count: params.count || 25,
                            start: params.startTimetoken,
                            end: params.endTimetoken,
                            includeMessageActions: true,
                            includeMeta: true
                        };
                        return [4 /*yield*/, this.chat.sdk.fetchMessages(options)];
                    case 1:
                        response = _c.sent();
                        return [2 /*return*/, {
                                messages: ((_a = response.channels[this.id]) === null || _a === void 0 ? void 0 : _a.map(function (messageObject) {
                                    return message_1.Message.fromDTO(_this.chat, messageObject);
                                })) || [],
                                isMore: ((_b = response.channels[this.id]) === null || _b === void 0 ? void 0 : _b.length) === (params.count || 25)
                            }];
                    case 2:
                        error_2 = _c.sent();
                        throw error_2;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    Channel.prototype.getMessage = function (timetoken) {
        return __awaiter(this, void 0, void 0, function () {
            var previousTimetoken, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        previousTimetoken = String(BigInt(timetoken) + BigInt(1));
                        return [4 /*yield*/, this.getHistory({
                                endTimetoken: timetoken,
                                startTimetoken: previousTimetoken
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.messages[0]];
                }
            });
        });
    };
    Channel.prototype.join = function (callback, params) {
        if (params === void 0) { params = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var custom, rest, membershipsResponse, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        custom = params.custom, rest = __rest(params, ["custom"]);
                        return [4 /*yield*/, this.chat.sdk.objects.setMemberships(__assign(__assign({}, rest), { channels: [{ id: this.id, custom: custom }], include: {
                                    totalCount: true,
                                    customFields: true,
                                    channelFields: true,
                                    customChannelFields: true
                                }, filter: "channel.id == '".concat(this.id, "'") }))];
                    case 1:
                        membershipsResponse = _a.sent();
                        this.disconnect = this.connect(callback);
                        return [2 /*return*/, membership_1.Membership.fromMembershipDTO(this.chat, membershipsResponse.data[0], this.chat.currentUser)];
                    case 2:
                        error_3 = _a.sent();
                        throw error_3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    Channel.prototype.leave = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.disconnect)
                            this.disconnect();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.chat.sdk.objects.removeMemberships({
                                channels: [this.id]
                            })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3:
                        error_4 = _a.sent();
                        throw error_4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Channel.prototype.getMembers = function (params) {
        if (params === void 0) { params = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var membersResponse;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.chat.sdk.objects.getChannelMembers(__assign(__assign({}, params), { channel: this.id, include: {
                                totalCount: true,
                                customFields: true,
                                UUIDFields: true,
                                customUUIDFields: true
                            } }))];
                    case 1:
                        membersResponse = _a.sent();
                        return [2 /*return*/, {
                                page: {
                                    next: membersResponse.next,
                                    prev: membersResponse.prev
                                },
                                total: membersResponse.totalCount,
                                status: membersResponse.status,
                                members: membersResponse.data.map(function (m) { return membership_1.Membership.fromChannelMemberDTO(_this.chat, m, _this); })
                            }];
                }
            });
        });
    };
    Channel.prototype.invite = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            var channelMembers, response, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.getMembers({ filter: "uuid.id == '".concat(user.id, "'") })
                            // already a member
                        ];
                    case 1:
                        channelMembers = _a.sent();
                        // already a member
                        if (channelMembers.members.length) {
                            return [2 /*return*/, channelMembers.members[0]];
                        }
                        return [4 /*yield*/, this.chat.sdk.objects.setMemberships({
                                uuid: user.id,
                                channels: [this.id],
                                include: {
                                    totalCount: true,
                                    customFields: true,
                                    channelFields: true,
                                    customChannelFields: true
                                },
                                filter: "channel.id == '".concat(this.id, "'")
                            })];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, membership_1.Membership.fromMembershipDTO(this.chat, response.data[0], user)];
                    case 3:
                        error_5 = _a.sent();
                        throw error_5;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Channel.prototype.pinMessage = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.chat.pinMessageToChannel(message, this)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, Channel.fromDTO(this.chat, response.data)];
                }
            });
        });
    };
    Channel.prototype.unpinMessage = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.chat.pinMessageToChannel(null, this)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, Channel.fromDTO(this.chat, response.data)];
                }
            });
        });
    };
    Channel.prototype.getPinnedMessage = function () {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var pinnedMessageTimetoken, pinnedMessageChannelID, threadChannel, error_6;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        pinnedMessageTimetoken = (_a = this.custom) === null || _a === void 0 ? void 0 : _a["pinnedMessageTimetoken"];
                        pinnedMessageChannelID = (_b = this.custom) === null || _b === void 0 ? void 0 : _b["pinnedMessageChannelID"];
                        if (!pinnedMessageTimetoken || !pinnedMessageChannelID) {
                            return [2 /*return*/, null];
                        }
                        if (pinnedMessageChannelID === this.id) {
                            return [2 /*return*/, this.getMessage(String(pinnedMessageTimetoken))];
                        }
                        return [4 /*yield*/, this.chat.getChannel(String(pinnedMessageChannelID))];
                    case 1:
                        threadChannel = _c.sent();
                        if (!threadChannel) {
                            throw "The thread channel does not exist";
                        }
                        return [2 /*return*/, threadChannel.getMessage(String(pinnedMessageTimetoken))];
                    case 2:
                        error_6 = _c.sent();
                        console.error(error_6);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    Channel.prototype.getSuggestedChannelMembers = function (text, options) {
        if (options === void 0) { options = { limit: 10 }; }
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, membersResponse;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cacheKey = mentions_utils_1.MentionsUtils.getPhraseToLookFor(text);
                        if (!cacheKey) {
                            return [2 /*return*/, []];
                        }
                        if (this.suggestedNames.get(cacheKey)) {
                            return [2 /*return*/, this.suggestedNames.get(cacheKey)];
                        }
                        return [4 /*yield*/, this.getMembers({
                                filter: "uuid.name LIKE \"".concat(cacheKey, "*\""),
                                limit: options.limit
                            })];
                    case 1:
                        membersResponse = _a.sent();
                        this.suggestedNames.set(cacheKey, membersResponse.members);
                        return [2 /*return*/, this.suggestedNames.get(cacheKey)];
                }
            });
        });
    };
    return Channel;
}());
exports.Channel = Channel;
