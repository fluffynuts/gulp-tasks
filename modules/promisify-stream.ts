import { Stream } from "stream";

(function() {
    const
        debug = requireModule<DebugFactory>("debug")(__filename),
        stream = require("stream"),
        ZarroError = requireModule<ZarroError>("zarro-error"),
        promisifyFn = requireModule<PromisifyFunction>("promisify-function");

    function isStream(o: any): o is Stream {
        return o instanceof Stream;
    }

    function isPromise(o: any): o is Promise<any> {
        return o instanceof Promise;
    }

    function looksLikeStream(o: any): boolean {
        return isFunction(o.on);
    }

    function looksLikePromise(o: any): boolean {
        return isFunction(o.then);
    }

    function isFunction(o: any): boolean {
        return typeof (o) === "function";
    }

    function passThrough<T>(p: T): T {
        return p;
    }

    function noop() {
    }

    function promisifyStream(s: Stream): Promise<any> {
        return new Promise((resolve, reject) => {
            function runResolve(value: unknown) {
                debug("promisified stream ends successfully - resolving promise");
                reject = noop;
                resolve(value);
            }

            function runReject(value: unknown) {
                debug("promisified stream errors - rejecting promise");
                resolve = noop;
                reject(value);
            }

            s.on("error", runReject);
            s.on("end", runResolve);
            s.on("finish", runResolve);
        });
    }

    function promisifyFunction(o: any): AsyncVoidFunc<any> {
        return promisifyFn(o);
    }

    const strategies = [
        { test: isFunction, transform: promisifyFunction },
        { test: isPromise, transform: passThrough },
        { test: looksLikePromise, transform: passThrough },
        { test: isStream, transform: promisifyStream },
        { test: looksLikeStream, transform: promisifyStream }
    ] as Strategy[];

    type Tester = (o: any) => boolean;
    type Transformer = (o: any) => AsyncVoidFunc<any>;

    interface Strategy {
        test: Tester,
        transform: Transformer;
    }

    module.exports = function(item: any) {
        const strategy = strategies.reduce(
            (acc: Optional<Transformer>, cur: Strategy) => {
                return acc || (cur.test(item)
                        ? cur.transform
                        : undefined
                );
            }, undefined as Optional<Transformer>);
        if (!strategy) {
            throw new ZarroError(`Unable to promisify ${ item }: dunno what to do with it, squire!`);
        }
        return strategy(item);
    };
})();
