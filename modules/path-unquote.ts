(function() {
    module.exports = function(str: string) {
        if (!str) {
            return str;
        }
        return str.replace(/^"/, "").replace(/"$/, "");
    }
})();
