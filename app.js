$(function () {
   $("#btnTest").click(() => new VideoRecorder((e) => {
      if (e.type === "image") {
         recording.src = '';
         recording.poster = e.data;
      }
      else
         recording.src = e.data;


   }).Show());
});