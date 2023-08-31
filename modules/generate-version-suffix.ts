(function() {
    const { currentShortSHA } = requireModule<GitSha>("git-sha");
    function timestamp(): string {
        const
            now = new Date(Date.now()),
            year = `${ now.getFullYear() }`.substring(2),
            month = zeroPad(now.getMonth() + 1),
            day = zeroPad(now.getDate()),
            hour = zeroPad(now.getHours()),
            minute = zeroPad(now.getMinutes());
        return [
            year,
            month,
            day,
            hour,
            minute
        ].join("");
    }

    function zeroPad(i: number): string {
        return i < 10 ? `0${ i }` : `${ i }`;
    }

    module.exports = function generateVersionSuffix(): string {
        return `${timestamp()}.${currentShortSHA()}`
    }
})();
