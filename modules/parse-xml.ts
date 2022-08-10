import { Parser } from "xml2js";

module.exports = function parseXml(data: string) {
  return new Promise<any>((resolve, reject) => {
    const parser = new Parser();
    parser.parseString(data, (err: Error | null, result: any) => {
      if (err) {
        return reject(err);
      }
      resolve(result);
    });
  });
};

export {};
