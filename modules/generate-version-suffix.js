"use strict";
(function () {
    const { currentShortSHA } = requireModule("git-sha");
    function timestamp() {
        const now = new Date(Date.now()), year = `${now.getFullYear()}`.substring(2), month = zeroPad(now.getMonth() + 1), day = zeroPad(now.getDate()), hour = zeroPad(now.getHours()), minute = zeroPad(now.getMinutes());
        return [
            year,
            month,
            day,
            hour,
            minute
        ].join("");
    }
    function zeroPad(i) {
        return i < 10 ? `0${i}` : `${i}`;
    }
    module.exports = function generateVersionSuffix() {
        return `${timestamp()}.${currentShortSHA()}`;
    };
})();
