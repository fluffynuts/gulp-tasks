"use strict";
(function () {
    const spawn = requireModule("spawn");
    let updating;
    module.exports = function (nugetPath) {
        if (updating) {
            return updating;
        }
        return updating = new Promise(async (resolve, reject) => {
            try {
                await spawn(nugetPath, ["update", "-self"]);
                updating = undefined;
                resolve();
            }
            catch (e) {
                updating = undefined;
                reject(e);
            }
        });
    };
})();
