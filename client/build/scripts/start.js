'use strict';

// var inherits = require('util').inherits;
// var EventEmitter = require('events').EventEmitter;

/**************************************************************************************
        peerconnection 
****************************************************************************/

try{

    var RTCPeerConnection = null;
    var webrtcDetectedBrowser = null;
    var webrtcDetectedVersion = null;
    /*var usersList       = document.getElementById("userslist");
    var numbersOfUsers  = document.getElementById("numbersofusers");
    var usersContainer  = document.getElementById("usersContainer");*/
    var tempuserid ;
    var sessions = {};

    //instantiates event emitter
    // EventEmitter.call(this);

    /**
     * Represents a webrtc dom startup.
     * @constructor
     * @param {json} _localObj - local object.
     * @param {json} _remoteObj - remote object.
     * @param {json} incoming - incoming media stream.
     * @param {json} outgoing - outgoing media stream.
     */
    var WebRTCdom= function(  _localObj , _remoteObj , incoming, outgoing){

        if(incoming){
            incomingAudio = incoming.audio ; 
            incomingVideo = incoming.video ; 
            incomingData  = incoming.data  ;  
        }

        console.log(" [ startJS webrtcdom ] : DetectRTC " , DetectRTC);
        
        // Cases around webcam malfunctiojn or absense 
        if(!DetectRTC.hasWebcam){
            shownotification(" Your browser doesnt have webcam" , "warning");
            outgoing.video = false;
        }
        if(!DetectRTC.isWebsiteHasWebcamPermissions){
            shownotification(" Your browser doesnt have permission for accessing webcam", "warning");
            outgoing.video = false;
        }
        
        //Cases around Miceohone malfunction or absense 
        if(!DetectRTC.hasMicrophone){
            shownotification(" Your browser doesnt have microphone", "warning");   
            outgoing.audio = false ;
        }
        if(!DetectRTC.sWebsiteHasMicrophonePermissions){
            shownotification(" Your browser doesnt have permission for accessing microphone", "warning");
            outgoing.audio = false;
        }
        
        if(!DetectRTC.hasSpeakers){
            shownotification(" Your browser doesnt have speakers", "warning");      
        }

        if(outgoing){
            outgoingAudio = outgoing.audio ; 
            outgoingVideo = outgoing.video ; 
            outgoingData  = outgoing.data ;
        }

        /* When user is single */
        localobj=_localObj;
        localVideo = localobj.video;

        /* when user is in conference */
        remoteobj=_remoteObj;
        var _remotearr=_remoteObj.videoarr;

        /* first video container in remotearr belonsg to user */
        if(outgoingVideo){
            selfVideo = _remotearr[0];
        }

        /* create arr for remote peers videos */
        if(!remoteobj.dynamicVideos){
            for(var x=1;x<_remotearr.length;x++){
                remoteVideos.push(_remotearr[x]);    
            }
        }

        if(localobj.hasOwnProperty('userdetails')){
            console.info("localobj userdetails " , localobj.userdetails);
            selfusername = (localobj.userdetails.username  == undefined ? "LOCAL": localobj.userdetails.username);
            selfcolor    = (localobj.userdetails.usercolor == undefined ? "orange": localobj.userdetails.usercolor);
            selfemail    = (localobj.userdetails.useremail == undefined ? "unknown": localobj.userdetails.useremail);
            role         = (localobj.userdetails.role  == undefined ? "participant": localobj.userdetails.role);
        }

        if(remoteobj.hasOwnProperty('userdetails')){
            console.info("remoteobj userdetails " , remoteobj.userdetails);
            remoteusername = (remoteobj.userdetails.username  == undefined ? "REMOTE": remoteobj.userdetails.username);
            remotecolor    = (remoteobj.userdetails.usercolor == undefined ? "orange": remoteobj.userdetails.usercolor);
            remoteemail    = (remoteobj.userdetails.useremail == undefined ? "unknown": remoteobj.userdetails.useremail);
        }

    };

    /**
     * Assigns ICE gateways and  widgets 
     * @constructor
     * @param {json} session - session object.
     * @param {json} widgets - widgets object.
     */
    var WebRTCdev= function(session, widgets){
        try{
            sessionid  = session.sessionid;
            socketAddr = session.socketAddr;
            console.log("WebRTCdev --> widgets ", widgets , " || Session " , session);
        }catch(e){
            console.error(e);
            alert(" Session object doesnt have all parameters ");
        }

        try{
            turn    = (session.hasOwnProperty('turn')?session.turn:null);
            if(turn!=null && turn !="none"){
                getICEServer( turn.username ,turn.secretkey , turn.domain,
                                turn.application , turn.room , turn.secure); 
            }
        }catch(e){
            console.error(e);
            alert(" cannot get TURN ");
        }

        if(widgets){

            if(widgets.debug)           debug           = widgets.debug;

            if(widgets.chat)            chatobj         = widgets.chat;

            if(widgets.fileShare)       fileshareobj    = widgets.fileShare;

            if(widgets.screenrecord)    screenrecordobj = widgets.screenrecord;

            if(widgets.screenshare)     screenshareobj  = widgets.screenshare;

            if(widgets.snapshot)        snapshotobj     = widgets.snapshot;

            if(widgets.videoRecord)     videoRecordobj  = widgets.videoRecord;

            if(widgets.reconnect)       reconnectobj    = widgets.reconnect;

            if(widgets.drawCanvas)      drawCanvasobj   = widgets.drawCanvas;

            if(widgets.texteditor)      texteditorobj   = widgets.texteditor;

            if(widgets.codeeditor)      codeeditorobj   = widgets.codeeditor;

            if(widgets.mute)            muteobj         = widgets.mute;

            if(widgets.timer)           timerobj        = widgets.timer;

            if(widgets.listenin)        listeninobj    = widgets.listenin;

            if(widgets.cursor)          cursorobj       = widgets.cursor;

            if(widgets.minmax)          minmaxobj       = widgets.minmax;
        }

        return {
            sessionid : sessionid,
            socketAddr: socketAddr,
            turn : turn,
            widgets  : widgets,
            startwebrtcdev: function (widgets) {
                var p = new Promise(function (resolve, reject) {
                    rtcConn = new RTCMultiConnection();

                    if (turn != 'none') {
                        if (!webrtcdevIceServers) {
                            return;
                        }
                        console.info(" WebRTC dev ICE servers ", webrtcdevIceServers);
                        rtcConn.iceServers = webrtcdevIceServers;
                        window.clearInterval(repeatInitilization);
                    }

                    tempuserid = rtcConn.userid;
                })
                .then(setRtcConn())
                .then(
                        detectExtension(screenshareobj.extensionID, function (status) {
                            extensioninstalled = status;
                            console.log("is extension installed  ? ", extensioninstalled);

                            if (extensioninstalled == 'not-installed') {
                                createExtensionInstallWindow();
                            }
                            setWidgets();
                            startSession(rtcConn, socketAddr,  sessionid);
                        })
                )
                .catch(function (err) {
                    console.error(" Promise rejected " , err);
                });
            },
            rtcConn : rtcConn
        };
    };

    /*
    set Rtc connection
    */
    var setRtcConn = function () {
        return new Promise(function (resolve, reject) {

            rtcConn.connectionType = null,
                rtcConn.remoteUsers = [],

                rtcConn.extra = {
                    uuid: tempuserid,
                    name: localobj.userdetails.username,
                    color: localobj.userdetails.usercolor,
                    email: localobj.userdetails.useremail
                },

                rtcConn.channel = sessionid,
                rtcConn.socketURL = "/",
                rtcConn.socketMessageEvent = 'RTCMultiConnection-Message',
                rtcConn.socketCustomEvent = 'RTCMultiConnection-Custom-Message',

                rtcConn.enableFileSharing = true,
                rtcConn.filesContainer = document.body || document.documentElement,

                rtcConn.dontCaptureUserMedia = true,

                rtcConn.onNewParticipant = function (participantId, userPreferences) {
                    console.log("onNewParticipant", participantId, userPreferences);
                    shownotification(remoteusername + " requests new participantion ");
                    if (webcallpeers.length <= remoteobj.maxAllowed) {
                        updatePeerInfo(participantId, remoteusername, remotecolor, "", "role", "remote");
                    } else {
                        shownotification("Another user is trying to join this channel but max count [ " + remoteobj.maxAllowed + " ] is reached", "warning");
                    }
                    rtcConn.acceptParticipationRequest(participantId, userPreferences);
                },

                rtcConn.onopen = function (event) {
                    console.log("rtcconn oopen " + rtcConn.connectionType);
                    try {
                        if (rtcConn.connectionType == "open")
                            connectWebRTC("open", sessionid, selfuserid, []);
                        else if (rtcConn.connectionType == "join")
                            connectWebRTC("join", sessionid, selfuserid, rtcConn.remoteUsers);
                        else
                            shownotification("connnection type is neither open nor join", "warning");

                        if (timerobj && timerobj.active) {
                            startsessionTimer(timerobj);
                            shareTimePeer();
                        }
                        shownotification(event.extra.name + " joined session ");
                        showdesktopnotification();
                        eventEmitter.emit('sessionconnected');        // Call Function just in case the client is implementing this
                    } catch (e) {
                        shownotification("problem in on session open "+ e.message, "warning");
                        console.error("problem in on session open", e);
                    }
                },

                rtcConn.onMediaError = function (error, constraints) {
                    console.error("[startJS onMediaError] ", error, constraints);
                    shownotification(error.name + " Joining without camera Stream ", "warning");

                    // For local Peer , if cemars is nott allowed or not connected then put null in video containers 
                    //for(x in webcallpeers){
                        //if(!webcallpeers[x].stream &&  !webcallpeers[x].streamid){
                            var peerinfo = webcallpeers[0];
                            peerinfo.type = "Local";
                            peerinfo.stream = null;
                            peerinfo.streamid = "nothing01";
                            updateWebCallView(peerinfo);
                        //}
                    //}
                },

                rtcConn.onstream = function (event) {
                    console.log("[startJs on stream ] on stream Started event ", event);
                    /*                  
                    var width = parseInt(connection.videosContainer.clientWidth / 2) - 20;
                    var mediaElement = getMediaElement(event.mediaElement, {
                        title: event.userid,
                        buttons: ['full-screen'],
                        width: width,
                        showOnMouseEnter: false
                    });
                    connection.videosContainer.appendChild(mediaElement);
                    setTimeout(function() {
                        mediaElement.media.play(); 
                    }, 5000);
                    mediaElement.id = event.streamid;*/
                    var peerinfo = findPeerInfo(event.userid);
                    if (!peerinfo) {
                        console.error(" PeerInfo not present in webcallpeers ", event.userid, rtcConn);
                        alert(" Cannot create session for Peer");
                    } else {
                        peerinfo.type = event.type;
                        peerinfo.stream = event.stream;
                        peerinfo.streamid = event.stream.streamid;
                        updateWebCallView(peerinfo);
                    }
                },

                rtcConn.onstreamended = function (event) {
                    console.log(" On streamEnded event ", event);
                    var mediaElement = document.getElementById(event.streamid);
                    if (mediaElement) {
                        mediaElement.parentNode.removeChild(mediaElement);
                    }
                },

                rtcConn.chunkSize = 50 * 1000,

                rtcConn.onmessage = function (e) {
                    console.log(" on message ", e);
                    if (e.data.typing) {
                        updateWhotyping(e.extra.name + " is typing ...");
                    } else if (e.data.stoppedTyping) {
                        updateWhotyping("");
                    } else {
                        switch (e.data.type) {
                            case "screenshare":

                                if (e.data.message == "stoppedscreenshare") {
                                    shownotification("Screenshare has stopped : " + e.data.screenStreamid);
                                    //createScreenViewButton();
                                    var button = document.getElementById(screenshareobj.button.shareButton.id);
                                    button.className = screenshareobj.button.shareButton.class_off;
                                    button.innerHTML = screenshareobj.button.shareButton.html_off;
                                    button.disabled = false;

                                    scrConn.onstreamended();
                                    scrConn.removeStream(e.data.screenStreamid);
                                    scrConn.close();
                                } else if (e.data.message == "screenshareStartedViewing") {
                                    screenshareNotification("", "screenshareStartedViewing");
                                } else {
                                    shownotification("screen is getting shared " + e.data.screenid);
                                    //createScreenViewButton();
                                    var button = document.getElementById(screenshareobj.button.shareButton.id);
                                    button.innerHTML = "Peer sharing";
                                    button.parentNode.setAttribute("style", "background:rgba(46, 109, 164, 0.35)");
                                    button.disabled = true;

                                    screenRoomid = e.data.screenid;
                                    var selfuserid = "temp_" + (new Date().getUTCMilliseconds());
                                    webrtcdevPrepareScreenShare(function (screenRoomid) {
                                        //scrConn.join(screenRoomid);  
                                        connectScrWebRTC("join", screenRoomid, selfuserid, []);
                                    });
                                }

                                break;
                            case "chat":
                                updateWhotyping(e.extra.name + " has send message");
                                /*var userinfo;
                                try{
                                    userinfo=getUserinfo(rtcConn.blobURLs[e.userid], "chat-message.png");
                                }catch(e){
                                    userinfo="empty";
                                }*/
                                addNewMessage({
                                    header: e.extra.name,
                                    message: e.data.message,
                                    userinfo: e.data.userinfo,
                                    color: e.extra.color
                                });
                                break;
                            case "imagesnapshot":
                                var peerinfo = findPeerInfo(e.userid);
                                displayList(null, peerinfo, e.data.message, e.data.name, "imagesnapshot");
                                displayFile(null, peerinfo, e.data.message, e.data.name, "imagesnapshot");
                                break;
                            case "videoRecording":
                                var peerinfo = findPeerInfo(e.userid);
                                displayList(null, peerinfo, e.data.message, e.data.name, "videoRecording");
                                displayFile(null, peerinfo, e.data.message, e.data.name, "videoRecording");
                                break;
                            case "videoScreenRecording":
                                var peerinfo = findPeerInfo(e.userid);
                                displayList(null, peerinfo, e.data.message, e.data.name, "videoScreenRecording");
                                displayFile(null, peerinfo, e.data.message, e.data.name, "videoScreenRecording");
                                break;
                            case "file":
                                addNewMessage({
                                    header: e.extra.name,
                                    message: e.data.message,
                                    userinfo: getUserinfo(rtcConn.blobURLs[e.userid], "chat-message.png"),
                                    color: e.extra.color
                                });
                                break;
                            case "canvas":
                                if (e.data.draw) {
                                    CanvasDesigner.syncData(e.data.draw);
                                } else if (e.data.board) {
                                    console.log(" Canvas : ", e.data);
                                    if (e.data.board.from == "remote") {

                                        if (e.data.board.event == "open" && isDrawOpened != true)
                                            syncDrawBoard(e.data.board);
                                        else if (e.data.board.event == "close" && isDrawOpened == true)
                                            syncDrawBoard(e.data.board);
                                    }
                                } else {
                                    console.warn(" Board data mismatch", e.data);
                                }
                                break;
                            case "texteditor":
                                receiveWebrtcdevTexteditorSync(e.data.data);
                                break;
                            case "codeeditor":
                                receiveWebrtcdevCodeeditorSync(e.data.data);
                                break;
                            case "pointer":
                                var elem = document.getElementById("cursor2");
                                if (elem) {
                                    if (e.data.action == "startCursor") {
                                        elem.setAttribute("style", "display:block");
                                        placeCursor(elem, e.data.corX, e.data.corY);
                                    } else if (e.data.action == "stopCursor") {
                                        elem.setAttribute("style", "display:none");
                                    }
                                } else {
                                    alert(" Cursor for remote is not present ");
                                }

                                break;
                            case "timer":
                                startPeersTime(e.data.time, e.data.zone);
                                break;
                            case "buttonclick":
                                var buttonElement = document.getElementById(e.data.buttonName);
                                if (buttonElement.getAttribute("lastClickedBy") != rtcConn.userid) {
                                    buttonElement.setAttribute("lastClickedBy", e.userid);
                                    buttonElement.click();
                                }
                                break;
                            case "syncOldFiles":
                                sendOldFiles();
                                break;
                            default:
                                console.warn(" unrecognizable message from peer  ", e);
                                break;
                        }
                    }
                    return;
                },

                rtcConn.sendMessage = function (event) {
                    console.log(" sendMessage ", event);
                    event.userid = rtcConn.userid,
                    event.extra = rtcConn.extra,
                    rtcConn.sendCustomMessage(event)
                },

                rtcConn.onleave = function (e) {
                    /*
                    addNewMessage({
                        header: e.extra.name,
                        message: e.extra.name + " left session.",
                        userinfo: getUserinfo(rtcConn.blobURLs[e.userid], "info.png"),
                        color: e.extra.color
                    }), */

                    var peerinfo = findPeerInfo(e.userid) ;

                    console.log(" RTCConn onleave user", e , " his peerinfo " , peerinfo , " rom webcallpeers " , webcallpeers );
                    if (e.extra.name != "undefined")
                        shownotification(e.extra.name + "  left the conversation.");
                    //rtcConn.playRoleOfInitiator()
                    
                    /*if(peerinfo){
                        destroyWebCallView(peerinfo, function (result) {
                            if (result)
                                removePeerInfo(e.userid);
                        });
                    }*/
                    eventEmitter.emit('sessiondisconnected', peerinfo);
                },

                rtcConn.onclose = function (e) {
                    console.log(" RTCConn on close conversation ", e);
                    /*alert(e.extra.name + "closed ");*/
                },

                rtcConn.onEntireSessionClosed = function (event) {
                    rtcConn.attachStreams.forEach(function (stream) {
                        stream.stop();
                    });
                    alert(" Entire Session Disconneted ");
                    eventEmitter.emit('sessiondisconnected', '');
                },

                rtcConn.onFileStart = function (file) {
                    console.log("[start] on File start " + file.name);
                    console.log("file description ", file);

                    var peerinfo = findPeerInfo(file.userid);
                    if(peerinfo && peerinfo.role =="inspector") return;
                    addProgressHelper(file.uuid, peerinfo, file.name, file.maxChunks, "fileBoxClass");
                },

                rtcConn.onFileProgress = function (e) {
                    console.log("[start] on File progress ", e);
                    try{
                        var r = progressHelper[e.uuid];
                        r && (r.progress.value = e.currentPosition || e.maxChunks || r.progress.max, updateLabel(r.progress, r.label));
                    }catch(e){
                        console.error(" Prolem in progressHelper " , e);
                    }
                },

                rtcConn.onFileEnd = function (file) {
                    var filename = file.name
                    console.log("[start] On file End " + filename);

                    //find duplicate file
                    for(x in webcallpeers){
                        for (y in webcallpeers[x].filearray){
                            console.log(" Duplicate find , Files shared  so far " , webcallpeers[x].filearray[y].name);

                            if(webcallpeers[x].filearray[y].name==filename){
                                //discard file as duplicate
                                console.error("duplicate file shared ");
                                return;
                            }
                        }
                    }

                    var peerinfo = findPeerInfo(file.userid);
                    if (peerinfo != null)  peerinfo.filearray.push(file);
                    displayFile(file.uuid, peerinfo, file.url, filename, file.type);
                    displayList(file.uuid, peerinfo, file.url, filename, file.type);
                },

                rtcConn.takeSnapshot = function (userid, callback) {
                    takeSnapshot({
                        userid: userid,
                        connection: connection,
                        callback: callback
                    });
                };
                console.log(" RTCConn : ", rtcConn);
                resolve("success");
            });
    }

    /**
     * set Widgets.
     */
    var setWidgets = function () {

            var widgetsinstalled = false;

            if (chatobj.active) {

                if (chatobj.inputBox && chatobj.inputBox.text_id && document.getElementById(chatobj.inputBox.text_id)) {
                    assignChatBox(chatobj);
                } else {
                    createChatBox(chatobj);
                }
                console.log("chat widget loaded ");
            } else {
                console.log(" chat widget not loaded ");
            }

            if (screenrecordobj && screenrecordobj.active) {

                if (extensioninstalled == 'installed-enabled') {
                    if (screenrecordobj.button.id && document.getElementById(screenrecordobj.button.id)) {
                        assignScreenRecordButton(screenrecordobj);
                    } else {
                        createScreenRecordButton(screenrecordobj);
                    }
                }

                if (extensioninstalled == 'installed-disabled') {
                    shownotification("chrome extension is installed but disabled.");
                    if (screenrecordobj.button.id && document.getElementById(screenrecordobj.button.id)) {
                        assignScreenRecordButton(screenrecordobj);
                    } else {
                        createScreenRecordButton(screenrecordobj);
                    }
                }

                if (extensioninstalled == 'not-installed') {
                    //nor installed show installation button 
                    alert(" Sessions recoridng cannot start as there is not extension installed ");
                }

                if (extensioninstalled == 'not-chrome') {
                    // using non-chrome browser
                }
                console.log(" screen record widget loaded ");
            } else if (screenrecordobj && !screenrecordobj.active) {
                if (screenrecordobj.button.id && document.getElementById(screenrecordobj.button.id)) {
                    document.getElementById(screenrecordobj.button.id).className = "inactiveButton";
                }
                console.log(" screen record widget not loaded ");
            }

            if (screenshareobj.active) {

                if (extensioninstalled == 'installed-enabled') {
                    var screenShareButton = createOrAssignScreenshareButton(screenshareobj);
                    hideScreenInstallButton();
                }

                if (status == 'installed-disabled') {
                    shownotification("chrome extension is installed but disabled.");
                    var screenShareButton = createOrAssignScreenshareButton(screenshareobj);
                    hideScreenInstallButton();
                }

                if (status == 'not-installed') {

                    //document.getElementById("screensharedialog").showModal();
                    $("#screensharedialog").modal("show");

                    hideScreenShareButton();

                    if (screenshareobj.button.installButton.id && document.getElementById(screenshareobj.button.installButton.id)) {
                        assignScreenInstallButton(screenshareobj.extensionID);
                    } else {
                        createScreenInstallButton(screenshareobj.extensionID);
                    }
                }

                if (status == 'not-chrome') {
                    // using non-chrome browser
                    alert(" Screen share extension only works in Chrome for now ");
                }

                console.log(" screen share widget loaded ");
            } else {
                console.log(" screen share widget not loaded ");
            }

            if (reconnectobj && reconnectobj.active) {
                if (reconnectobj.button.id && document.getElementById(reconnectobj.button.id)) {
                    assignButtonRedial(reconnectobj.button.id);
                } else {
                    createButtonRedial(reconnectobj);
                }
                console.log(" reconnect widget loacded ");
            } else if (reconnectobj && !reconnectobj.active) {
                if (reconnectobj.button.id && document.getElementById(reconnectobj.button.id)) {
                    document.getElementById(reconnectobj.button.id).className = "inactiveButton";
                }
                console.log(" recoonect widget not loaded ");
            }

            if (cursorobj.active) {
                document.getElementById("cursor1").setAttribute("style", "display:none");
                document.getElementById("cursor2").setAttribute("style", "display:none");
            }

            if (listeninobj && listeninobj.active) {
                if (listeninobj.button.id && document.getElementById(listeninobj.button.id)) {
                    //assignButtonRedial(reconnectobj.button.id);
                } else {
                    //createButtonRedial();
                }
                console.log(" listen in widget loaded ");
            } else if (listeninobj && !listeninobj.active) {
                if (listeninobj.button.id && document.getElementById(listeninobj.button.id)) {
                    document.getElementById(listeninobj.button.id).className = "inactiveButton";
                }
                console.log(" listenein widget not loaded ");
            }

            if (timerobj && timerobj.active) {
                //startTime();
                timeZone();
                activateBttons(timerobj);
                document.getElementById(timerobj.container.id).hidden = true;
            } else if (timerobj && !timerobj.active) {
                if (timerobj.button.id && document.getElementById(timerobj.button.id)) {
                    document.getElementById(timerobj.button.id).className = "inactiveButton";
                }
            }

            if (drawCanvasobj && drawCanvasobj.active) {
                if (drawCanvasobj.container && drawCanvasobj.container.id && document.getElementById(drawCanvasobj.container.id)) {
                    document.getElementById(drawCanvasobj.container.id).hidden = true;
                }
                if (drawCanvasobj.button.id && document.getElementById(drawCanvasobj.button.id)) {
                    assigndrawButton(drawCanvasobj);
                } else {
                    createdrawButton(drawCanvasobj);
                }

                CanvasDesigner = (function () {
                    var iframe;
                    var tools = {
                        line: true,
                        pencil: true,
                        dragSingle: true,
                        dragMultiple: true,
                        eraser: true,
                        rectangle: true,
                        arc: true,
                        bezier: true,
                        quadratic: true,
                        text: true
                    };

                    var selectedIcon = 'pencil';

                    function syncData(data) {
                        if (!iframe) return;

                        iframe.contentWindow.postMessage({
                            canvasDesignerSyncData: data
                        }, '*');
                    }

                    var syncDataListener = function (data) {
                        console.log("syncDataListener", data);
                    };

                    function onMessage() {
                        if (!event.data || !event.data.canvasDesignerSyncData) return;
                        syncDataListener(event.data.canvasDesignerSyncData);
                    }

                    /*window.addEventListener('message', onMessage, false);*/

                    var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
                    var eventer = window[eventMethod];
                    var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";

                    // Listen to message from child window
                    eventer(messageEvent, function (e) {
                        console.log("CanvasDesigner parent received message : ", e.data);

                        if (e.data.modalpopup) {
                            saveButtonCanvas.click();
                            return;

                        } else if (e.data || e.data.canvasDesignerSyncData) {
                            syncDataListener(e.data.canvasDesignerSyncData);
                        }

                        if (!e.data || !e.data.canvasDesignerSyncData) {
                            console.log("parent received unexpected message");
                            return;
                        }


                    }, false);

                    return {
                        appendTo: function (parentNode) {
                            iframe = document.createElement('iframe');
                            iframe.id = "drawboard";
                            iframe.src = 'widget.html?tools=' + JSON.stringify(tools) + '&selectedIcon=' + selectedIcon;
                            iframe.style.width = "100%";
                            iframe.style.height = "100%";
                            iframe.style.border = 0;
                            parentNode.appendChild(iframe);
                        },
                        destroy: function () {
                            if (iframe) {
                                iframe.parentNode.removeChild(iframe);
                            }
                            window.removeEventListener('message', onMessage);
                        },
                        addSyncListener: function (callback) {
                            syncDataListener = callback;
                        },
                        syncData: syncData,
                        setTools: function (_tools) {
                            tools = _tools;
                        },
                        setSelected: function (icon) {
                            if (typeof tools[icon] !== 'undefined') {
                                selectedIcon = icon;
                            }
                        }
                    };
                })();
                console.log(" draw widget loaded ");
            } else if (drawCanvasobj && !drawCanvasobj.active) {
                if (drawCanvasobj.button.id && document.getElementById(drawCanvasobj.button.id)) {
                    document.getElementById(drawCanvasobj.button.id).className = "inactiveButton";
                }
                console.log(" draw widget not loaded ");
            }

            if (texteditorobj.active) {
                createTextEditorButton();
            }

            if (codeeditorobj.active) {
                createCodeEditorButton();
            }

            if (fileshareobj.active) {
                rtcConn.enableFileSharing = true;
                //rtcConn.filesContainer = document.body || document.documentElement;
                /*setFileProgressBarHandlers(rtcConn);*/
                rtcConn.filesContainer = document.getElementById(fileshareobj.fileShareContainer);
                if (fileshareobj.button.id && document.getElementById(fileshareobj.button.id)) {
                    assignFileShareButton(fileshareobj);
                } else {
                    createFileShareButton(fileshareobj);
                }
                console.log(" File sharing widget loaded ");
            } else {
                console.log(" File sharing widget not loaded ");
            }

            widgetsinstalled = true;
            
            return widgetsinstalled;
    }


    /**
     * function to start session with socket
     * @method
     * @name startSession
     * @param {object} connection
     */
    function startSession(rtcConn , socketAddr , sessionid){

            console.log("========== startSession" + sessionid);

            try {
                var addr = "/";
                if (socketAddr != "/") {
                    addr = socketAddr;
                }
                socket = io.connect(addr ,{
                                          transports: ['websocket']
                } );
               // socket.set('log level', 3);

            } catch (e) {
                console.error(" problem in socket connnection", e);
                alert(" problem in socket connnection");
            }

            if (sessionid){
                shownotification(" Checking status of  : " + sessionid);
                socket.emit("presence", {
                    channel: sessionid
                });

            } else{
                console.error(" Session Id undefined ");
                alert("rtcCon channel / session id undefined ");
                return; 
            }

            socket.on("connect", function () {
                socket.on('disconnected', function () {
                    shownotification("Disconnected from signaller ");
                });
            });

            socket.on("presence", function (event) {
                console.log("PRESENCE -----------> ", event);
                event ? joinWebRTC(sessionid, selfuserid) : openWebRTC(sessionid, selfuserid);
            });

            socket.on("open-channel-resp", function (event) {
                console.log("========================== opened-channel", event, event.status, event.channel == sessionid);
                if (event.status && event.channel == sessionid) {
                    try {

                        console.log(" [open-channel-resp ] Session video:" ,  outgoingVideo,
                            " audio: " , outgoingAudio ,
                            " data: " , outgoingData , 
                            " OfferToReceiveAudio: " , incomingAudio,
                            " OfferToReceiveVideo: " , incomingVideo
                        );

                        rtcConn.connectionType = "open",

                        rtcConn.session = {
                            video: outgoingVideo,
                            audio: outgoingAudio,
                            data: outgoingData
                        },

                        rtcConn.sdpConstraints.mandatory = {
                            OfferToReceiveAudio: incomingAudio,
                            OfferToReceiveVideo: incomingVideo
                        },

                        rtcConn.open(event.channel, function () {

                            if (selfuserid == null) {
                                selfuserid = rtcConn.userid;

                                if (tempuserid != selfuserid)
                                    socket.emit("update-channel", {
                                        type: "change-userid",
                                        channel: rtcConn.channel,
                                        sender: selfuserid,
                                        extra: {
                                            old: tempuserid,
                                            new: selfuserid
                                        }
                                    });
                            }

                            updatePeerInfo(selfuserid, selfusername, selfcolor, selfemail, "role" , "local");
                            console.info(" Trying to open a channel on WebRTC SDP ");
                            if(outgoingVideo){
                                rtcConn.dontCaptureUserMedia = false,
                                rtcConn.getUserMedia();
                            }else{
                                alert(" [startJS open-channel-resp] dont Capture outgoing video " , outgoingVideo);
                            }
                        });
                    } catch (e) {
                        console.error(e);
                    }

                } else {
                    alert(" signaller doesnt allow channel open");
                }
            });

            socket.on("join-channel-resp", function (event) {
                console.log("===========================joined-channel", event);
                if (event.status && event.channel == sessionid) {
                    
                    console.log(" [ join-channel-resp ] Session video:" ,  outgoingVideo,
                        " audio: " , outgoingAudio ,
                        " data: " , outgoingData , 
                        " OfferToReceiveAudio: " , incomingAudio,
                        " OfferToReceiveVideo: " , incomingVideo
                    ); 

                    rtcConn.connectionType = "join",
                    rtcConn.session = {
                        video: outgoingVideo,
                        audio: outgoingAudio,
                        data: outgoingData
                    },
                    rtcConn.sdpConstraints.mandatory = {
                        OfferToReceiveAudio: incomingAudio,
                        OfferToReceiveVideo: incomingVideo
                    },
                    rtcConn.remoteUsers = event.users,
                    updatePeerInfo(rtcConn.userid, selfusername, selfcolor, selfemail, role, "local"); 

                    for (x in rtcConn.remoteUsers) {
                        updatePeerInfo(rtcConn.remoteUsers[x], remoteusername, remotecolor, remoteemail, "participant" , "remote");
                        if (role == "inspector") shownotificationWarning("This session is being inspected ");
                    }

                    rtcConn.connectionDescription = rtcConn.join(event.channel);

                    console.log(" Trying to join a channel on WebRTC SDP ");

                    if(role != "inspector" && outgoingVideo){
                        rtcConn.dontCaptureUserMedia = false,
                        rtcConn.getUserMedia();
                    }else{
                        alert(" [startJS join-channel-resp] dont Capture outgoing video " , outgoingVideo);
                    }
                    
                } else {
                    shownotification(event.msgtype + " : " + event.message);
                }
            });

            socket.on("channel-event", function (event) {
                console.log("channel-event", event);
                if (event.type == "new-join") {
                    if (event.status) {
                        var peerinfo = findPeerInfo(event.data.sender);
                        if (!peerinfo) {
                            if (event.data.extra.name == "LOCAL") {
                                event.data.extra.name = "REMOTE";
                                event.data.extra.color = remotecolor;
                            }
                            updatePeerInfo(event.data.sender, event.data.extra.name, event.data.extra.color, event.data.extra.email, event.data.extra.role , "remote");
                            shownotification( event.data.extra.role  + "  " +event.type);
                        }
                    } else {
                        shownotification(event.msgtype + " : " + event.message);
                    }
                }
            });
    }


    /**
     * Update local cache of user sesssion based object called peerinfo
     * @method
     * @name updateWebCallView
     * @param {json} peerInfo
     */
    function updateWebCallView(peerInfo){
        console.log("updateWebCallView - start with peerInfo" , peerInfo , " || role is ", role , " ||  indexOf ", peerInfo.vid.indexOf("videoundefined") );
        try{
            switch(role){
                case "inspector":
                    var vi=0;
                    for(var v=0; v<remoteVideos.length; v++){
                        console.log("Remote Video index array " , v , " || ", remoteVideos[v] , 
                            document.getElementsByName(remoteVideos[v])  , 
                            document.getElementsByName(remoteVideos[v]).src);
                        if(remoteVideos[v].src){
                            vi++;
                        }
                    }

                    var remvid;
                    var video = document.createElement('video');
                    video.autoplay = "autoplay";
                    remoteVideos[vi] = video;
                    document.getElementById(remoteobj.videoContainer).appendChild(video);
                    remvid = remoteVideos[vi];

                    console.log(" [start.js - updateWebCallView] inspector role , attaching stream" , remvid, peerInfo.stream );
                    attachMediaStream(remvid, peerInfo.stream);
                    if(remvid.hidden) removid.hidden = false;
                    remvid.id = peerInfo.videoContainer;
                    remvid.className = remoteobj.videoClass;
                    attachControlButtons(remvid, peerInfo); 

                    if(remoteobj.userDisplay && peerInfo.name ){
                        attachUserDetails( remvid, peerInfo); 
                    }
                    
                    if(remoteobj.userMetaDisplay && peerInfo.userid){
                        attachMetaUserDetails( remvid, peerInfo ); 
                    }

                    //Hide the unsed video for Remote
                    var _templ=document.getElementsByName(localVideo)[0];
                    _templ.setAttribute("style","display:none");
                    var _templ2=document.getElementsByName(selfVideo)[0];
                    _templ2.setAttribute("style","display:none");
                break;

                case "user":
                case "participant":

                    if(peerInfo.vid.indexOf("videolocal") > -1 ){
                        console.info(" PeerInfo Vid is Local");

                        // when video is local

                        // hide the remote video conatiner and show the local video container
                        // as the user is single in room 
                        document.getElementById(localobj.videoContainer).style.display= null;
                        document.getElementById(remoteobj.videoContainer).style.display= "none";

                        if(localVideo && document.getElementsByName(localVideo)[0]){
                            var vid = document.getElementsByName(localVideo)[0];
                            vid.muted = true;
                            vid.className = localobj.videoClass;
                            attachMediaStream(vid, peerInfo.stream);

                            if(localobj.userDisplay && peerInfo.name)
                                attachUserDetails( vid, peerInfo ); 
                            
                            if(localobj.userMetaDisplay && peerInfo.userid)
                                attachMetaUserDetails( vid , peerInfo ); 

                            console.info(" User is alone in the session  , hiding remote video container" , 
                            "showing users single video conrainer and attaching attachMediaStream and attachUserDetails ");

                        }else{
                            alert(" Please Add a video container in config for single");
                            console.error(" No local video conatainer in localobj -> " , localobj);
                        }

                    } else if(peerInfo.vid.indexOf("videoremote") > -1) {
                        //when video is remote 
                        // hide the local video conagineer and how the remote video container
                        // user is joined with othe peers 
                        document.getElementById(localobj.videoContainer).style.display= "none";
                        document.getElementById(remoteobj.videoContainer).style.display= null;


                        /* handling local video transistion to active */
                        if( outgoingVideo && localVideo && selfVideo ){
                            /*chk if local video is added to conf , else adding local video to index 0 */
                            //localvid : video container before p2p session 
                            var localvid = document.getElementsByName(localVideo)[0];
                            // selfvid : local video in a p2p session
                            var selfvid = document.getElementsByName(selfVideo)[0];
                            
                            if(selfvid.played.length==0){
                                if(localvid.played.lebth>0){
                                    reattachMediaStream(selfvid, localvid);
                                }else{
                                    attachMediaStream(selfvid, webcallpeers[0].stream);
                                }
                                selfvid.id = webcallpeers[0].videoContainer;
                                selfvid.className = remoteobj.videoClass;
                                selfvid.muted = true;
                                attachControlButtons( selfvid, webcallpeers[0]); 

                                if(localobj.userDisplay && webcallpeers[0].name){
                                    attachUserDetails( selfvid, webcallpeers[0] );
                                } 

                                if(localobj.userMetaDisplay && webcallpeers[0].userid){
                                    attachMetaUserDetails( selfvid, webcallpeers[0] ); 
                                }
                            }else{
                                console.log(" not uppdating self video as it is already playing ");
                            }

                            console.info(" User is joined by a remote peer , hiding local video container" , 
                            "showing users conf video container and attaching attachMediaStream and attachUserDetails ");

                        }else if(!outgoingVideo){
                            console.error(" Outgoing Local video is " , outgoingVideo);
                        }else{
                            alert(" Please Add a video container in config for video call ");
                            console.error(" Local video container not defined ");
                        }


                        // handling remote video addition 
                        if(remoteVideos){

                            /*get the next empty index of video and pointer in remote video array */
                            var vi=0;
                            for(var v=0; v<remoteVideos.length; v++){
                                console.log("Remote Video index array " , v , " || ", remoteVideos[v] , 
                                    document.getElementsByName(remoteVideos[v]),  document.getElementsByName(remoteVideos[v]).src);
                                if(document.getElementsByName(remoteVideos[v])[0].src){
                                    vi++;
                                }
                            }

                            try{

                                if(remoteobj.maxAllowed=="unlimited"){
                                    console.log("remote video is unlimited , creating video for remoteVideos array ");
                                    var video = document.createElement('video');
                                    video.autoplay = "autoplay";
                                    remoteVideos[vi] = {
                                        "userid": peerInfo.userid, 
                                        "video" : video
                                    };
                                    document.getElementById(remoteobj.dynamicVideos.videoContainer).appendChild(video);
                                }else{
                                    console.log("remote video is limited to size maxAllowed , current index ", vi);
                                    console.log("searching for video with index ", vi , " in remote video : " , document.getElementsByName(remoteVideos[vi])[0] );
                                    if(document.getElementsByName(remoteVideos[vi])[0]){
                                        remoteVideos[vi] = { 
                                            "userid": peerInfo.userid, 
                                            "video" :  document.getElementsByName(remoteVideos[vi])[0] 
                                        };
                                    }else{
                                        console.error(" document.getElementsByName(remoteVideos[vi])[0] doest exist for vi " , vi);
                                    }
                                }

                                attachMediaStream(remoteVideos[vi].video, peerInfo.stream);
                                if(remoteVideos[vi].video.hidden) remoteVideos[vi].video.hidden = false;
                                remoteVideos[vi].video.id = peerInfo.videoContainer;
                                remoteVideos[vi].video.className = remoteobj.videoClass;
                                attachControlButtons(remoteVideos[vi].video, peerInfo); 

                                if(remoteobj.userDisplay && peerInfo.name ) {
                                    attachUserDetails( remoteVideos[vi].video, peerInfo); 
                                }
                                
                                if(remoteobj.userMetaDisplay && peerInfo.userid) {
                                    attachMetaUserDetails( remoteVideos[vi].video, peerInfo ); 
                                }
                            
                            }catch(e){
                                console.error(e);
                            }

                        }else{
                            alert("remote Video containers not defined");
                        }
                    
                    } else {
                        console.error(" PeerInfo vid didnt match either case ");
                    }
                break;

                default:
                    console.log(" Switch default case");
            }


        }catch(e){
            console.error("[ start.js - update call view ]" , e);
        }

        console.log(" updateWebCallView - finish");
    }
  
    /********************************************************************************** 
            Session call and Updating Peer Info
    ************************************************************************************/
    var repeatInitilization = null;

    /**
     * find information about a peer form array of peers basedon userid
     * @method
     * @name findPeerInfo
     * @param {string} userid
     */
    function startCall(obj){
        if(turn=='none'){
            obj.startwebrtcdev();
        }else if(turn!=null){
            repeatInitilization = window.setInterval(obj.startwebrtcdev, 2000);     
        }

        return;
    }

    /**
     * update info about a peer in list of peers (webcallpeers)
     * @method
     * @name updatePeerInfo
     * @param {string} userid
     * @param {string} username
     * @param {string} usercolor
     * @param {string} type
     */
    function updatePeerInfo(userid , username , usecolor , useremail, userrole ,  type ){
        console.log("updating peerInfo: " , userid , username , usecolor , useremail, userrole ,  type);
        for(x in webcallpeers){
            if(webcallpeers[x].userid==userid) {
                console.log("UserID is already existing , webcallpeers");
                return;
            }
        }

        peerInfo={ 
            videoContainer : "video"+userid,
            videoHeight : null,
            videoClassName: null,
            userid : userid , 
            name  :  username,
            color : usecolor,
            email : useremail,
            role : userrole,
            controlBarName: "control-video"+userid,
            filearray : [],
            vid : "video"+type+"_"+userid
        };
     
        if(fileshareobj.active ){

            if(fileshareobj.props.fileShare=="single"){
                peerInfo.fileShare={
                    outerbox: "widget-filesharing-box",
                    container : "widget-filesharing-container",
                    minButton: "widget-filesharing-minbutton",
                    maxButton: "widget-filesharing-maxbutton",
                    closeButton: "widget-filesharing-closebutton"
                };
            }else{
                peerInfo.fileShare={
                    outerbox: "widget-filesharing-box"+userid,
                    container : "widget-filesharing-container"+userid,
                    minButton: "widget-filesharing-minbutton"+userid,
                    maxButton: "widget-filesharing-maxbutton"+userid,
                    closeButton: "widget-filesharing-closebutton"+userid
                };
            }

            if(fileshareobj.props.fileList=="single"){
                peerInfo.fileList={
                    outerbox: "widget-filelisting-box",
                    container : "widget-filelisting-container"
                };
            }else{
                peerInfo.fileList={
                    outerbox: "widget-filelisting-box"+userid,
                    container : "widget-filelisting-container"+userid
                };
            }

        }
        console.log("updated peerInfo: " ,peerInfo);
        webcallpeers.push(peerInfo);

        // Update the web call view 
        // updateWebCallView(peerInfo);
    }

    /**
     * update info about a peer in list of peers (webcallpeers)
     * @method
     * @name removePeerInfo
     * @param {string} userid
     * @param {string} usernamess
     * @param {string} usercolor
     * @param {string} type
     */
    function removePeerInfo(userid){
        console.log(" [removePeerInfo] Before  " , webcallpeers);
        console.log(" [removePeerInfo] Removing peerInfo: " , userid);
        webcallpeers.splice(userid, 1);
        console.log(" [removePeerInfo] After removing peerInfo" , webcallpeers);
    }

    function destroyWebCallView(peerInfo , callback){
        console.log(" [destroyWebCallView] peerInfo" , peerInfo);
        if( peerInfo.videoContainer && document.getElementById(peerInfo.videoContainer))
            document.getElementById(peerInfo.videoContainer).src="";
        
        /*if(fileshareobj.active){
            if(fileshareobj.props.fileShare){
                if(fileshareobj.props.fileShare=="divided")
                    console.log("dont remove it now ");
                    //createFileSharingDiv(peerInfo);
                else if(fileshareobj.props.fileShare=="single")
                    console.log("No Seprate div created for this peer  s fileshare container is single");
                else
                    console.log("props undefined ");
            }
        }*/

        callback(true);
    }

    /**
     * find information about a peer form array of peers basedon userid
     * @method
     * @name findPeerInfo
     * @param {string} userid
     */
    findPeerInfo = function (userid){
        var peerInfo;
        /*    
        if(rtcConn.userid==userid){
            console.log("PeerInfo is found for initiator", webcallpeers[0]);
            return webcallpeers[0];
        }
        */
        for(x in webcallpeers){
            if(webcallpeers[x].userid==userid) {
                return webcallpeers[x];
            }
        }
        return null;
    }


    /**
     * Open a WebRTC socket channel
     * @method
     * @name opneWebRTC
     * @param {string} channel
     * @param {string} userid
     */
    openWebRTC=function(channel , userid){
         socket.emit("open-channel", {
            channel    : channel,
            sender     : tempuserid,
            maxAllowed : remoteobj.maxAllowed
        });
        
        shownotification(" Making a new session ");
    }


    /**
     * connect to a webrtc socket channel
     * @method
     * @name connectWebRTC
     * @param {string} type
     * @param {string} channel
     * @param {string} userid
     * @param {string} remoteUsers
     */
    connectWebRTC=function(type, channel, userid ,remoteUsers){
        console.info(" [start ConnectWebRTC ] type : " , type , " , Channel :" , channel , 
                                        " , Userid : " ,  userid , " , remote users : " , remoteUsers);
        /*void(document.title = channel);*/
        if(fileshareobj.active){
            
            //Do not create file share and file viewer for inspector's own session 
            var selfpeerinfo = findPeerInfo(userid);

            if(fileshareobj.props.fileShare=="single"){
                createFileSharingDiv(selfpeerinfo);
                document.getElementById(peerInfo.fileShare.outerbox).style.width="100%";
            } else if(fileshareobj.props.fileShare=="divided"){
                
                // create local File sharing window 
                if(role!="inspector") {
                    console.log(" [start connectWebRTC] creating local file sharing");
                    createFileSharingDiv(selfpeerinfo);
                }else{
                    console.log(" [start] Since it is an inspectors own session , not creating local File viewer and list");
                }
                
                // create remotes File sharing window 
                for(x in webcallpeers){
                    if(webcallpeers[x].userid != userid && webcallpeers[x].role != "inspector"){
                        console.log(" [start connectWebRTC] creating remote file sharing ");
                        createFileSharingDiv(webcallpeers[x]);
                    }
                }
                requestOldFiles();

            }else{
                console.error("fileshareobj.props.fileShare undefined ");
            }
            

            if(fileshareobj.props.fileList=="single"){
                document.getElementById(peerInfo.fileList.outerbox).style.width="100%";
            }else if(fileshareobj.props.fileShare!="single"){
                console.log("No Seprate div created for this peer since fileshare container is single");
            }else{
                console.error("fileshareobj.props.fileShare undefined ");
            }

        }
        /*localStorage.setItem("channel", channel);
        localStorage.setItem("userid", userid);
        localStorage.setItem("remoteUsers", remoteUsers);*/
    }


    /**
     * function to join w webrtc socket channel
     * @method
     * @name joinWebRTC
     * @param {string} channel
     * @param {string} userid
     */
    joinWebRTC=function(channel , userid){
        shownotification("Joining an existing session "+channel+ " selfuserid "+ selfuserid);
        console.log("Joining an existing session "+channel+ " selfuserid "+ selfuserid);
        
        if (selfuserid==null)
            selfuserid=tempuserid;

        socket.emit("join-channel", {
            channel: channel,
            sender: selfuserid,
            extra: {
                userid:selfuserid,
                name:selfusername,
                color:selfcolor,
                email:selfemail,
                role: role
            }
        });
    }

    /**
     * function to leave a webrtc socket channel
     * @method
     * @name leaveWebRTC
     */
    leaveWebRTC=function(){
        shownotification("Leaving the session ");
    }

    /*window.onload=function(){
        console.log( "Local Storage Channel " ,   localStorage.getItem("channel"));
    };
    */
    window.onunload=function(){
        console.log( localStorage.getItem("channel"));
        alert(" Refreshing the Page will loose the session data");
    };

    /**
     * function to interact with background script of chrome extension
     * @call
     * @name addeventlistener
     */
    window.addEventListener('message', function(event){
        console.log("------ message from Extension " , event);
        if (event.data.type) {
            if(event.data.type=="screenshare"){
                onScreenshareExtensionCallback(event);
            }else if(event.data.type=="screenrecord"){
                onScreenrecordExtensionCallback(event);
            }
        }else if(event.data=="webrtcdev-extension-getsourceId-audio-plus-tab"){
            onScreenrecordExtensionCallback(event);
        }else{
            onScreenshareExtensionCallback(event);
        }

    }); 

}catch(e){
    console.log("exception in start " , e);
}