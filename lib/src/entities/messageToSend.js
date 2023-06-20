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
exports.__esModule = true;
exports.MessageToSend = void 0;
var MessageToSend = /** @class */ (function () {
    function MessageToSend(chat) {
        var _this = this;
        this.value = "";
        this.previousValue = "";
        this.mentionedUsers = {};
        this.getWord = function (selectionStart) {
            var previousSpaceIndex = _this.value.lastIndexOf(" ", selectionStart - 1);
            var nextSpaceIndex = _this.value.indexOf(" ", selectionStart);
            var begin = previousSpaceIndex < 0 ? 0 : previousSpaceIndex + 1;
            var end = nextSpaceIndex < 0 ? _this.value.length : nextSpaceIndex;
            return _this.value.substring(begin, end);
        };
        this.chat = chat;
    }
    MessageToSend.prototype.onChange = function (text) {
        var _this = this;
        this.previousValue = this.value;
        this.value = text;
        var previousWordsStartingWithAt = this.previousValue.split(" ").filter(function (word) { return word.startsWith("@"); });
        var currentWordsStartingWithAt = this.value.split(" ").filter(function (word) { return word.startsWith("@"); });
        var differentMentionPosition = -1;
        var differentMentions = currentWordsStartingWithAt.filter(function (m, i) {
            var isStringDifferent = previousWordsStartingWithAt.indexOf(m) === -1;
            if (isStringDifferent) {
                differentMentionPosition = i;
            }
            return previousWordsStartingWithAt.indexOf(m) === -1;
        });
        this.mentionedUsers = currentWordsStartingWithAt.reduce(function (acc, curr, currentIndex) {
            var _a;
            var previousMentionIndex = previousWordsStartingWithAt.indexOf(curr);
            if (previousMentionIndex === -1 || !_this.mentionedUsers[previousMentionIndex]) {
                return acc;
            }
            return __assign(__assign({}, acc), (_a = {}, _a[currentIndex] = _this.mentionedUsers[previousMentionIndex], _a));
        }, {});
        Object.keys(this.mentionedUsers).forEach(function (key) {
            var _a;
            var mentionedUser = (_a = _this.mentionedUsers[Number(key)]) === null || _a === void 0 ? void 0 : _a.name;
            if (mentionedUser && text.indexOf(mentionedUser) === -1) {
                delete _this.mentionedUsers[Number(key)];
            }
        });
        var differentMention = differentMentions.length ? {
            name: differentMentions[0],
            nameOccurrenceIndex: differentMentionPosition
        } : null;
        return {
            differentMention: differentMention
        };
    };
    MessageToSend.prototype.addMentionedUser = function (user, mention) {
        var _this = this;
        var counter = 0;
        var result = "";
        var isUserFound = false;
        this.value.split(" ").forEach(function (word) {
            if (!word.startsWith("@")) {
                result += "".concat(word, " ");
            }
            else {
                if (counter !== mention.nameOccurrenceIndex) {
                    result += "".concat(word, " ");
                }
                else {
                    result += "@".concat(user.name, " ");
                    _this.mentionedUsers[mention.nameOccurrenceIndex] = user;
                    isUserFound = true;
                }
                counter++;
            }
        });
        if (!isUserFound) {
            throw "This user does not appear in the text";
        }
        this.value = result.trim();
    };
    MessageToSend.prototype.getPayloadToSend = function () {
        var _this = this;
        return {
            text: this.value,
            mentionedUsers: Object.keys(this.mentionedUsers).reduce(function (acc, key) {
                var _a;
                return (__assign(__assign({}, acc), (_a = {}, _a[key] = { id: _this.mentionedUsers[Number(key)].id, name: _this.mentionedUsers[Number(key)].name }, _a)));
            }, {})
        };
    };
    // getHighlightedMention(selectionStart: number) {
    //   const highlightedWord = this.getWord(selectionStart)
    //
    //   if (!highlightedWord.startsWith("@")) {
    //     return null
    //   }
    //
    //   const necessaryText = this.value.slice(0, selectionStart)
    //
    //   const onlyWordsWithAt = necessaryText.split(" ").filter(word => word.startsWith("@"))
    //
    //   return this.mentionedUsers[onlyWordsWithAt.length - 1] || null
    // }
    MessageToSend.prototype.getHighlightedMention = function (selectionStart) {
        var highlightedWord = this.getWord(selectionStart);
        var necessaryText = this.value.slice(0, selectionStart + highlightedWord.length);
        var onlyWordsWithAt = necessaryText.split(" ").filter(function (word) { return word.startsWith("@"); });
        var lastMentionedUserInText = necessaryText.split(" ").findLastIndex(function (word) { return word.startsWith("@"); });
        return this.mentionedUsers[onlyWordsWithAt.length - 1] || null;
    };
    return MessageToSend;
}());
exports.MessageToSend = MessageToSend;
