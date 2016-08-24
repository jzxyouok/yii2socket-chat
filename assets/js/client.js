/**
 * Created by andkon on 19.07.16.
 */


var chat = {
    connected: false,
    container: null,
    list: null,
    mess: null,
    socket: null,
    chatId: null,
    userId: null,
    open: function () {
        if (chat.connected) {
            return false;
        }
        if (typeof clientChat != 'undefined') {
            this.chatId = clientChat.chatId;
            this.userId = clientChat.user_id;
            this.container = $('#container_' + this.chatId);
            this.list = $('.list', $(this.container));
            this.mess = $('.message', $(this.container));
            $(this.container).on('click', '.messSend', function () {
                chat.send();
            }).on('keyup', 'textarea', function (event) {
                if (event.keyCode == 13) {
                    chat.send();
                }
            });
            $(this.container).show(1);
            this.socket = new WebSocket("ws://" + clientChat.url);

            this.socket.onopen = function () {
                chat.connected = true;
                console.log("connected");
                chat.setList('');
            };

            this.socket.onclose = function (event) {
                chat.connected = false;

                if (event.wasClean) {
                    console.log('Соединение закрыто чисто');
                } else {
                    console.log('Обрыв соединения'); // например, "убит" процесс сервера
                }

                if (event.code == 1006) {
                    chat.setList('Соединение с сервером...');
                    setTimeout('chat.open()', 3000);
                    return;
                }
                console.log('Код: ' + event.code + ' причина: ' + event.reason);
                chat.echo('Соединение закрыто');
            };

            this.socket.onmessage = function (event) {
                console.log("Получены данные " + event.data);
                var data = JSON.parse(event.data);
                if (data.seller.online) {
                    $('.chat-user__status')
                        .removeClass('chat-user__status--offline')
                        .addClass('chat-user__status--online')
                        .html('Онлайн');
                } else {
                    $('.chat-user__status')
                        .removeClass('chat-user__status--offline')
                        .addClass('chat-user__status--offline')
                        .html('Офлайн');
                }

                var messages = data.messages;
                var html = '';
                for (i in messages) {
                    html += chat.renderMessage(messages[i], data);
                }

                chat.echo(html);
            };

            this.socket.onerror = function (error) {
                console.log("Ошибка " + error.message);
                chat.setList("Ошибка " + error.message);
            };

        }
    },
    renderMessage: function (message, data) {
        var tpl = '';
        var avatar = '';
        if (message.user_id == chat.userId) {
            tpl = clientChat.messageTemplate.current || '';
        } else {
            tpl = clientChat.messageTemplate.apponent || '';
        }

        if (message.user_id == data.user.id) {
            avatar = data.user.avatar;
        } else {
            avatar = data.seller.avatar;
        }

        message.date = message.date.substr(11, 5);
        return tpl.replace('{message}', message.text)
            .replace('{date}', message.date)
            .replace('{avatar}', avatar);
    },
    echo: function (mess) {
        $(this.list).append(mess);
    },
    setList: function (html) {
        $(this.list).html(html);
    },
    send: function () {
        var mess = $(this.mess).val();
        $(this.mess).val('');
        this.socket.send(JSON.stringify({chatId: this.chatId, message: mess}));
        return false;
    }
}