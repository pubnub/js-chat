"use strict";
exports.__esModule = true;
exports.TimetokenUtils = void 0;
var TimetokenUtils = /** @class */ (function () {
    function TimetokenUtils() {
    }
    TimetokenUtils.unixToTimetoken = function (unixTime) {
        var unixTimeNumber = Number(unixTime);
        if (Number.isNaN(unixTimeNumber)) {
            throw "The value passed as unixTime is NaN";
        }
        return unixTimeNumber * 10000;
    };
    TimetokenUtils.timetokenToUnix = function (timetoken) {
        var timetokenNumber = Number(timetoken);
        if (Number.isNaN(timetokenNumber)) {
            throw "The value passed as timetoken is NaN";
        }
        return timetokenNumber / 10000;
    };
    TimetokenUtils.timetokenToDate = function (timetoken) {
        return new Date(this.timetokenToUnix(timetoken));
    };
    TimetokenUtils.dateToTimetoken = function (date) {
        if (!(date instanceof Date)) {
            throw "The value passed as date is not an instance of Date";
        }
        return this.unixToTimetoken(date.getTime());
    };
    return TimetokenUtils;
}());
exports.TimetokenUtils = TimetokenUtils;
