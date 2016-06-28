var Transaction = require('../index').Transaction;

var expect = require('chai').expect;
var testConnector = require('./connectors/test-sql-connector');

var juggler = require('loopback-datasource-juggler');

var db, Post;
var Review;

describe('transactions', function() {

  before(function(done) {
    db = new juggler.DataSource({
      connector: testConnector,
      debug: true
    });
    db.once('connected', function() {
      Post = db.define('PostTX', {
        title: {type: String, length: 255, index: true},
        content: {type: String}
      });
      Review = db.define('ReviewTX', {
        author: String,
        content: {type: String}
      });
      Post.hasMany(Review, {as: 'reviews', foreignKey: 'postId'});
      done();
    });
  });

  var currentTx;
  var hooks = [];
  // Return an async function to start a transaction and create a post
  function createPostInTx(post, timeout) {
    return function(done) {
      // Transaction.begin(db.connector, Transaction.READ_COMMITTED,
      Post.beginTransaction({
          isolationLevel: Transaction.READ_COMMITTED,
          timeout: timeout
        },
        function(err, tx) {
          if (err) return done(err);
          expect(typeof tx.id).to.eql('string');
          hooks = [];
          tx.observe('before commit', function(context, next) {
            hooks.push('before commit');
            next();
          });
          tx.observe('after commit', function(context, next) {
            hooks.push('after commit');
            next();
          });
          tx.observe('before rollback', function(context, next) {
            hooks.push('before rollback');
            next();
          });
          tx.observe('after rollback', function(context, next) {
            hooks.push('after rollback');
            next();
          });
          currentTx = tx;
          Post.create(post, {transaction: tx, model: 'Post'},
            function(err, p) {
              if (err) {
                done(err);
              } else {
                p.reviews.create({
                    author: 'John',
                    content: 'Review for ' + p.title
                  }, {transaction: tx, model: 'Review'},
                  function(err, c) {
                    done(err);
                  });
              }
            });
        });
    };
  }

  // Return an async function to find matching posts and assert number of
  // records to equal to the count
  function expectToFindPosts(where, count, inTx) {
    return function(done) {
      var options = {model: 'Post'};
      if (inTx) {
        options.transaction = currentTx;
      }
      Post.find({where: where}, options,
        function(err, posts) {
          if (err) return done(err);
          expect(posts.length).to.be.eql(count);
          if (count) {
            // Find related reviews
            options.model = 'Review';
            // Please note the empty {} is required, otherwise, the options
            // will be treated as a filter
            posts[0].reviews({}, options, function(err, reviews) {
              if (err) return done(err);
              expect(reviews.length).to.be.eql(count);
              done();
            });
          } else {
            done();
          }
        });
    };
  }

  describe('commit', function() {

    var post = {title: 't1', content: 'c1'};
    before(createPostInTx(post));

    it('should not see the uncommitted insert', expectToFindPosts(post, 0));

    it('should see the uncommitted insert from the same transaction',
      expectToFindPosts(post, 1, true));

    it('should commit a transaction', function(done) {
      currentTx.commit(function(err) {
        expect(hooks).to.eql(['before commit', 'after commit']);
        done(err);
      });
    });

    it('should see the committed insert', expectToFindPosts(post, 1));

    it('should report error if the transaction is not active', function(done) {
      currentTx.commit(function(err) {
        expect(err).to.be.instanceof(Error);
        done();
      });
    });
  });

  describe('rollback', function() {

    before(function() {
      // Reset the collection
      db.connector.data = {};
    });

    var post = {title: 't2', content: 'c2'};
    before(createPostInTx(post));

    it('should not see the uncommitted insert', expectToFindPosts(post, 0));

    it('should see the uncommitted insert from the same transaction',
      expectToFindPosts(post, 1, true));

    it('should rollback a transaction', function(done) {
      currentTx.rollback(function(err) {
        expect(hooks).to.eql(['before rollback', 'after rollback']);
        done(err);
      });
    });

    it('should not see the rolledback insert', expectToFindPosts(post, 0));

    it('should report error if the transaction is not active', function(done) {
      currentTx.rollback(function(err) {
        expect(err).to.be.instanceof(Error);
        done();
      });
    });
  });

  describe('timeout', function() {

    before(function() {
      // Reset the collection
      db.connector.data = {};
    });

    var post = {title: 't3', content: 'c3'};
    before(createPostInTx(post, 50));

    it('should report timeout', function(done) {
      setTimeout(function() {
        Post.find({where: {title: 't3'}}, {transaction: currentTx},
          function(err, posts) {
            if (err) return done(err);
            expect(posts.length).to.be.eql(1);
            done();
          });
      }, 100);
      done();
    });

    it('should invoke the timeout hook', function(done) {
      currentTx.observe('timeout', function(context, next) {
        next();
        done();
      });
    });

  });
});
