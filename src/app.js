//import { dafault } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
//const { PoseLandmarker, FilesetResolver, DrawingUtils } = dafault;
import { PoseLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.14";
import { getLandmarks, startStreaming } from "./threejsmanager.js";


const demosSection = document.getElementById("demos");

let poseLandmarker;
let runningMode = "VIDEO";
let webcamRunning = false;
let streaming = false;
const videoHeight = "640px";
const videoWidth = "480px";

const createPoseLandmarker = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );
  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task`, //https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task
      delegate: "GPU"
    },
    runningMode: runningMode,
    numPoses: 1,
    minPoseDetectionConfidence: 0.8,
    minPosePresenceConfidence: 0.8,
    minTrackingConfidence: 0.8
  });
  demosSection.classList.remove("invisible");
  console.log("pose landmarks loaded");
  enableCam();
};
createPoseLandmarker();

const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
const drawingUtils = new DrawingUtils(canvasCtx);

// Check if webcam access is supported.
const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;

if (hasGetUserMedia()) {
  console.log('hasGetUserMedia');
} else {
  console.warn("getUserMedia() is not supported by your browser");
}

// Enable the live webcam view and start detection.
function enableCam(event) {
  if (!poseLandmarker) {
    console.log("Wait! poseLandmaker not loaded yet.");
    return;
  }

  webcamRunning = true;


  // getUsermedia parameters.
  const constraints = {
    video: {
      width: 640,
      height: 480,
      facingMode: "face" //face or environment
    }
  };

  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    video.srcObject = stream;
    video.addEventListener("loadeddata", predictWebcam);
    console.log("frame:" + stream.getVideoTracks()[0].getSettings().frameRate + "  video height:", stream.getVideoTracks()[0].getSettings().height + "  video width:" + stream.getVideoTracks()[0].getSettings().width);
  }, err => console.log(err));
}

let lastVideoTime = -1;
async function predictWebcam() {

  canvasElement.style.height = videoHeight;
  video.style.height = videoHeight;
  canvasElement.style.width = videoWidth;
  video.style.width = videoWidth;

  let startTimeMs = performance.now();
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime;
    poseLandmarker.detectForVideo(video, startTimeMs, (result) => {
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      for (const landmark of result.landmarks) {
        drawingUtils.drawLandmarks(landmark, {
          radius: (data) => {
            DrawingUtils.lerp(data.from.z, -0.15, 0.1, 5, 1);
          }
        });
        drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS);

      }
      canvasCtx.restore();
      //console.log(result.landmarks);
      if (result.landmarks != null && result.landmarks.length > 0) {
        getLandmarks(result.landmarks[0]);
      }

      //if (!streaming) {
      // streaming = true;
      //}
    });
  }


  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
    if (!streaming) {
      streaming = true;
      //Setup stream plane in threejs scene
      startStreaming(video);
    }
  }
}
