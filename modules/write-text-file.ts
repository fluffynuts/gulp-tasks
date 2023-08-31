(function() {
    const makeObsolete = requireModule<MakeObsolete>("make-obsolete");
    const { writeTextFile } = require("yafs");
    module.exports = makeObsolete(
        writeTextFile, {
            reason: `rather use readTextFile from 'yafs' (already installed)`,
            expires: "2024-01-01"
        }
    );
})();
