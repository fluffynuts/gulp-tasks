"use strict";
(function () {
    const firstLineOfPackageSource = /\s*(?<index>[\d+])\.\s*(?<name>[^\[\]]+)\[(?<enabled>[^\[\]]+)]/, secondLineOfPackageSource = /\s*(?<url>.*)/;
    function parseNugetSources(lines) {
        let current = undefined;
        const result = [];
        for (const line of lines || []) {
            const firstLine = line.match(firstLineOfPackageSource), secondLine = line.match(secondLineOfPackageSource);
            if (firstLine && firstLine.groups) {
                current = {
                    name: `${(firstLine.groups["name"] || "(not set)").trim()}`,
                    url: "(not set)",
                    enabled: `${firstLine.groups["enabled"]}`.toLowerCase() === "enabled"
                };
                result.push(current);
            }
            else if (current && secondLine && secondLine.groups) {
                current.url = secondLine.groups["url"];
            }
        }
        return result;
    }
    module.exports = parseNugetSources;
})();
