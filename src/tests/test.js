import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../app';

chai.use(chaiHttp);
chai.should();

import wellness_test from "./wellness-test.json";

const rankings = [wellness_test];

rankings.forEach( system => {
  describe(system.description, () => {
    system.tests.forEach(test => {
      it(test.description || test.barcode, (done) => {
           let url = "/api/" + system.name + "/" + test.category + "/" + test.barcode
           chai.request(app)
             .get(url)
             .end((err, res) => {
                 res.should.have.status(test.status);
                 if (test.properties) {
                   Object.keys(test.properties).forEach( key => {
                      res.body.should.have.property(key, test.properties[key]);
                   })
                 }
                 done();
             });
       });
    })
  });
});
