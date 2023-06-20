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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.Message = void 0;
var types_1 = require("../types");
var mentions_utils_1 = require("../mentions-utils");
var Message = /** @class */ (function () {
    /** @internal */
    function Message(chat, params) {
        this.chat = chat;
        this.timetoken = params.timetoken;
        this.content = params.content;
        this.channelId = params.channelId;
        Object.assign(this, params);
    }
    Object.defineProperty(Message.prototype, "threadRootId", {
        get: function () {
            var _a;
            if (!((_a = this.actions) === null || _a === void 0 ? void 0 : _a["threadRootId"])) {
                return false;
            }
            return Object.keys(this.actions["threadRootId"])[0];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Message.prototype, "mentionedUsers", {
        get: function () {
            var _a;
            if ((_a = this.meta) === null || _a === void 0 ? void 0 : _a.mentionedUsers) {
                return this.meta.mentionedUsers;
            }
            return {};
        },
        enumerable: false,
        configurable: true
    });
    /** @internal */
    Message.fromDTO = function (chat, params) {
        var data = {
            timetoken: String(params.timetoken),
            content: params.message,
            channelId: params.channel,
            userId: "publisher" in params ? params.publisher : params.uuid,
            actions: "actions" in params ? params.actions : undefined,
            meta: "meta" in params ? params.meta : "userMetadata" in params ? params.userMetadata : undefined
        };
        return new Message(chat, data);
    };
    /** @internal */
    Message.prototype.clone = function (params) {
        var _a = this, timetoken = _a.timetoken, content = _a.content, channelId = _a.channelId, userId = _a.userId, actions = _a.actions;
        var data = Object.assign({}, { timetoken: timetoken, content: content, channelId: channelId, userId: userId, actions: actions }, params);
        return new Message(this.chat, data);
    };
    /** @internal */
    Message.prototype.assignAction = function (action) {
        var _a;
        var actionTimetoken = action.actionTimetoken, type = action.type, value = action.value, uuid = action.uuid;
        var newActions = this.actions || {};
        newActions[type] || (newActions[type] = {});
        (_a = newActions[type])[value] || (_a[value] = []);
        newActions[type][value] = __spreadArray(__spreadArray([], newActions[type][value], true), [{ uuid: uuid, actionTimetoken: actionTimetoken }], false);
        return newActions;
    };
    /** @internal */
    Message.prototype.filterAction = function (action) {
        var _a;
        var actionTimetoken = action.actionTimetoken, type = action.type, value = action.value, uuid = action.uuid;
        var newActions = this.actions || {};
        newActions[type] || (newActions[type] = {});
        (_a = newActions[type])[value] || (_a[value] = []);
        newActions[type][value] = newActions[type][value].filter(function (r) { return r.actionTimetoken !== actionTimetoken || r.uuid !== uuid; });
        return newActions;
    };
    /*
     * Updates
     */
    Message.streamUpdatesOn = function (messages, callback) {
        if (!messages.length)
            throw "Cannot stream message updates on an empty list";
        var listener = {
            messageAction: function (event) {
                var message = messages.find(function (msg) { return msg.timetoken === event.data.messageTimetoken; });
                if (!message)
                    return;
                if (message.channelId !== event.channel)
                    return;
                var actions;
                if (event.event === "added")
                    actions = message.assignAction(event.data);
                if (event.event === "removed")
                    actions = message.filterAction(event.data);
                var newMessage = message.clone({ actions: actions });
                var newMessages = messages.map(function (msg) {
                    return msg.timetoken === newMessage.timetoken ? newMessage : msg;
                });
                callback(newMessages);
            }
        };
        var chat = messages[0].chat;
        var removeListener = chat.addListener(listener);
        var subscriptions = messages
            .filter(function (m1, i) { return messages.findIndex(function (m2) { return m1.channelId === m2.channelId; }) === i; })
            .map(function (message) { return chat.subscribe(message.channelId); });
        return function () {
            removeListener();
            subscriptions.map(function (unsub) { return unsub(); });
        };
    };
    Message.prototype.streamUpdates = function (callback) {
        return Message.streamUpdatesOn([this], function (messages) { return callback(messages[0]); });
    };
    Object.defineProperty(Message.prototype, "text", {
        /*
         * Message text
         */
        get: function () {
            var _a;
            var type = types_1.MessageActionType.EDITED;
            var edits = (_a = this.actions) === null || _a === void 0 ? void 0 : _a[type];
            if (!edits)
                return this.content.text;
            var flatEdits = Object.entries(edits).map(function (_a) {
                var k = _a[0], v = _a[1];
                return (__assign({ value: k }, v[0]));
            });
            var lastEdit = flatEdits.reduce(function (a, b) { return (a.actionTimetoken > b.actionTimetoken ? a : b); });
            return lastEdit.value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Message.prototype, "linkedText", {
        get: function () {
            var _a;
            var type = types_1.MessageActionType.EDITED;
            var edits = (_a = this.actions) === null || _a === void 0 ? void 0 : _a[type];
            if (!edits)
                return mentions_utils_1.MentionsUtils.getLinkedText({ text: this.content.text, userCallback: this.chat.config.mentionedUserCallback, mentionedUsers: this.mentionedUsers });
            var flatEdits = Object.entries(edits).map(function (_a) {
                var k = _a[0], v = _a[1];
                return (__assign({ value: k }, v[0]));
            });
            var lastEdit = flatEdits.reduce(function (a, b) { return (a.actionTimetoken > b.actionTimetoken ? a : b); });
            return mentions_utils_1.MentionsUtils.getLinkedText({ text: lastEdit.value, userCallback: this.chat.config.mentionedUserCallback, mentionedUsers: this.mentionedUsers });
        },
        enumerable: false,
        configurable: true
    });
    Message.prototype.editText = function (newText) {
        return __awaiter(this, void 0, void 0, function () {
            var type, data, actions, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        type = types_1.MessageActionType.EDITED;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.chat.sdk.addMessageAction({
                                channel: this.channelId,
                                messageTimetoken: this.timetoken,
                                action: { type: type, value: newText }
                            })];
                    case 2:
                        data = (_a.sent()).data;
                        actions = this.assignAction(data);
                        return [2 /*return*/, this.clone({ actions: actions })];
                    case 3:
                        error_1 = _a.sent();
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Object.defineProperty(Message.prototype, "deleted", {
        /*
         * Deletions
         */
        get: function () {
            var _a;
            var type = types_1.MessageActionType.DELETED;
            return !!((_a = this.actions) === null || _a === void 0 ? void 0 : _a[type]);
        },
        enumerable: false,
        configurable: true
    });
    Message.prototype["delete"] = function (params) {
        if (params === void 0) { params = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var soft, type, data, actions, previousTimetoken, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        soft = params.soft;
                        type = types_1.MessageActionType.DELETED;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 8, , 9]);
                        if (!soft) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.chat.sdk.addMessageAction({
                                channel: this.channelId,
                                messageTimetoken: this.timetoken,
                                action: { type: type, value: type }
                            })];
                    case 2:
                        data = (_a.sent()).data;
                        actions = this.assignAction(data);
                        return [4 /*yield*/, this.deleteThread(params)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, this.clone({ actions: actions })];
                    case 4:
                        previousTimetoken = String(BigInt(this.timetoken) - BigInt(1));
                        return [4 /*yield*/, this.chat.sdk.deleteMessages({
                                channel: this.channelId,
                                start: previousTimetoken,
                                end: this.timetoken
                            })];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, this.deleteThread(params)];
                    case 6:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        error_2 = _a.sent();
                        throw error_2;
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    Object.defineProperty(Message.prototype, "reactions", {
        /**
         * Reactions
         */
        get: function () {
            var _a;
            var type = types_1.MessageActionType.REACTIONS;
            return ((_a = this.actions) === null || _a === void 0 ? void 0 : _a[type]) || {};
        },
        enumerable: false,
        configurable: true
    });
    Message.prototype.hasUserReaction = function (reaction) {
        var _this = this;
        var _a;
        return !!((_a = this.reactions[reaction]) === null || _a === void 0 ? void 0 : _a.find(function (r) { return r.uuid === _this.chat.sdk.getUUID(); }));
    };
    Message.prototype.toggleReaction = function (reaction) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var type, uuid, messageTimetoken, channel, value, actions, existingReaction, actionTimetoken, data, error_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        type = types_1.MessageActionType.REACTIONS;
                        uuid = this.chat.sdk.getUUID();
                        messageTimetoken = this.timetoken;
                        channel = this.channelId;
                        value = reaction;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, , 7]);
                        existingReaction = (_a = this.reactions[value]) === null || _a === void 0 ? void 0 : _a.find(function (r) { return r.uuid === uuid; });
                        if (!existingReaction) return [3 /*break*/, 3];
                        actionTimetoken = String(existingReaction.actionTimetoken);
                        return [4 /*yield*/, this.chat.sdk.removeMessageAction({ actionTimetoken: actionTimetoken, channel: channel, messageTimetoken: messageTimetoken })];
                    case 2:
                        _b.sent();
                        actions = this.filterAction({ actionTimetoken: actionTimetoken, messageTimetoken: messageTimetoken, type: type, uuid: uuid, value: value });
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, this.chat.sdk.addMessageAction({
                            channel: channel,
                            messageTimetoken: messageTimetoken,
                            action: { type: type, value: value }
                        })];
                    case 4:
                        data = (_b.sent()).data;
                        actions = this.assignAction(data);
                        _b.label = 5;
                    case 5: return [2 /*return*/, this.clone({ actions: actions })];
                    case 6:
                        error_3 = _b.sent();
                        throw error_3;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /*
     * Other
     */
    Message.prototype.forward = function (channelId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.chat.forwardMessage(this, channelId)];
            });
        });
    };
    Message.prototype.pin = function () {
        return __awaiter(this, void 0, void 0, function () {
            var channel;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.chat.getChannel(this.channelId)];
                    case 1:
                        channel = _a.sent();
                        return [4 /*yield*/, this.chat.pinMessageToChannel(this, channel)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Threads
     */
    Message.prototype.getThread = function () {
        return this.chat.getThreadChannel(this.channelId, this.timetoken);
    };
    /** @internal */
    Message.prototype.deleteThread = function (params) {
        if (params === void 0) { params = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var thread;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.threadRootId) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.getThread()];
                    case 1:
                        thread = _a.sent();
                        return [4 /*yield*/, thread["delete"](params)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return Message;
}());
exports.Message = Message;
