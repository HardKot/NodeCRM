export function GET(request: Request) {
  return new Response('Hello, this is a GET request!');
}

GET.access = 'public';

export function POST(request: Request) {
  return new Response('Hello, this is a POST request!');
}
