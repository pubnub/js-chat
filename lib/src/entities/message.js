"use strict";
exports.__esModule = true;
exports.Message = void 0;
var Message = /** @class */ (function () {
    // parentMessageId?: string
    // quote?: string
    // messagesInThreadCount?: number
    // timetoken!: string
    // destructionTime?: number
    // reactions: { reaction: string; count: number; users: User[] }[] = []
    function Message(params) {
        this.sdk = params.sdk;
        this.timetoken = params.timetoken;
        this.content = params.content;
    }
    return Message;
}());
exports.Message = Message;
