import path from "path";

(function() {
  const { stat, fileExists } = requireModule<FileSystemUtils>("fs");
  module.exports = async function(at?: string): Promise<Date | undefined> {
    at = at ?? ".";
    const fetchHead = path.join(at, ".git", "FETCH_HEAD");
    if (!(await fileExists(fetchHead))) {
      return undefined;
    }
    const st = await stat(fetchHead);
    const result = new Date(st.mtime);
    return isNaN(result.getTime())
      ? undefined
      : result;
  }
})();
