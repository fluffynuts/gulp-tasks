"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryReadVersionFrom = void 0;
function readTextFrom(node) {
    return node
        ? node[0]
        : undefined;
}
function tryReadVersionFrom(groups, nodeName) {
    return groups.reduce((acc, cur) => acc || readTextFrom(cur[nodeName]), undefined);
}
exports.tryReadVersionFrom = tryReadVersionFrom;
