// init the Algorithmia client with your API key from https://algorithmia.com/user#credentials
var algoClient = Algorithmia.client('simeyUbLXQ/R8Qga/3ZCRGcr2oR1');

var algorithms = {
  classifier: 'deeplearning/Places365Classifier/0.1.9'
};

/**
 * once DOM is ready, update vars and add handlers
 */
$(document).ready(function() {
  setInviteCode('places');
  requireHttp($('#imgUrl'));
  initDropzone();
});

/**
 * call API on URL, get up to 7 results, and display them
 * @param url
 */
var getPlaces = function(url) {
  if(url) {
    if(url.indexOf('http')==0) {$('#imgUrl').val(url);} //only display http URLs
  } else {
    url = $('#imgUrl').val();
  }
  if(url == "" || url=="http://") {
    return hideWait('Please select an image, click the upload link, or enter a URL');
  }
  showWait();
  var input = {
    "image": url,
    "numResults": 7
  };
  $('#userImg').attr('src',url);
  algoClient.algo(algorithms.classifier).pipe(input).then(function (output) {
    if (output.error) {
      endWait(output.error.message);
    } else {
      showPredictions(output.result.predictions);
      endWait();
    }
  });
};

/**
 * render tags and probabilities into
 * @param result [{"class":string,"prob":number}]
 */
var showPredictions = function(result){
  var html = '';
  for (var i = 0; i < result.length; i++) {
    var prob = (result[i].prob * 100).toFixed(2);
    var tag = result[i].class.replace('_',' ');
    html += '<tr><td><span class="label label-success">'+ tag+'</span></td><td>'+prob+'%</td></tr>';
  }
  $('#results-tbody').html(html);
  hideWait();
};

/**
 * show overlay, clear results
 */
var showWait = function() {
  $('#overlay').removeClass('hidden');
  $('#status-label').empty();
  $("#results-tbody").empty();
  $('#feedback').addClass('hidden');
  $('#feedback-msg').addClass('hidden');
  $('#userImg').removeAttr('src');
};


/**
 * close overlay and either reveal results or display errorMessage
 * @param errorMessage
 */
var hideWait = function(errorMessage) {
  $("#overlay").addClass("hidden");
  if(errorMessage) {
    $('#status-label').html('<div class="alert alert-danger" role="alert">' + errorMessage+ '</div>');
    $('#results').addClass('hidden');
  } else {
    $('#results').removeClass('hidden');
    $('#feedback').removeClass('hidden');
    $('#feedback-msg').addClass('hidden');
    $('html, body').animate({
      scrollTop: $("#results").offset().top
    }, 1000);
  }
};

/**
 * initialize Dropzone component
 */
var initDropzone = function() {
  window.Dropzone.autoDiscover = false;
  var dropzone = new Dropzone("#file-dropzone", {
    url: 'javascript:;',
    options: {sending: function() {}},
    acceptedFiles: "image/*",
    previewTemplate: "<div></div>",
    maxFilesize: 10,
    filesizeBase: 1024,
    createImageThumbnails: false,
    clickable: true
  });
  dropzone.__proto__.cancelUpload = function() {};
  dropzone.__proto__.uploadFile = function() {};
  dropzone.__proto__.uploadFiles = function() {};
  dropzone.on("processing", function(file) {
    showWait();
    var reader = new FileReader();
    reader.addEventListener("load", function () {
      getPlaces(reader.result);
      dropzone.removeFile(file);
    }, false);
    reader.readAsDataURL(file);
  });
  dropzone.on("error", function(file, err) {
    dropzone.removeFile(file);
    endWait(err);
  });
};

var clickYes = function() {
  console.log("User clicked yes");
  // Hide accuracy check
  $("#feedback").addClass("hidden");
};
var clickNo = function() {
  console.log("User clicked no");
  var input = {
    "image": $('#imgUrl').val(),
    "targetDirectory": "data://.my/Reclassify/"
  };
  algoClient.algo("util/SmartImageDownloader/0.2.4").pipe(input).then(function(result) {
    if(result.error) {
      console.error("Failed to mark image for re-classification");
    } else {
      $("#feedback").addClass("hidden");
      $("#feedback-msg").removeClass("hidden");
    }
  });
};
