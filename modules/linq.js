"use strict";
(function () {
    function last(arr) {
        if (isIterator(arr)) {
            let lastItem = undefined;
            for (const item of arr) {
                lastItem = item;
            }
            return lastItem;
        }
        else {
            if (!Array.isArray(arr)) {
                return undefined;
            }
            return arr[arr.length - 1];
        }
    }
    function first(arr) {
        if (isIterator(arr)) {
            // noinspection LoopStatementThatDoesntLoopJS
            for (const item of arr) {
                return item;
            }
            return undefined;
        }
        else {
            if (!Array.isArray(arr)) {
                return undefined;
            }
            return arr[0];
        }
    }
    function* skip(arr, howMany) {
        if (!arr) {
            arr = [];
        }
        if (isIterator(arr)) {
            let idx = 0;
            for (const el of arr) {
                if (++idx >= howMany) {
                    yield el;
                }
            }
        }
        else {
            for (let i = howMany; i < arr.length; i++) {
                yield arr[i];
            }
        }
    }
    function* take(arr, howMany) {
        if (!arr) {
            arr = [];
        }
        if (isIterator(arr)) {
            let idx = 0;
            for (const el of arr) {
                if (++idx <= howMany) {
                    yield el;
                }
            }
        }
        else {
            let i = howMany;
            while (i < arr.length) {
                yield arr[i];
                i++;
            }
        }
    }
    function isIterator(value) {
        return !Array.isArray(value);
    }
    module.exports = {
        first,
        last,
        skip,
        take
    };
})();
