"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
(function () {
    const debug = requireModule("debug")(__filename), stream = require("stream"), ZarroError = requireModule("zarro-error"), promisifyFn = requireModule("promisify-function");
    function isStream(o) {
        return o instanceof stream_1.Stream;
    }
    function isPromise(o) {
        return o instanceof Promise;
    }
    function looksLikeStream(o) {
        return isFunction(o.on);
    }
    function looksLikePromise(o) {
        return isFunction(o.then);
    }
    function isFunction(o) {
        return typeof (o) === "function";
    }
    function passThrough(p) {
        return p;
    }
    function noop() {
    }
    function promisifyStream(s) {
        return new Promise((resolve, reject) => {
            function runResolve(value) {
                debug("promisified stream ends successfully - resolving promise");
                reject = noop;
                resolve(value);
            }
            function runReject(value) {
                debug("promisified stream errors - rejecting promise");
                resolve = noop;
                reject(value);
            }
            s.on("error", runReject);
            s.on("end", runResolve);
            s.on("finish", runResolve);
        });
    }
    function promisifyFunction(o) {
        return promisifyFn(o);
    }
    const strategies = [
        { test: isFunction, transform: promisifyFunction },
        { test: isPromise, transform: passThrough },
        { test: looksLikePromise, transform: passThrough },
        { test: isStream, transform: promisifyStream },
        { test: looksLikeStream, transform: promisifyStream }
    ];
    module.exports = function (item) {
        const strategy = strategies.reduce((acc, cur) => {
            return acc || (cur.test(item)
                ? cur.transform
                : undefined);
        }, undefined);
        if (!strategy) {
            throw new ZarroError(`Unable to promisify ${item}: dunno what to do with it, squire!`);
        }
        return strategy(item);
    };
})();
