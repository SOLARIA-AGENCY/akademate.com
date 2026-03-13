// Stub for socket.io-client when it is not available in the build environment.
// The realtime hooks check for null socket and degrade gracefully.
module.exports = {
  io: () => null,
  Socket: class {},
  Manager: class {},
}
module.exports.default = module.exports.io
