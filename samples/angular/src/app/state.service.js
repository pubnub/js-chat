"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.StateService = void 0;
var core_1 = require("@angular/core");
var rxjs_1 = require("rxjs");
var StateService = /** @class */ (function () {
    function StateService() {
        var _this = this;
        this.createChannelModalJSSDKOpen = false;
        this.createChannelModalChatSDKOpen = false;
        this.JSSDKModalVisibilityChange = new rxjs_1.Subject();
        this.chatSDKModalVisibilityChange = new rxjs_1.Subject();
        this.JSSDKModalVisibilityChange.subscribe(function (value) {
            _this.createChannelModalJSSDKOpen = value;
        });
        this.chatSDKModalVisibilityChange.subscribe(function (value) {
            _this.createChannelModalChatSDKOpen = value;
        });
    }
    StateService.prototype.toggleCreateChannelModalChatSDK = function () {
        this.chatSDKModalVisibilityChange.next(!this.createChannelModalChatSDKOpen);
    };
    StateService.prototype.toggleCreateChannelModalJSSDK = function () {
        this.JSSDKModalVisibilityChange.next(!this.createChannelModalJSSDKOpen);
    };
    StateService.prototype.getCreateChannelModalJSSDKOpen = function () {
        return this.createChannelModalJSSDKOpen;
    };
    StateService.prototype.getCreateChannelModalChatSDKOpen = function () {
        return this.createChannelModalChatSDKOpen;
    };
    StateService = __decorate([
        (0, core_1.Injectable)({
            providedIn: 'root'
        })
    ], StateService);
    return StateService;
}());
exports.StateService = StateService;
