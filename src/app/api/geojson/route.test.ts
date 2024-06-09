
import request from 'supertest';
import { createServer, Server } from 'http';
import { parse } from 'url';
import next from 'next';

const app = next({ dev: false });
const handle = app.getRequestHandler();

describe('POST /api/geojson', () => {
  let server: Server;

  beforeAll(async () => {
    await app.prepare();
    server = createServer((req, res) => {
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    }).listen(3000);
  });

  afterAll((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  it('returns a successful analysis response', async () => {
    const body = {
      type: "Point",
      coordinates: [
        10,
        11.2
      ]  // Add the actual geoJSON data you want to test with
    };

    const res = await request(server)
      .post('/api/geojson')
      .send(body)
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(200);
    // Add more expectations based on the response structure
  });

  // it('returns 400 for invalid input', async () => {
  //   const body = {
  //     // Invalid geoJSON data
  //   };
  //
  //   const res = await request(server)
  //     .post('/api/geojson')
  //     .send(body)
  //     .set('Accept', 'application/json');
  //
  //   expect(res.statusCode).toBe(400);
  //   expect(res.body).toHaveProperty('error');
  // });
  //
  // it('returns 500 for missing body', async () => {
  //   const res = await request(server)
  //     .post('/api/geojson')
  //     .send({})
  //     .set('Accept', 'application/json');
  //
  //   expect(res.statusCode).toBe(500);
  //   expect(res.body).toHaveProperty('error');
  // });
});
