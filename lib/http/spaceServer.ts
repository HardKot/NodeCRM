interface Tls { }

interface SpaceServerProps {
  tls?: Tls;
  port: number;
  host: string;
  version: [boolean, boolean];
}

class SpaceServer {
  constructor(props: SpaceServerProps) { }
}
