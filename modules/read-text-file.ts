(function() {
    const makeObsolete = requireModule<MakeObsolete>("make-obsolete");
    const { readTextFile } = require("yafs");
    module.exports = makeObsolete(
        readTextFile, {
            reason: "rather use readTextFile from 'yafs' (already installed)",
            expires: "2024-01-01"
        }
    )
})();
