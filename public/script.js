/**
 * Getting nickname
*/
let username = "";

const getUsername = () => {
    username = prompt("Please enter your name:");
    if (username == null || username == "") {
        username = "Happy cat";
    }
    console.log(username);
  }

  getUsername();

let uId = "";
const socket = io('/');
const videoGrid = document.getElementById('video-grid');


/**
 * creating a new peer connection, the id is automatically created by peer
*/
const myPeer = new Peer(undefined, {
    path: '/peerjs',
    host:'/',
    //port: '3030'
    port: '443'
}); 

let myVideoStream;

const myVideo = document.createElement('video');
myVideo.muted = true; //Important to fix the local echo
const peers = {};

if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
    console.log("Let's get this party started");
  }

/**
 * getting video and audio from chrome using a promise (event in the future that will be either resolved or rejected)
 */
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);


    //Answering call from user2
    myPeer.on('call', call => {
        call.answer(stream);
        const video = document.createElement('video');

        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream);
        });
    });

    socket.on('user-connected', (userId) => {
        connectToNewUser(userId, stream);
    });

    let text = $('input');

    $('html').keydown((e) => {
        if(e.which == 13 && text.val().length !== 0) { //13 is the enter code of the keyborad
            //console.log(text.val());
            
            /*socket.emit('username', username); // sending a msg from the front end
            socket.emit('message', text.val()); 
            text.val('');// clearing the input after presing enter*/

            let message = {
                username: username,
                text: text.val()
            };

            socket.emit('message', message);  // sending a msg from the front end
            text.val('');// clearing the input after presing enter*/
            
        }
    });

    socket.on('createMessage', message => {
        if (username == message.username){
            $('.messages').append(`<li class="my-messages"><b>${message.username}</b></br>${message.text}</li>`); 
        }
        else {
            $('.messages').append(`<li class="message"><b>${message.username}</b></br>${message.text}</li>`);
        }
        
    });

}).catch(function (err0r) {
    console.log("Something went wrong!");
});

socket.on('user-disconnected', userId => {
    if (peers[userId]) peers[userId].close();
});

myPeer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id);
});



/** Sending the user our own video stream,
* we use peerjs to send stream from one user to another
*/
const connectToNewUser = (userId, stream) => {
    const call = myPeer.call(userId, stream); //User1 calls user2. User1 sends stream to user2
    const video = document.createElement('video'); // We create a new video element for user2
    
    call.on('stream', userVideoStream => { // When we receive the stream from user2
        addVideoStream(video, userVideoStream); // We add it to the call
        //video.className = "video-big";
    });

    call.on('close', () => {
        video.remove();
    });
    
    peers[userId] = call;
}



const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    });

    videoGrid.append(video);
}

const scrollToBottom = () => {
    let d = $('.main__chat_window');
    d.scrollToBottom(d.prop("scrollHeight"));
}

/** 
 * Controls
 */

// Mutes audio
const muteUnmute = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        setUnmuteButton();
    }
    else {
        setMuteButton();
        myVideoStream.getAudioTracks()[0].enabled = true;
    }
}

const setMuteButton = () => {
    const html = `<i class="fas fa-microphone"></i><span>Mute</span>`
    document.querySelector('.main__mute_button').innerHTML = html;
}

const setUnmuteButton = () => {
    const html = `<i class="unmute fas fa-microphone-slash"></i><span>Unmute</span>`
    document.querySelector('.main__mute_button').innerHTML = html;
}

// Stops video
const playStop = () => {
    const enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        setPlayVideo();
    }
    else {
        setStopVideo();
        myVideoStream.getVideoTracks()[0].enabled = true;
    }
}

const setStopVideo = () => {
    const html = `<i class="fas fa-video"></i><span>Stop video</span>`
    document.querySelector('.main__video_button').innerHTML = html;
}

const setPlayVideo = () => {
    const html = `<i class="stop fas fa-video-slash"></i><span>Start video</span>`
    document.querySelector('.main__video_button').innerHTML = html;
}

const leaveCall = () => {
    myVideoStream.getVideoTracks()[0].enabled = false;
    myVideoStream.getAudioTracks()[0].enabled = false;
    document.querySelector('#video-grid').innerHTML = "";
    const html = "You have left the call.";
    document.querySelector('#leave-call').innerHTML = html;
    myVideoStream.getVideoTracks()[0].stop();
    myVideoStream.getAudioTracks()[0].stop();
}

