var VideoRecorder = (function () {

    function VideoRecorder(afterRecordCallBack) {
        this.recordMode = 'video';
        this.cameraMode = 'user';
        this.isRecording = false;
        this.recorder = undefined;
        this.dataUri;
        this._afterRecordCallBack = afterRecordCallBack;
        this.defaultConstraints = {
            video: {
                width: {
                    ideal: 1280,
                },
                height: {
                    ideal: 720,
                },
                facingMode: this.cameraMode
            },
            audio: true
        };
    }

    VideoRecorder.prototype.Show = function () {
        var _this = this;
        $("body").append(`
        <div id="vr_container">
            <input type="button" id="vr_close" class="hideOnRecord">
            <input type="button" id="vr_switchRecordMode" class="hideOnRecord">
            <input type="button" id="vr_switchCamera" class="hideOnRecord cameraMode">
            <input type="button" id="vr_record">
            <input type="button" id="vr_captureImage" class="hideOnRecord cameraMode">
            <input type="button" id="vr_acceptCapture">
            <input type="button" id="vr_cancleCapture">          
            <video poster="poster.png" id="vr_preview" style="margin:auto; width: 100%; height: 100%;" autoplay muted></video>
            <video id="vr_capturedVideo" style="margin:auto; width: 100%; height: 100%; display:none" controls></videos>
        </div>
        <div id="im_recorder" hidden>
        </div>    
        `);

        $("#vr_close").on('click', () => _this.Close());
        $("#vr_captureImage").on('click', () => _this.SwitchToCaptureImage());
        $("#vr_record").on('click', () => _this.Record());
        $("#vr_switchCamera").on('click', () => _this.SwitchCamera());
        $("#vr_switchRecordMode").on('click', () => _this.SwitchRecordMode());
        $("#vr_acceptCapture").on('click', () => _this.AccpetCapture());
        $("#vr_cancleCapture").on('click', () => _this.RejectCapture());

        window.document.onkeydown = function (e) {
            if ((e.key && e.key === 27) || (e.keyCode && e.keyCode === 27)) {
                this.Close();
            }
        };
        this.previewElement = document.getElementById("vr_preview");
        this.captureVideoElement = document.getElementById("vr_capturedVideo");
        this.ApplyConstraints();

    }
    VideoRecorder.prototype.Record = function () {
        _this = this;
        if (this.recordMode == 'image') {
            var w = this.previewElement.videoWidth;
            var h = this.previewElement.videoHeight;
            var canvas = document.createElement('canvas');
            canvas.style.display = "none";
            canvas.width = w;
            canvas.height = h;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(this.previewElement, 0, 0, w, h);
            canvas.toBlob((recordedBlob) => {
                _this.data = recordedBlob;
                var videoElement = document.getElementById("vr_capturedVideo");
                if ($(videoElement).attr('controls'))
                    $(videoElement).removeAttr('controls');
                videoElement.src = '';
                videoElement.poster = URL.createObjectURL(recordedBlob);
                _this.dataUri = URL.createObjectURL(recordedBlob);
            });
            this.PreviewCapturedItem();
        }
        else {
            $("#vr_record").toggleClass("recording");
            $(".hideOnRecord").toggleClass('hideItem');
            if (!this.isRecording) {
                this.isRecording = true;
                console.log("RecordVideo");
                this.recorder = new MediaRecorder(this.stream);
                this.data = [];
                this.recorder.ondataavailable = (event) => {
                    _this.data.push(event.data);
                    let recordedBlob = new Blob(_this.data, { type: `${_this.recordMode}/webm` });
                    var videoElement = document.getElementById("vr_capturedVideo");
                    if (!$(videoElement).attr('controls'))
                        $(videoElement).attr('controls', true);
                    videoElement.poster = 'poster.png';
                    videoElement.src = URL.createObjectURL(recordedBlob);
                    _this.dataUri = URL.createObjectURL(recordedBlob);
                }
                this.recorder.start();
            }
            else {
                this.isRecording = false;
                this.recorder.stop();
                this.PreviewCapturedItem();
            }
        }
    }
    VideoRecorder.prototype.PreviewCapturedItem = function () {
        _this = this;
        $("input[id^='vr_']").toggleClass('preview');
        $("#vr_capturedVideo").css('display', '');
        $("#vr_preview").css('display', 'none');
        if (this.recordMode != 'image') {
            this.StopStream();
            if ($(this.previewElement).attr('autoplay'))
                $(this.previewElement).removeAttr('autoplay');
            if ($(this.previewElement).attr('muted'))
                $(this.previewElement).removeAttr('muted');
        }
    }

    VideoRecorder.prototype.AccpetCapture = function () {

        $("input[id^='vr_']").toggleClass('preview');
        this._afterRecordCallBack({ data: this.dataUri, type: this.recordMode });
        this.Close();
    }

    VideoRecorder.prototype.RejectCapture = function () {
        $("input[id^='vr_']").toggleClass('preview');
        this.ApplyConstraints();
    }

    VideoRecorder.prototype.SwitchCamera = function () {

        var _this = this;
        console.log("SwitchCamera")
        if (this.cameraMode == 'user') {
            this.cameraMode = "environment";
            this.defaultConstraints.video.facingMode = "environment";
        }
        else {
            this.cameraMode = "user";
            this.defaultConstraints.video.facingMode = "user";
        }
        _this.ApplyConstraints();

    }

    VideoRecorder.prototype.SwitchToCaptureImage = function () {

        console.log("CaptureImage");
        $("#vr_captureImage").toggleClass('imageMode');
        $("#vr_switchRecordMode").toggleClass('imageMode');
        if (this.recordMode !== 'image') {
            this.recordMode = 'image';
        }
        else {
            this.recordMode = 'video';
        }
    }

    VideoRecorder.prototype.SwitchRecordMode = function () {

        console.log("SwitchRecordMode")
        $("#vr_switchRecordMode").toggleClass('noVideo');
        $(".cameraMode").toggleClass('hide');
        if (this.recordMode == 'video') {
            this.recordMode = "audio";
            this.defaultConstraints.video = false;
        }
        else {
            this.recordMode = "video";
            this.defaultConstraints.video = { width: { ideal: 1280, }, height: { ideal: 720, }, facingMode: this.cameraMode };
        }
        this.ApplyConstraints();

    }

    VideoRecorder.prototype.StopStream = function () {

        if (this.stream) {
            let tracks = this.stream.getTracks();
            tracks.forEach(track => track.stop());
        }
    }

    VideoRecorder.prototype.ApplyConstraints = function () {
        _this = this;
        this.StopStream();
        $("#vr_capturedVideo").css('display', 'none');
        $("#vr_preview").css('display', '');
        if (!$(this.previewElement).attr('autoplay'))
            $(this.previewElement).attr('autoplay', true);
        if (!$(this.previewElement).attr('muted'))
            $(this.previewElement).attr('muted', true);
        navigator.mediaDevices.getUserMedia(this.defaultConstraints).then(st => {
            _this.stream = st;
            _this.previewElement.srcObject = _this.stream;
            // _this.downloadButton.href = _this.stream;
            _this.previewElement.captureStream = _this.previewElement.captureStream || _this.previewElement.mozCaptureStream;
            return new Promise(resolve => _this.previewElement.onplaying = resolve);
        }, (e) => alert(e));
    }


    VideoRecorder.prototype.Close = function () {
        this.StopStream();
        $("#vr_close").off('click');
        $("#vr_container").remove();
        $(document).off('onkeydown');
    };
    return VideoRecorder;
}());