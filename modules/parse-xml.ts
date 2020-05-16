import { Parser } from "xml2js";

module.exports = function parseXml(data: string) {
  return new Promise((resolve, reject) => {
    const parser = new Parser();
    parser.parseString(data, (err: Error, result: object) => {
      if (err) {
        return reject(err);
      }
      resolve(result);
    });
  });
};

export {};
