import vm from 'node:vm';

const DEFAULT = Object.freeze({
  AbortController,
  AbortSignal,
  Event,
  EventTarget,
  MessageChannel,
  MessageEvent,
  MessagePort,
  Buffer,
  Blob,
  FormData,
  Headers,
  Response,
  Request,
  ByteLengthQueuingStrategy,
  URL,
  URLSearchParams,
  TextDecoder,
  TextEncoder,
  TextDecoderStream,
  TextEncoderStream,
  WebAssembly,
  queueMicrotask,
  setTimeout,
  setImmediate,
  setInterval,
  clearTimeout,
  clearImmediate,
  clearInterval,
  BroadcastChannel,
  CompressionStream,
  DecompressionStream,
  CountQueuingStrategy,
  fetch,
});

const NODE = Object.freeze({
  global,
  console,
  process,
});

const EmptyContext = vm.createContext({});
const NodeContext = vm.createContext(Object.freeze({ ...NODE, ...DEFAULT }));

export { EmptyContext, NodeContext };
