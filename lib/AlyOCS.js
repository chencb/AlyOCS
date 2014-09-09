var ALY    = require("aliyun-sdk");
module.exports = function(session) {
    var Store = session.Store;

    function AlyOCS(options) {
        var self = this;

        Store.call(this, options);

        this.prefix = null == options.prefix ? "sess:": options.prefix;

        if(!options.host) {
            throw new Error("invalid aliyun host");
        }

        if(!options.ocsKey) {
            throw new Error("invalid aliyun ocsKey");
        }

        if(!options.ocsSecret) {
            throw new Error("invalid aliyun ocsSecret");
        }

        this.memcached = ALY.MEMCACHED.createClient(11211, options.host, {
            username: options.ocsKey,
            password: options.ocsSecret
        });
    }

    AlyOCS.prototype.__proto__ = Store.prototype;

    /**
     * get session by sid
     * @param sid
     * @param callback
     */
    AlyOCS.prototype.get = function(sid, callback) {
	    var self = this;
        this.memcached.get(sid, function(err, data) {
	    if(data && data.val) {
            var session = data.val.toString();
            try {
                session = JSON.parse(session);
                session.cookie.expires = (new Date(session.cookie.expires)).toString();
                if (err) {
                    callback && callback(err, null);
                } else {
                    if (session) {
                        if (!session.cookie || new Date().getTime() < new Date(session.cookie.expires).getTime()) {
                            callback(null,session);
                        } else {
                            self.destroy(sid, callback);
                        }
                    } else {
                        callback && callback();
                    }
                }
            } catch (err) {
                callback && callback(err);
            }
  	    } else {
		    callback(null);
	    } 
       });
    };

    /**
     * add session, if session exists, Aly OCS will throw Error;
     * @param sid
     * @param sess
     * @param callback
     */
    AlyOCS.prototype.set = function(sid, sess, callback) {
        var self = this;
        self.get(sid, function(err, rows) {
            if(err) {return callback(err);}

            sess.cookie._expires = new Date(sess.cookie._expires);
            var session = JSON.stringify(sess);
            if(rows) {
                self.replace(sid, sess, callback);
            } else {
                self.memcached.add(sid, session, function(err, data) {
                    if(err) {
                        var error = err.val.toString();
                        return callback(error);
                    }
                    callback(null);
                });
            }
        });
    };

    /**
     * update session
     * @param sid
     * @param sess
     * @param callback
     */
    AlyOCS.prototype.replace = function(sid, sess, callback) {
	    sess.cookie._expires = new Date(sess.cookie._expires);
	    var session = JSON.stringify(sess);
        this.memcached.replace(sid, session, function(err, data) {
            if(err) {
                var error = err.val.toString();
                return callback(error);
            }
            callback(null);
        });
    }

    AlyOCS.prototype.destroy = function(sid, callback) {
        this.memcached.delete(sid, function(err, data) {
            if(err) {
                return callback(err);
            }

            callback(null);
        });
    };

  return AlyOCS;
}
