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
exports.User = void 0;
var membership_1 = require("./membership");
var User = /** @class */ (function () {
    /** @internal */
    function User(chat, params) {
        this.chat = chat;
        this.id = params.id;
        Object.assign(this, params);
    }
    /** @internal */
    User.fromDTO = function (chat, params) {
        var _a;
        var data = {
            id: params.id,
            name: params.name || undefined,
            externalId: params.externalId || undefined,
            profileUrl: params.profileUrl || undefined,
            email: params.email || undefined,
            custom: params.custom || undefined,
            updated: params.updated || undefined,
            status: params.status || undefined,
            type: params.type || undefined,
            lastActiveTimestamp: ((_a = params.custom) === null || _a === void 0 ? void 0 : _a.lastActiveTimestamp) || undefined
        };
        return new User(chat, data);
    };
    /*
     * CRUD
     */
    User.prototype.update = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.chat.updateUser(this.id, data)];
            });
        });
    };
    User.prototype["delete"] = function (options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.chat.deleteUser(this.id, options)];
            });
        });
    };
    /*
     * Updates
     */
    User.streamUpdatesOn = function (users, callback) {
        if (!users.length)
            throw "Cannot stream user updates on an empty list";
        var listener = {
            objects: function (event) {
                if (event.message.type !== "uuid")
                    return;
                var user = users.find(function (c) { return c.id === event.channel; });
                if (!user)
                    return;
                var newUser = User.fromDTO(user.chat, event.message.data);
                var newUsers = users.map(function (user) { return (user.id === newUser.id ? newUser : user); });
                callback(newUsers);
            }
        };
        var chat = users[0].chat;
        var removeListener = chat.addListener(listener);
        var subscriptions = users.map(function (user) { return chat.subscribe(user.id); });
        return function () {
            removeListener();
            subscriptions.map(function (unsub) { return unsub(); });
        };
    };
    User.prototype.streamUpdates = function (callback) {
        return User.streamUpdatesOn([this], function (users) { return callback(users[0]); });
    };
    /*
     * Presence
     */
    User.prototype.wherePresent = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.chat.wherePresent(this.id)];
            });
        });
    };
    User.prototype.isPresentOn = function (channelId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.chat.isPresent(this.id, channelId)];
            });
        });
    };
    User.prototype.getMemberships = function (params) {
        if (params === void 0) { params = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var membershipsResponse;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.chat.sdk.objects.getMemberships(__assign(__assign({}, params), { include: {
                                totalCount: true,
                                customFields: true,
                                channelFields: true,
                                customChannelFields: true
                            } }))];
                    case 1:
                        membershipsResponse = _a.sent();
                        return [2 /*return*/, {
                                page: {
                                    next: membershipsResponse.next,
                                    prev: membershipsResponse.prev
                                },
                                total: membershipsResponse.totalCount,
                                status: membershipsResponse.status,
                                memberships: membershipsResponse.data.map(function (m) {
                                    return membership_1.Membership.fromMembershipDTO(_this.chat, m, _this);
                                })
                            }];
                }
            });
        });
    };
    return User;
}());
exports.User = User;
