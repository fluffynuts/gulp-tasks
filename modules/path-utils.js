"use strict";
(function () {
    function splitPath(path) {
        if (!path) {
            return [];
        }
        return path.split(/\/|\\/);
    }
    function baseName(path) {
        const parts = splitPath(path);
        return parts[parts.length - 1] || "";
    }
    function chopExtension(path) {
        if (!path) {
            return "";
        }
        const pathParts = splitPath(path), rejoinWith = path.indexOf("/") ? "/" : "\\", last = pathParts[pathParts.length - 1], splitLast = last.split("."), toDrop = splitLast.length > 1 ? 1 : 0, withoutExt = splitLast.slice(0, splitLast.length - toDrop);
        pathParts[pathParts.length - 1] = withoutExt.join(".");
        return pathParts.join(rejoinWith);
    }
    module.exports = {
        splitPath,
        baseName,
        chopExtension
    };
})();
