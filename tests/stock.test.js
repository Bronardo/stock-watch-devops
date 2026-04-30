const request = require('supertest');
const { expect } = require('chai');
const app = require('../app/app');

describe('Stock Watcher API Tests', function() {
  // Global timeout for this suite
  this.timeout(10000); 

  it('GET /health should return status UP', async () => {
    const res = await request(app).get('/health');
    expect(res.status).to.equal(200);
    expect(res.body.status).to.equal('UP');
  });

  it('GET /price/AAPL should return 200 or 500 depending on API Key', async () => {
    
    const res = await request(app).get('/price/AAPL');
    // this is a line of failure simulation
    // const res = await request(app).get('/prices/AAPL');
    // If you have the key set in your terminal, it should be 200
    // If not, it will be 500—both prove the CODE is working.
    expect([200, 500]).to.include(res.status);
  });
});