const bluebird = require('bluebird');
const request = bluebird.promisifyAll(require('request'), { multiArgs: true });
const graph = require('fbgraph');

exports.index = (req, res) => {
  const token = req.user.tokens.find(token => token.kind === 'facebook');
  graph.setVersion("2.3");
  graph.setAccessToken(token.accessToken);
  graph.get(`${req.user.facebook}/groups?limit=200`, (err, results) => {
    if (err) { return next(err); }
    console.log(results)
    res.render('groups', {
      title: 'Groups',
      profile: results
    });
  });
};
