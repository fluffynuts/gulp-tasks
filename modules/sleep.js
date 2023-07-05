"use strict";
(function () {
    module.exports = function (ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    };
})();
