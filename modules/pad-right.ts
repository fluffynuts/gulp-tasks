(function() {
    const pad = requireModule<Pad>("pad");
    module.exports = function padRight(
        str: string,
        len: number,
        padString?: string
    ) {
        return pad(str, len, true, padString);
    }
})();
