module.exports = function(fn, parent, cannotError) {
  return function() {
    const args = Array.from(arguments);
    return new Promise((resolve, reject) => {
      args.push((err, data) => {
        if (err && !cannotError) {
          return reject(err);
        }
        // eg fs.exists, which doesn't have an err value, only the data :/
        //  yay for consistency
        resolve(cannotError ? err : data);
      });
      fn.apply(parent, args);
    });
  };
};
