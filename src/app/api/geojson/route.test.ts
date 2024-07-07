import request from 'supertest';
import { createServer, Server } from 'http';
import { parse } from 'url';
import next from 'next';

const app = next({ dev: false });
const handle = app.getRequestHandler();

describe('POST /api/geojson', () => {
  let server: Server;
  let address: string;

  beforeAll(async () => {
    await app.prepare();
    await new Promise<void>((resolve) => {
      server = createServer((req, res) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
      }).listen(0, () => {
        const port = (server.address() as any).port;
        address = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  afterAll((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  it('returns a successful analysis response for a point geometry', async () => {
    const body = {
      type: "Point",
      coordinates: [10, 11.2]
    };

    const res = await request(address)
      .post('/api/geojson')
      .send(body)
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(200);
    // Add more expectations based on the response structure
  });

  it('returns a successful analysis response, for a multipoint', async () => {
    const body = {
      type: "MultiPoint",
      coordinates: [
        [10, 11.2],
        [10.5, 11.9]
      ]
    };

    const res = await request(address)
      .post('/api/geojson')
      .send(body)
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(200);
    // Add more expectations based on the response structure
  });

  it('returns a successful analysis response for a set of geoids', async () => {
    const body = {
      geoIds: [
        "c73172da7a0a50c87eed2a08c3acd65f8c8dd1033e84f1fcbe6ce2b90701ce0d",
        "2ff3962841cdfe820b31e03c54b774b724afbc5dafbf742bd0c8a0fc3a664a36",
        "88bec54ad04804f5b1fafbc131266640a129be2840fa6797cda358d7e831b907",
        "c288d6c94efa9011c0e3452af9f7fa0941661377030e10d29c68764617f9816d",
        "1a41a309ae2387f36a604c9a6c81887e64357a7f61d228758e23ef766286fcd7",
        "1a4472dc40700ef33f931863f58d444f243d64418616678fcf85c57e1f4bbf45",
        "b84f55de2b7f3c77d1cbeb8b026a1b29be42d8b08d92058c9143e0556456820f",
        "0520cfac98fbc1bd7952b1c07a9f6983b83625722b6f665ea83ac9aad3512918",
        "b7c15efb6e3c63fcfe649a2d994973a6f5caa844f720f0edb7cf24f6a6c3c1b3"
      ]
    };

    const res = await request(address)
      .post('/api/geo-ids')
      .send(body)
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(200);
    // Add more expectations based on the response structure
  });

  it('returns a successful analysis response', async () => {
    const body = {
      type: "Point",
      coordinates: [10, 11.2]
    };

    const res = await request(address)
      .post('/api/geojson')
      .send(body)
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(200);
    // Add more expectations based on the response structure
  });
});
