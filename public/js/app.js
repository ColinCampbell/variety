
var Variety = SC.Application.create({

  supported: typeof WebSocket !== 'undefined' || typeof MozWebSocket !== 'undefined'

});

Variety.Message = SC.Object.extend({

  event: null,
  content: null,
  time: null,
  user: null,

  data: function() {
    return {event: this.get('event'), content: this.get('content'), time: this.get('time'), user: this.get('user')};
  }.property('event', 'content', 'time', 'user').cacheable(),

  message: function() {
    var event = this.get('event'),
        content = this.get('content'),
        matches;

    if (event === 'message') {
      matches = content.match(/^\s*[\/\\]me\s(.*)/);

      if (matches) {
        return this.get('user') + ' ' + matches[1];
      }
    }

    return content;
  }.property('event', 'content', 'user').cacheable()

});

Variety.SocketConnection = SC.Object.extend({

  _ws: null,

  host: window.location.host,

  _onmessage: function(evt) {
    var data = $.evalJSON(evt.data),
        message;

    if (typeof data !== 'object') { return; }

    message = Variety.Message.create(data);
    Variety.appController.receivedMessage(message);
  },

  join: function(name) {
    var host = this.get('host'),
        SocketKlass = typeof MozWebSocket !== 'undefined' ? MozWebSocket : WebSocket,
        ws = new SocketKlass('ws://' + host + '/websocket');

    ws.onmessage = this._onmessage;

    ws.onopen = function() {
      ws.send({action: 'join', user: name});
    };

    this._ws = ws;
  },

  sendMessage: function(message) {
    this._ws.send(message.get('data'));
  }

});

Variety.appController = SC.Object.create({

  join: function() {
    Variety.socketConnection.join(Variety.userController.get('name'));
  },

  receivedMessage: function() {
    Variety.messagesList.pushObject(message);
  }

});

Variety.messagesList = SC.ArrayController.create({

  content: []

});

Variety.userController = SC.Object.create({

  name: null

});

Variety.unsupportedView = SC.View.create({
  classNames: ['unsupported'],
  templateName: 'unsupported'
});

Variety.joinView = SC.View.create({
  classNames: ['join'],
  templateName: 'join'
});

SC.$(document).ready(function() {
  $('#channel form').submit(function(event) {
    event.preventDefault();
    var input = $(this).find(':input');
    var msg = input.val();
    ws.send($.toJSON({ action: 'message', message: msg }));
    input.val('');
  });

  if (Variety.supported) {
    Variety.socketConnection = Variety.SocketConnection.create();
    Variety.joinView.append();
  } else {
    Variety.unsupportedView.append();
  }
});
