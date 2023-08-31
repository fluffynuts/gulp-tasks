(function() {
    module.exports = function defaults(
        config: Dictionary<any>,
        fallback: Dictionary<any>
    ) {
        const result = { ...config };
        Object.keys(fallback || {}).forEach(k => {
            if (result[k] === undefined) {
                result[k] = fallback[k];
            }
        });
        return result;
    }
})();
