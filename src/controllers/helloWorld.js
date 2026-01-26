function helloWorld({ body, params, session }) {
  return { message: 'Hello, World!' };
}

helloWorld.$body = {};
helloWorld.$returns = { message: 'string' };
helloWorld.$access = 'public';
helloWorld.$mapping = '/hello';

export { helloWorld };
