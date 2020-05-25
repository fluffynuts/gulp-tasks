/**
 * Generates an array with the required number of elements, all undefined
 * -> unlike Array(N), this creates the elements, where Array(N) only allocates
 *      the space for elements: attempting to forEach or map over Array(N)
 *      won't accomplish much
 * @param howMany
 */
module.exports = function seed(howMany) {
  return Array.apply(null, Array.from({
    length: howMany
  }));
}
