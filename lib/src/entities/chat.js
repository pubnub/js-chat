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
var Chat = /** @class */ (function () {
    function Chat(params) {
        var saveDebugLog = params.saveDebugLog, typingTimeout = params.typingTimeout, pubnubConfig = __rest(params, ["saveDebugLog", "typingTimeout"]);
        this.sdk = new pubnub_1["default"](pubnubConfig);
        this.config = {
            saveDebugLog: saveDebugLog || false,
            typingTimeout: typingTimeout || 5000
        };
    }
    Chat.init = function (params) {
        return new Chat(params);
    };
    Chat.prototype.getUser = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var uuid, response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        uuid = id || this.sdk.getUUID();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.sdk.objects.getUUIDMetadata({ uuid: uuid })];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, user_1.User.fromDTO(this, response.data)];
                    case 3:
                        error_1 = _a.sent();
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Chat.prototype.createUser = function (id, data) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!id.length)
                            throw "ID is required when creating a User";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.sdk.objects.setUUIDMetadata({ uuid: id, data: data })];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, user_1.User.fromDTO(this, response.data)];
                    case 3:
                        error_2 = _a.sent();
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Chat.prototype.deleteUser = function (id, soft) {
        if (soft === void 0) { soft = false; }
        return __awaiter(this, void 0, void 0, function () {
            var uuid, response, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        uuid = id || this.sdk.getUUID();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        response = void 0;
                        if (!soft) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.sdk.objects.setUUIDMetadata({
                                uuid: uuid,
                                data: { status: "deleted" }
                            })];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, user_1.User.fromDTO(this, response.data)];
                    case 3: return [4 /*yield*/, this.sdk.objects.removeUUIDMetadata({ uuid: uuid })];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 5:
                        console.log(response);
                        return [3 /*break*/, 7];
                    case 6:
                        error_3 = _a.sent();
                        throw error_3;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    // async getAllUsers(params: PubNub.GetAllMetadataParameters) {
    //   const forcedOptions = {
    //     include: {
    //       totalCount: true,
    //       customFields: true,
    //     },
    //   }
    //   try {
    //     const response = await this.sdk.objects.getAllUUIDMetadata(
    //       Object.assign({}, params, forcedOptions)
    //     )
    //     console.log("all users: ", response)
    //     return {
    //       users: response.data.map((u) => User.fromDTO(u)),
    //       next: response.next,
    //       prev: response.prev,
    //       total: response.totalCount,
    //     }
    //   } catch (error) {
    //     throw error
    //   }
    // }
    Chat.prototype.getChannel = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var response, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.sdk.objects.getChannelMetadata({
                                channel: id
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, channel_1.Channel.fromDTO(this, response.data)];
                    case 2:
                        e_1 = _a.sent();
                        console.error("Are you sure this channel exists?");
                        throw e_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    Chat.prototype.getChatUser = function () {
        return this.user;
    };
    Chat.prototype.setChatUser = function (user) {
        // this.sdk.setUUID(user.id)
        this.user = user;
    };
    Chat.prototype.createChannel = function (id, data) {
        return __awaiter(this, void 0, void 0, function () {
            var response, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!id.length)
                            throw "ID is required when creating a Channel";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.sdk.objects.setChannelMetadata({
                                channel: id,
                                data: data
                            })];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, channel_1.Channel.fromDTO(this, response.data)];
                    case 3:
                        e_2 = _a.sent();
                        console.error(e_2);
                        throw e_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Chat.prototype.getChannels = function () {
        // TODO
        return Promise.resolve({ data: [] });
    };
    return Chat;
}());
exports.Chat = Chat;
