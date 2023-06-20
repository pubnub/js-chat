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
describe("User test", function () {
    var chat;
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
    test("Should be able to create user", function () { return __awaiter(void 0, void 0, void 0, function () {
        var userId, userData, createdUser;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    jest.retryTimes(3);
                    userId = (0, testUtils_1.createRandomUserId)();
                    userData = {
                        name: "John Smith",
                        profileUrl: "https://randomuser.me/api/portraits/men/1.jpg",
                        custom: {
                            title: "VP Marketing",
                            linkedInUrl: "https://www.linkedin.com/mkelly_vp"
                        }
                    };
                    return [4 /*yield*/, chat.createUser(userId, userData)];
                case 1:
                    createdUser = _a.sent();
                    expect(createdUser).toBeDefined();
                    expect(createdUser.id).toBe(userId);
                    expect(createdUser.name).toEqual(userData.name);
                    expect(createdUser.profileUrl).toEqual(userData.profileUrl);
                    expect(createdUser.custom).toEqual(userData.custom);
                    return [2 /*return*/];
            }
        });
    }); });
    test("Should be able to update user", function () { return __awaiter(void 0, void 0, void 0, function () {
        var userId, initialUserData, updatedUserData, fetchedUser;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    jest.retryTimes(3);
                    userId = (0, testUtils_1.createRandomUserId)();
                    initialUserData = {
                        name: "John Smith",
                        profileUrl: "https://randomuser.me/api/portraits/men/1.jpg",
                        custom: {
                            title: "VP Marketing",
                            linkedInUrl: "https://www.linkedin.com/mkelly_vp"
                        }
                    };
                    return [4 /*yield*/, chat.createUser(userId, initialUserData)];
                case 1:
                    _a.sent();
                    updatedUserData = {
                        name: "Jane Smith",
                        profileUrl: "https://randomuser.me/api/portraits/women/1.jpg",
                        custom: {
                            title: "VP Sales",
                            linkedInUrl: "https://www.linkedin.com/jsmith_vp"
                        }
                    };
                    return [4 /*yield*/, chat.updateUser(userId, updatedUserData)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, chat.getUser(userId)];
                case 3:
                    fetchedUser = _a.sent();
                    if (fetchedUser) {
                        expect(fetchedUser.id).toBe(userId);
                        expect(fetchedUser.name).toEqual(updatedUserData.name);
                        expect(fetchedUser.profileUrl).toEqual(updatedUserData.profileUrl);
                        expect(fetchedUser.custom).toEqual(updatedUserData.custom);
                    }
                    else {
                        fail("fetchedUser is null");
                    }
                    return [2 /*return*/];
            }
        });
    }); });
    test("Should be able to delete (archive) user", function () { return __awaiter(void 0, void 0, void 0, function () {
        var userId, initialUserData, userToDelete, deleteResult, fetchedUser;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    jest.retryTimes(3);
                    userId = (0, testUtils_1.createRandomUserId)();
                    initialUserData = {
                        name: "John Smith",
                        profileUrl: "https://randomuser.me/api/portraits/men/1.jpg",
                        custom: {
                            title: "VP Marketing",
                            linkedInUrl: "https://www.linkedin.com/mkelly_vp"
                        }
                    };
                    return [4 /*yield*/, chat.createUser(userId, initialUserData)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, chat.getUser(userId)];
                case 2:
                    userToDelete = _a.sent();
                    if (!userToDelete) {
                        fail("User to delete is null");
                    }
                    if (!userToDelete) return [3 /*break*/, 4];
                    return [4 /*yield*/, chat.deleteUser(userId, { soft: false })];
                case 3:
                    deleteResult = _a.sent();
                    expect(deleteResult).toBe(true);
                    _a.label = 4;
                case 4: return [4 /*yield*/, chat.getUser(userId)];
                case 5:
                    fetchedUser = _a.sent();
                    expect(fetchedUser).toBeNull();
                    return [2 /*return*/];
            }
        });
    }); });
    test("Should stream user updates and invoke the callback", function () { return __awaiter(void 0, void 0, void 0, function () {
        var chat, user1, user2, users, callback, unsubscribe;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, testUtils_1.initTestChat)()];
                case 1:
                    chat = _a.sent();
                    return [4 /*yield*/, chat.createUser((0, testUtils_1.createRandomUserId)(), {})];
                case 2:
                    user1 = _a.sent();
                    return [4 /*yield*/, chat.createUser((0, testUtils_1.createRandomUserId)(), {})];
                case 3:
                    user2 = _a.sent();
                    users = [user1, user2];
                    callback = jest.fn(function (updatedUsers) {
                        expect(updatedUsers).toEqual(users);
                    });
                    unsubscribe = src_1.User.streamUpdatesOn(users, callback);
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, Promise.all(users.map(function (user) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, user["delete"]()];
                                case 1: return [2 /*return*/, _a.sent()];
                            }
                        }); }); }))];
                case 5:
                    _a.sent();
                    unsubscribe();
                    return [2 /*return*/];
            }
        });
    }); });
    jest.retryTimes(3);
});
