const obs = new OBSWebSocket();
let interval1;
openNav();
document.getElementById("disconnect").disabled = true
isRecording = false
isStreaming = false
document.getElementById('address').value = `${location.hostname}`

function streaming(isStarted) {
  const streamingElement = document.getElementById('streaming');
  if (isStarted) {
    if (window.confirm('STOP STREAMING?')) {
      obs.send('StopStreaming');
      streamingElement.className = 'bg-danger'
      streamingElement.textContent = 'Streaming: OFFLINE';
      isStreaming = !isStreaming
    }
  } else {
    if (window.confirm('START STREAMING?')) {
      obs.send('StartStreaming');
      streamingElement.className = 'bg-success'
      streamingElement.textContent = 'Streaming: ONLINE';
      isStreaming = !isStreaming
    }
  }
}

function recording(isStarted) {
  const recordingElement = document.getElementById('recording');
  if (isStarted) {
    if (window.confirm('STOP RECORDING?')) {
      obs.send('StopRecording');
      recordingElement.className = 'bg-danger'
      recordingElement.textContent = 'Recording: stop';
      isRecording = !isRecording
    }
  } else {
    if (window.confirm('START RECORDING?')) {
      obs.send('StartRecording');
      recordingElement.className = 'bg-success'
      recordingElement.textContent = 'Recording: start';
      isRecording = !isRecording
    }
  }
}
document.getElementById('connect').addEventListener('click', e => {
  const address = document.getElementById('address').value;
  const password = document.getElementById('password').value;
  $(".login").hide();
  closeNav();
  obs.connect({
    address: address+":4444",
    password: password
  }).then(() => {
    document.getElementById("connect").disabled = true
    document.getElementById("disconnect").disabled = false
    obs.send('GetStudioModeStatus').then(status => {
      if (!status.studioMode) obs.send('EnableStudioMode').catch((err) => {
        console.error(err)
      });
    })
    obs.send('GetSceneList').then(data => {
      const sceneList = document.getElementById('scene_list');
      data.scenes.forEach(scene => {
        const sceneElement = document.createElement('button');
        sceneElement.innerHTML = scene.name + " <small><small><small><span class='isSelected badge badge-success'></span><span class='isActive badge badge-danger'></span></small></small></small>";
        sceneElement.className = 'scenne ' + scene.name.replaceAll(" ", "");
        sceneElement.onclick = function () {
          obs.send('SetPreviewScene', {
            'scene-name': scene.name
          });
          obs.send('GetPreviewScene').then(data => {
            document.getElementById("selectedScene").textContent = data.name;
          });
        };
        obs.send('GetPreviewScene').then(data => {
          document.getElementById("selectedScene").textContent = data.name;
        });
        sceneList.appendChild(sceneElement);
      });
    }).catch((err) => {
      console.log(err)
    });
    obs.send('GetTransitionList').then(data => {
      const transitionList = document.getElementById('transition_list');
      data.transitions.forEach(transition => {
        const transitionElement = document.createElement('button');
        transitionElement.textContent = transition.name;
        transitionElement.className = 'transition bg-success';
        transitionElement.onclick = function () {
          obs.send('SetCurrentTransition', {
            'transition-name': transition.name
          });
          obs.send('TransitionToProgram', {
            'with-transition.name': transition.name
          });
          obs.send('GetPreviewScene').then(data => {
            document.getElementById("selectedScene").textContent = data.name;
          });
        };
        transitionList.appendChild(transitionElement);
      });
    }).catch((err) => {
      console.log(err)
    });
    obs.send('GetStreamingStatus').then((data) => {
      isRecording = data.recording
      isStreaming = data.streaming
      const controller = document.getElementById('controller_list');
      if (isStreaming) {
        const streamingStatusElement = document.createElement('button');
        streamingStatusElement.textContent = 'Streaming: ONLINE';
        streamingStatusElement.className = 'started bg-success'
        streamingStatusElement.id = 'streaming'
        streamingStatusElement.onclick = function () {
          streaming(!isStreaming)
        };
        controller.appendChild(streamingStatusElement);
      } else {
        const streamingStatusElement = document.createElement('button');
        streamingStatusElement.textContent = 'Streaming: OFFLINE';
        streamingStatusElement.className = 'stopped bg-danger'
        streamingStatusElement.id = 'streaming'
        streamingStatusElement.onclick = function () {
          streaming(isStreaming)
        };
        controller.appendChild(streamingStatusElement);
      }
      if (isRecording) {
        const recordingStatusElement = document.createElement('button');
        recordingStatusElement.textContent = 'Recording: start';
        recordingStatusElement.className = 'started bg-success'
        recordingStatusElement.id = 'recording'
        recordingStatusElement.onclick = function () {
          recording(!isRecording)
        };
        controller.appendChild(recordingStatusElement);
      } else {
        const recordingStatusElement = document.createElement('button');
        recordingStatusElement.textContent = 'Recording: stop';
        recordingStatusElement.className = 'stopped bg-danger'
        recordingStatusElement.id = 'recording'
        recordingStatusElement.onclick = function () {
          recording(isRecording)
        };
        controller.appendChild(recordingStatusElement);
      }
    }).catch((err) => {
      console.log(err)
    });
    obs.send('GetSourcesList').then((data) => {
      data = Object.values(data.sources).filter(data => data.name.match(/(音声|マイク)/));
      while (document.getElementById('audio_list').firstChild) {
        document.getElementById('audio_list').removeChild(document.getElementById('audio_list').firstChild);
      }
      const volParent = document.getElementById('audio_list')
      data.forEach(volume => {
        const volChildParent = document.createElement('div')
        const volName = document.createElement('p')
        volName.textContent = volume.name
        volChildParent.appendChild(volName)
        obs.send('GetVolume', {
          'source': volume.name
        }).then((vol) => {
          const volChild = document.createElement('input')
          volChild.type = 'range'
          volChild.min = 0
          volChild.max = 1
          volChild.step = 0.01
          volChild.value = Math.sqrt(vol.volume)
          volChild.className = ''
          volChild.onchange = function () {
            obs.send('SetVolume', {
              'source': volume.name,
              'volume': this.value ** 2
            });
          };
          volChildParent.appendChild(volChild)
        }).catch((err) => {
          console.log(err)
        });
        obs.send('GetMute', {
          'source': volume.name
        }).then((mutes) => {
          const muteChild = document.createElement('input')
          muteChild.type = 'checkbox'
          muteChild.checked = mutes.muted
          muteChild.className = 'mute'
          muteChild.onchange = function () {
            obs.send('SetMute', {
              'source': volume.name,
              'mute': this.checked
            });
          };
          volChildParent.appendChild(muteChild)
          volParent.appendChild(volChildParent);
        }).catch((err) => {
          console.log(err)
        });
      })
    });
    startSceneTimer();
  }).catch((err) => {
    window.alert(err.error)
    $(".login").show();
  });
});
document.getElementById('disconnect').addEventListener('click', e => {
  obs.disconnect()
  document.getElementById("connect").disabled = false
  document.getElementById("disconnect").disabled = true
  while (document.getElementById('scene_list').firstChild) {
    document.getElementById('scene_list').removeChild(document.getElementById('scene_list').firstChild);
  }
  while (document.getElementById('transition_list').firstChild) {
    document.getElementById('transition_list').removeChild(document.getElementById('transition_list').firstChild);
  }
  while (document.getElementById('controller_list').firstChild) {
    document.getElementById('controller_list').removeChild(document.getElementById('controller_list').firstChild);
  }
  while (document.getElementById('audio_list').firstChild) {
    document.getElementById('audio_list').removeChild(document.getElementById('audio_list').firstChild);
  }
  $(".login").show();
  openNav();
  stopInterval(interval1);
});
setInterval(function () {
  const date = new Date()
  document.getElementById('time').textContent = ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2) + ':' + ('0' + date.getSeconds()).slice(-2) + '.' + ('00' + date.getMilliseconds()).slice(-3);
}, 0);

function startSceneTimer() {
  interval1 = setInterval(function () {
    obs.send('GetPreviewScene').then(data => {
      document.getElementById("selectedScene").textContent = data.name;
      $(".isSelected").html("");
      $("."+data.name.replaceAll(" ", "") + " .isSelected").html("選択中");
    });
    obs.send('GetCurrentScene').then(data => {
      document.getElementById("streamingScene").textContent = data.name;
      changeAllColorsWith("scenne", "#dc3545");
      changeAllColorsWith(data.name.replaceAll(" ", ""), "#28a745");
      $(".isActive").html("");
      $("."+data.name.replaceAll(" ", "") + " .isActive").html("配信中");
    });
  }, 1000);
}

function changeAllColorsWith(className, hex) {
  var elements = document.getElementsByClassName(className);
  for (i = 0; i < elements.length; i++) {
    elements[i].style.backgroundColor = hex;
  }
}

function changeAllBordersWith(className, hex) {
  var elements = document.getElementsByClassName(className);
  for (i = 0; i < elements.length; i++) {
    elements[i].style.borderColor = hex;
  }
}

function openNav() {
  document.getElementById("myNav").style.width = "100%";
}
/* Close when someone clicks on the "x" symbol inside the overlay */
function closeNav() {
  document.getElementById("myNav").style.width = "0%";
}
$("#reloadScene").click(function(){
  $("#scene_list").html("");
  obs.send('GetSceneList').then(data => {
      const sceneList = document.getElementById('scene_list');
      data.scenes.forEach(scene => {
        const sceneElement = document.createElement('button');
        sceneElement.innerHTML = scene.name + " <small><small><small><span class='isSelected badge badge-success'></span><span class='isActive badge badge-danger'></span></small></small></small>";
        sceneElement.className = 'scenne ' + scene.name.replaceAll(" ", "");
        sceneElement.onclick = function () {
          obs.send('SetPreviewScene', {
            'scene-name': scene.name
          });
          obs.send('GetPreviewScene').then(data => {
            document.getElementById("selectedScene").textContent = data.name;
          });
        };
        obs.send('GetPreviewScene').then(data => {
          document.getElementById("selectedScene").textContent = data.name;
        });
        sceneList.appendChild(sceneElement);
      });
    }).catch((err) => {
      console.log(err)
    });
})

  window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
  var pc = new RTCPeerConnection({ iceServers: [] }), noop = function () { };
  var myIP;

  pc.createDataChannel('');

  pc.createOffer(pc.setLocalDescription.bind(pc), noop);

  pc.onicecandidate = function (ice) {
    if (ice && ice.candidate && ice.candidate.candidate) {

      // 正規表現でIPアドレスを表示する
      myIP = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/.exec(ice.candidate.candidate)[1];
      console.log(myIP);
      const ip = document.getElementById("ip");
      ip.textContent = myIP;
      pc.onicecandidate = noop;
    }
  };