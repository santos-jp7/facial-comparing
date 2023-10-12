let streams = [
  document.getElementById("stream0"),
  document.getElementById("stream1"),
];

let previews = [
  document.getElementById("preview0"),
  document.getElementById("preview1"),
];

let inputs = [
  document.getElementById("input0"),
  document.getElementById("input1"),
];

let actions = [
  document.getElementById("action0"),
  document.getElementById("action1"),
];

let loader = document.getElementById("loader");

let send = document.getElementById("send");
let boxs = document.getElementById("boxs");

const result = document.getElementById("result");
const circle = document.getElementById("circle");
const distance = document.getElementById("distance");
const message = document.getElementById("message");

let files = [];

if (navigator.mediaDevices)
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then(function (stream) {
      streams[0].srcObject = stream;
      streams[0].width = stream.getVideoTracks()[0].getSettings().width / 2;
      streams[0].height = stream.getVideoTracks()[0].getSettings().height / 2;
      streams[0].play();

      streams[1].srcObject = stream;
      streams[1].width = stream.getVideoTracks()[0].getSettings().width / 2;
      streams[1].height = stream.getVideoTracks()[0].getSettings().height / 2;
      streams[1].play();

      console.log(streams[1].width, streams[1].height);
    })
    .catch(function (error) {
      alert("Erro ao acessar a webcam: ", error);
    });

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

async function loadImage(faceNumber) {
  const file = inputs[faceNumber].files[0];
  const stream = streams[faceNumber];
  const preview = previews[faceNumber];

  preview.width = stream.width || 200;
  preview.height = stream.height || 200;

  console.log(preview.width, preview.height);

  if (file) {
    files[faceNumber] = await toBase64(file);

    stream.remove();

    preview.style.display = "block";
    preview.src = files[faceNumber];

    actions[faceNumber].style.display = "none";
  } else {
    var canvas = document.createElement("canvas");
    canvas.width = stream.videoWidth * 2;
    canvas.height = stream.videoHeight * 2;

    var context = canvas.getContext("2d");
    context.drawImage(stream, 0, 0, canvas.width, canvas.height);

    files[faceNumber] = canvas.toDataURL("image/png");

    stream.remove();
    preview.style.display = "block";
    preview.src = files[faceNumber];

    actions[faceNumber].style.display = "none";
  }

  if (files.length == 2) send.disabled = false;
}

async function compareFaces() {
  loader.classList.remove("hide");

  if (files.length < 2)
    return alert("Carregue duas imagens antes de verificar a similaridade.");

  await faceapi.nets.tinyFaceDetector.loadFromUri("./models");
  await faceapi.loadFaceLandmarkModel("./models");
  await faceapi.loadFaceRecognitionModel("./models");
  await faceapi.nets.ssdMobilenetv1.loadFromUri("./models");

  const base64Response0 = await fetch(files[0]);
  const blob0 = await base64Response0.blob();
  const img0 = await faceapi.bufferToImage(blob0);

  const base64Response1 = await fetch(files[1]);
  const blob1 = await base64Response1.blob();
  const img1 = await faceapi.bufferToImage(blob1);

  const face1 = await faceapi
    .detectSingleFace(img0)
    .withFaceLandmarks()
    .withFaceDescriptor();
  const face2 = await faceapi
    .detectSingleFace(img1)
    .withFaceLandmarks()
    .withFaceDescriptor();

  console.log(face1, face2);

  if (!face1 || !face2)
    return alert("Não foi possível detectar rostos nas imagens.");

  const faceDescriptor1 = face1.descriptor;
  const faceDescriptor2 = face2.descriptor;

  boxs.remove();
  send.remove();

  const calc = faceapi.euclideanDistance(faceDescriptor1, faceDescriptor2);

  result.classList.remove("hide");

  if (calc < 0.5) {
    circle.classList.add("bg-green");

    message.innerText = "Comparação OK";
  } else {
    circle.classList.add("bg-red");

    message.innerText = "Não foi encontrado similiridade entre os dois rostos.";
  }

  distance.textContent = calc.toFixed(5);

  loader.classList.add("hide");
}
