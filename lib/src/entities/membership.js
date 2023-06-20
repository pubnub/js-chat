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
exports.Membership = void 0;
var channel_1 = require("./channel");
var user_1 = require("./user");
var Membership = /** @class */ (function () {
    /** @internal */
    function Membership(chat, params) {
        this.chat = chat;
        this.channel = params.channel;
        this.user = params.user;
        this.custom = params.custom;
    }
    /** @internal */
    Membership.fromMembershipDTO = function (chat, channelMembershipObject, user) {
        var data = {
            channel: channel_1.Channel.fromDTO(chat, channelMembershipObject.channel),
            user: user,
            custom: channelMembershipObject.custom
        };
        return new Membership(chat, data);
    };
    /** @internal */
    Membership.fromChannelMemberDTO = function (chat, userMembershipObject, channel) {
        var data = {
            user: user_1.User.fromDTO(chat, userMembershipObject.uuid),
            channel: channel,
            custom: userMembershipObject.custom
        };
        return new Membership(chat, data);
    };
    /** @internal */
    Membership.prototype.exists = function () {
        return __awaiter(this, void 0, void 0, function () {
            var membershipsResponse;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.chat.sdk.objects.getMemberships({
                            uuid: this.user.id,
                            filter: "channel.id == '".concat(this.channel.id, "'")
                        })];
                    case 1:
                        membershipsResponse = _a.sent();
                        return [2 /*return*/, !!membershipsResponse.data.length];
                }
            });
        });
    };
    Membership.prototype.update = function (_a) {
        var custom = _a.custom;
        return __awaiter(this, void 0, void 0, function () {
            var membershipsResponse, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.exists()];
                    case 1:
                        // check if membership exists before updating it
                        if (!(_b.sent())) {
                            throw "No such membership exists";
                        }
                        return [4 /*yield*/, this.chat.sdk.objects.setMemberships({
                                uuid: this.user.id,
                                channels: [{ id: this.channel.id, custom: custom }],
                                include: {
                                    totalCount: true,
                                    customFields: true,
                                    channelFields: true,
                                    customChannelFields: true
                                },
                                filter: "channel.id == '".concat(this.channel.id, "'")
                            })];
                    case 2:
                        membershipsResponse = _b.sent();
                        return [2 /*return*/, Membership.fromMembershipDTO(this.chat, membershipsResponse.data[0], this.user)];
                    case 3:
                        error_1 = _b.sent();
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /*
     * Updates
     */
    Membership.streamUpdatesOn = function (memberships, callback) {
        if (!memberships.length)
            throw "Cannot stream membership updates on an empty list";
        var listener = {
            objects: function (event) {
                if (event.message.type !== "membership")
                    return;
                var membership = memberships.find(function (m) { return m.channel.id === event.channel && m.user.id === event.message.data.uuid.id; });
                if (!membership)
                    return;
                var newMembership = new Membership(membership.chat, {
                    user: membership.user,
                    channel: membership.channel,
                    custom: event.message.data.custom
                });
                var newMemberships = memberships.map(function (membership) {
                    return membership.channel.id === newMembership.channel.id &&
                        membership.user.id === newMembership.user.id
                        ? newMembership
                        : membership;
                });
                callback(newMemberships);
            }
        };
        var chat = memberships[0].chat;
        var removeListener = chat.addListener(listener);
        var subscriptions = memberships.map(function (membership) { return chat.subscribe(membership.channel.id); });
        return function () {
            removeListener();
            subscriptions.map(function (unsub) { return unsub(); });
        };
    };
    Membership.prototype.streamUpdates = function (callback) {
        return Membership.streamUpdatesOn([this], function (memberships) { return callback(memberships[0]); });
    };
    Object.defineProperty(Membership.prototype, "lastReadMessageTimetoken", {
        /*
         * Unread message counts
         */
        get: function () {
            var _a;
            return (_a = this.custom) === null || _a === void 0 ? void 0 : _a.lastReadMessageTimetoken;
        },
        enumerable: false,
        configurable: true
    });
    Membership.prototype.setLastReadMessage = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    return [2 /*return*/, this.update({
                            custom: __assign(__assign({}, this.custom), { lastReadMessageTimetoken: message.timetoken })
                        })];
                }
                catch (error) {
                    throw error;
                }
                return [2 /*return*/];
            });
        });
    };
    Membership.prototype.getUnreadMessagesCount = function () {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var timetoken, response, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 5, , 6]);
                        return [4 /*yield*/, this.lastReadMessageTimetoken];
                    case 1:
                        timetoken = _b.sent();
                        if (!timetoken) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.chat.sdk.messageCounts({
                                channels: [this.channel.id],
                                channelTimetokens: [String(timetoken)]
                            })];
                    case 2:
                        response = _b.sent();
                        return [2 /*return*/, (_a = response.channels) === null || _a === void 0 ? void 0 : _a[this.channel.id]];
                    case 3: return [2 /*return*/, false];
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_2 = _b.sent();
                        throw error_2;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    return Membership;
}());
exports.Membership = Membership;
