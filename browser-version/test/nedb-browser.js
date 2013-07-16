/**
 * Testing the browser version of NeDB
 * The goal of these tests is not to be exhaustive, we have the server-side NeDB tests for that
 * This is more of a sanity check which executes most of the code at least once and checks
 * it behaves as the server version does
 */

var assert = chai.assert;
chai.should();

/**
 * Given a docs array and an id, return the document whose id matches, or null if none is found
 */
function findById (docs, id) {
  return _.find(docs, function (doc) { return doc._id === id; }) || null;
}


describe('Basic CRUD functionality', function () {

  it('Able to create a database object in the browser', function () {
    var db = new Nedb();

    db.inMemoryOnly.should.equal(true);
    db.persistence.inMemoryOnly.should.equal(true);
  });

  it('Insertion and querying', function (done) {
    var db = new Nedb();

    db.insert({ a: 4 }, function (err, newDoc1) {
      assert.isNull(err);
      db.insert({ a: 40 }, function (err, newDoc2) {
        assert.isNull(err);
        db.insert({ a: 400 }, function (err, newDoc3) {
          assert.isNull(err);

          db.find({ a: { $gt: 36 } }, function (err, docs) {
            var doc2 = _.find(docs, function (doc) { return doc._id === newDoc2._id; })
              , doc3 = _.find(docs, function (doc) { return doc._id === newDoc3._id; })
              ;

            assert.isNull(err);
            docs.length.should.equal(2);
            doc2.a.should.equal(40);
            doc3.a.should.equal(400);

            db.find({ a: { $lt: 36 } }, function (err, docs) {
              assert.isNull(err);
              docs.length.should.equal(1);
              docs[0].a.should.equal(4);
              done();
            });
          });
        });
      });
    });
  });

  it('Querying with regular expressions', function (done) {
    var db = new Nedb();

    db.insert({ planet: 'Earth' }, function (err, newDoc1) {
      assert.isNull(err);
      db.insert({ planet: 'Mars' }, function (err, newDoc2) {
        assert.isNull(err);
        db.insert({ planet: 'Jupiter' }, function (err, newDoc3) {
          assert.isNull(err);
          db.insert({ planet: 'Eaaaaaarth' }, function (err, newDoc4) {
            assert.isNull(err);
            db.insert({ planet: 'Maaaars' }, function (err, newDoc5) {
              assert.isNull(err);

              db.find({ planet: /ar/ }, function (err, docs) {
                assert.isNull(err);
                docs.length.should.equal(4);
                _.find(docs, function (doc) { return doc._id === newDoc1._id; }).planet.should.equal('Earth');
                _.find(docs, function (doc) { return doc._id === newDoc2._id; }).planet.should.equal('Mars');
                _.find(docs, function (doc) { return doc._id === newDoc4._id; }).planet.should.equal('Eaaaaaarth');
                _.find(docs, function (doc) { return doc._id === newDoc5._id; }).planet.should.equal('Maaaars');

                db.find({ planet: /aa+r/ }, function (err, docs) {
                  assert.isNull(err);
                  docs.length.should.equal(2);
                  _.find(docs, function (doc) { return doc._id === newDoc4._id; }).planet.should.equal('Eaaaaaarth');
                  _.find(docs, function (doc) { return doc._id === newDoc5._id; }).planet.should.equal('Maaaars');

                  done();
                });
              });
            });
          });
        });
      });
    });
  });

  it('Updating documents', function (done) {
    var db = new Nedb();

    db.insert({ planet: 'Eaaaaarth' }, function (err, newDoc1) {
      db.insert({ planet: 'Maaaaars' }, function (err, newDoc2) {
        // Simple update
        db.update({ _id: newDoc2._id }, { $set: { planet: 'Saturn' } }, {}, function (err, nr) {
          assert.isNull(err);
          nr.should.equal(1);

          db.find({}, function (err, docs) {
            docs.length.should.equal(2);
            findById(docs, newDoc1._id).planet.should.equal('Eaaaaarth');
            findById(docs, newDoc2._id).planet.should.equal('Saturn');

            // Failing update
            db.update({ _id: 'unknown' }, { $inc: { count: 1 } }, {}, function (err, nr) {
              assert.isNull(err);
              nr.should.equal(0);

              db.find({}, function (err, docs) {
                docs.length.should.equal(2);
                findById(docs, newDoc1._id).planet.should.equal('Eaaaaarth');
                findById(docs, newDoc2._id).planet.should.equal('Saturn');

                // Document replacement
                db.update({ planet: 'Eaaaaarth' }, { planet: 'Uranus' }, { multi: false }, function (err, nr) {
                  assert.isNull(err);
                  nr.should.equal(1);

                  db.find({}, function (err, docs) {
                    docs.length.should.equal(2);
                    findById(docs, newDoc1._id).planet.should.equal('Uranus');
                    findById(docs, newDoc2._id).planet.should.equal('Saturn');

                    // Multi update
                    db.update({}, { $inc: { count: 3 } }, { multi: true }, function (err, nr) {
                      assert.isNull(err);
                      nr.should.equal(2);

                      db.find({}, function (err, docs) {
                        docs.length.should.equal(2);
                        findById(docs, newDoc1._id).planet.should.equal('Uranus');
                        findById(docs, newDoc1._id).count.should.equal(3);
                        findById(docs, newDoc2._id).planet.should.equal('Saturn');
                        findById(docs, newDoc2._id).count.should.equal(3);

                        done();
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });

});