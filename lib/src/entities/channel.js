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
exports.Channel = void 0;
var message_1 = require("./message");
var Channel = /** @class */ (function () {
    function Channel(chat, params) {
        this.listeners = [];
        this.subscribed = false;
        this.typingSent = false;
        this.typingIndicators = [];
        this.chat = chat;
        this.id = params.id;
        this.name = params.name;
        Object.assign(this, params);
    }
    Channel.fromDTO = function (chat, params) {
        var data = {
            id: params.id,
            name: params.name || undefined,
            custom: params.custom || undefined,
            description: params.description || undefined,
            eTag: params.eTag,
            updated: params.updated
        };
        return new Channel(chat, data);
    };
    Channel.prototype.sendText = function (text, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.chat.sdk.publish(__assign({ channel: this.id, message: {
                                type: "text",
                                text: text
                            } }, options))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Channel.prototype.sendTypingSignal = function (value) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.chat.sdk.signal({
                            channel: this.id,
                            message: {
                                type: "typing",
                                value: value,
                                name: (_a = this.chat.getChatUser()) === null || _a === void 0 ? void 0 : _a.name
                            }
                        })];
                    case 1: return [2 /*return*/, _b.sent()];
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
        var typingListener = {
            signal: function (event) {
                var channel = event.channel, message = event.message, publisher = event.publisher;
                if (channel !== _this.id)
                    return;
                if (message.type !== "typing")
                    return;
                var indicator = _this.typingIndicators.find(function (t) { return t.userId === publisher; });
                if (!message.value && indicator) {
                    _this.typingIndicators = _this.typingIndicators.filter(function (t) { return t.userId !== publisher; });
                    clearTimeout(indicator.timer);
                }
                if (message.value && indicator) {
                    clearTimeout(indicator.timer);
                    indicator.timer = setTimeout(function () {
                        _this.typingIndicators = _this.typingIndicators.filter(function (t) { return t.userId !== publisher; });
                        callback(_this.typingIndicators.map(function (t) { return ({ userId: t.userId, name: t.name }); }));
                    }, _this.chat.config.typingTimeout);
                }
                if (message.value && !indicator) {
                    _this.typingIndicators = __spreadArray(__spreadArray([], _this.typingIndicators, true), [
                        {
                            userId: publisher,
                            name: message.name,
                            timer: setTimeout(function () {
                                _this.typingIndicators = _this.typingIndicators.filter(function (t) { return t.userId !== publisher; });
                                callback(_this.typingIndicators.map(function (t) { return ({ userId: t.userId, name: t.name }); }));
                            }, _this.chat.config.typingTimeout)
                        },
                    ], false);
                }
                callback(_this.typingIndicators.map(function (t) { return ({ userId: t.userId, name: t.name }); }));
            }
        };
        this.listeners.push(typingListener);
        this.chat.sdk.addListener(typingListener);
        if (!this.subscribed)
            this.chat.sdk.subscribe({ channels: [this.id] });
    };
    Channel.prototype.connect = function (callback) {
        var _this = this;
        var messageListener = {
            message: function (event) {
                var message = event.message, channel = event.channel;
                if (channel !== _this.id)
                    return;
                if (!["text"].includes(message.type))
                    return;
                callback(new message_1.Message({
                    sdk: _this.chat.sdk,
                    timetoken: event.timetoken,
                    content: event.message
                }));
            }
        };
        this.listeners.push(messageListener);
        this.chat.sdk.addListener(messageListener);
        if (!this.subscribed)
            this.chat.sdk.subscribe({ channels: [this.id] });
    };
    Channel.prototype.disconnect = function () {
        var _this = this;
        this.listeners.forEach(function (listener) { return _this.chat.sdk.removeListener(listener); });
        this.listeners = [];
        if (this.subscribed)
            this.chat.sdk.unsubscribe({ channels: [this.id] });
    };
    return Channel;
}());
exports.Channel = Channel;
