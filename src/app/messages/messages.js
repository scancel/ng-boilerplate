/*
angular.module( 'ng-boilerplate.messages', [
        'ui.state',
        'placeholders',
        'ui.bootstrap'
    ])

    .config(function config( $stateProvider,$routeParams, $location, $timeout ) {
        $stateProvider.state( 'messages', {
            url: '/messages',
            views: {
                "main": {
                    controller: 'MessagesController',
                    templateUrl: 'messages/messages.tpl.html'
                }
            },
            data:{ pageTitle: 'What is It?' }
        });
    })

    .controller( 'MessagesController', function MessagesController( $scope, $routeParams, $location, $timeout, Messages ) {
        var init = function () {
            $scope.alerts = [];

            $scope.folders = [];
            $scope.folders['Inbox'] = [];
            $scope.folders['Archive'] = [];
            $scope.folders['Sent'] = [];
            $scope.selectedFolder = 'Inbox';
            $scope.foldersNames = Object.keys($scope.folders);

            $scope.contacts = [];

            $scope.currentMail = undefined;

            Messages.GetAll(function (err, data) {
                if (!err) {
                    $scope.folders['Inbox'] = data.Headers;
                    Messages.GetArchive(function (err, data) {
                        if (!err) {
                            $scope.folders['Archive'] = (data.Headers ? data.Headers : []);
                        }
                    });
                    Messages.GetSent(function (err, data) {
                        if (!err) {
                            $scope.folders['Sent'] = (data.Headers ? data.Headers : []);
                        }
                    });
                    Messages.GetContacts(function (err, data) {
                        if (!err && data.pItems) {
                            $scope.contacts = data.pItems;
                        }
                    });
                }
            });
        };
        init();


        $scope.closeAlert = function (index) {
            var alert = $scope.alerts[index];
            if ($timeout.cancel(alert.timeoutPromise)) {
                $scope.alerts.splice(index, 1);
            }
        };

        $scope.canSend = function () {
            var can = !$scope.newMail.sSubject || !$scope.newMail.sFrom || !$scope.newMail.text;
            return can;
        };

        $scope.addAlert = function (alert, timeoutMS) {
            var n;
            n = $scope.alerts.push({
                type: alert.type,
                msg: alert.msg,
                timeoutPromise: $timeout(function () {
                    $scope.alerts.splice(n, 1);
                }, timeoutMS)
            }) - 1;
        };

        $scope.send = function () {
            var message = {};
            message.sFrom = $scope.newMail.sFrom;
            message.important = $scope.newMail.important;
            message.sSubject = $scope.newMail.sSubject;
            message.text = $scope.newMail.text;
            message.folder = 'Sent';
            $scope.closeComposer();
            Messages.ComposeMessage(function (e, data) {
                if (!e) {
                    Messages.GetSent(function (err, data) {
                        if (!err) {
                            $scope.folders['Sent'] = (data.Headers ? data.Headers : []);
                        }
                    });
                    $scope.addAlert({
                        type: 'success',
                        msg: "Message sent"
                    }, 4000);
                }
                else {
                    $scope.addAlert({
                        type: 'error',
                        msg: "Message sent FAILED!"
                    }, 4000);
                }
            }, message);
        };

        $scope.selectFolder = function (folder) {
            $scope.selectedFolder = folder;
            $scope.currentMail = undefined;
        };

        $scope.selectMail = function (mail) {
            mail.selected = !mail.selected;
        };

        $scope.mouseenterMail = function (mail) {
            mail.hover = true;
        };

        $scope.mouseleaveMail = function (mail) {
            mail.hover = false;
        };

        $scope.cloneToReply = function (mail) {
            $scope.newMail = {};
            console.log(mail);
            $scope.newMail.sFrom = mail.sFrom;
            $scope.newMail.important = mail.important;
            $scope.newMail.sSubject = 'RE: ' + mail.sSubject;
            $scope.reply = true;
            $scope.composerModal = true;
        };

        $scope.cloneToForward = function (mail) {
            $scope.newMail = {};
            $scope.newMail.sFrom = mail.sFrom;
            $scope.newMail.important = mail.important;
            $scope.newMail.sSubject = 'FW: ' + mail.sSubject;
            $scope.forward = true;
            $scope.composerModal = true;
        };

        $scope.openComposer = function () {
            $scope.new = true;
            $scope.newMail = {};
            $scope.composerModal = true;
        };

        $scope.closeComposer = function () {
            $scope.composerModal = false;
            $scope.new = false;
            $scope.reply = false;
            $scope.forward = false;
            $scope.newMail = {};
        };

        $scope.optsComposer = {
            backdropFade: true, // close on background click
            dialogFade: true,
            keyboard: true
        };

        $scope.toggleArchive = function (index) {
            var INBOX = 1;
            var ARCHIVE = 2;
            var target = $scope.selectedFolder == 'Archive' ? 'Inbox' : 'Archive';
            var mail = $scope.folders[$scope.selectedFolder].splice(index, 1)[0];
            var msgsToMove = {};
            msgsToMove.messagesIds = [mail.lMessageId];
            msgsToMove.destinationFolderId = target == "Archive" ? ARCHIVE : INBOX;

            Messages.MoveToFolder(function (e, data) {
                if (!e) {
                    $scope.folders[target].push(mail);
                    $scope.addAlert({
                        type: 'success',
                        msg: "Message " + (target == "Archive" ? "archived" : "moved to inbox")
                    }, 4000);
                }
                else {
                    $scope.addAlert({
                        type: 'error',
                        msg: "Message " + (target == "Archive" ? "archive" : "move to inbox") + " FAILED!"
                    }, 4000);
                }
            }, msgsToMove);
        };

        $scope.ShowMail = function (mail) {
            $scope.currentMail = {
                subject: mail.sSubject,
                from: mail.sFrom,
                fromSMTP: mail.sFromSMTP,
                messageId: mail.lMessageId,
                url: '/getMessageBody/' + mail.lMessageId
            };
        };

        $scope.NextMail = function (mail) {

            var selectedFolder = $scope.folders[$scope.selectedFolder];
            var currMessage = _.where(selectedFolder, { lMessageId: mail.messageId })[0];
            var currMessageIndex = selectedFolder.indexOf(currMessage);
            if (currMessageIndex > -1) {
                var nextIndex = currMessageIndex + 1;
                var nextMail = selectedFolder[nextIndex];
                $scope.ShowMail(nextMail);

                $scope.disableNextBtn = nextIndex === selectedFolder.length - 1;
                $scope.disablePrevBtn = nextIndex === 0;
            }
        };

        $scope.PrevMail = function (mail) {

            var selectedFolder = $scope.folders[$scope.selectedFolder];
            var currMessage = _.where(selectedFolder, { lMessageId: mail.messageId })[0];
            var currMessageIndex = selectedFolder.indexOf(currMessage);
            if (currMessageIndex > -1) {
                var nextIndex = currMessageIndex - 1;
                var nextMail = selectedFolder[nextIndex];
                $scope.ShowMail(nextMail);

                $scope.disableNextBtn = nextIndex === selectedFolder.length - 1;
                $scope.disablePrevBtn = nextIndex === 0;
            }
        };

        $scope.CloseMail = function () {
            $scope.currentMail = null;
        };
    });

*/
