"use strict";
exports.__esModule = true;
exports.MentionsUtils = void 0;
var MentionsUtils = /** @class */ (function () {
    function MentionsUtils() {
    }
    MentionsUtils.getPhraseToLookFor = function (text) {
        var lastAtIndex = text.lastIndexOf("@");
        var charactersAfterAt = text.split("@").slice(-1)[0];
        if (lastAtIndex === -1 || charactersAfterAt.length < 3) {
            return null;
        }
        var splitWords = charactersAfterAt.split(" ");
        if (splitWords.length > 2) {
            return null;
        }
        return splitWords[0] + (splitWords[1] ? " ".concat(splitWords[1]) : "");
    };
    MentionsUtils.getLinkedText = function (_a) {
        var text = _a.text, userCallback = _a.userCallback, mentionedUsers = _a.mentionedUsers;
        if (!mentionedUsers || !Object.keys(mentionedUsers).length) {
            return text;
        }
        var counter = 0;
        var result = "";
        // multi word names
        var indicesToSkip = [];
        text.split(" ").forEach(function (word, index) {
            if (!word.startsWith("@")) {
                if (indicesToSkip.includes(index)) {
                    return;
                }
                result += "".concat(word, " ");
            }
            else {
                var mentionFound = Object.keys(mentionedUsers).indexOf(String(counter)) >= 0;
                if (!mentionFound) {
                    counter++;
                    result += "".concat(word, " ");
                }
                else {
                    var userId = mentionedUsers[counter].id;
                    var userName = mentionedUsers[counter].name;
                    var userNameWords = userName.split(" ");
                    if (userNameWords.length > 1) {
                        indicesToSkip = userNameWords.map(function (_, i) { return index + i; });
                    }
                    counter++;
                    result += "".concat(userCallback(userId, userName), " ");
                }
            }
        });
        return result;
    };
    return MentionsUtils;
}());
exports.MentionsUtils = MentionsUtils;
