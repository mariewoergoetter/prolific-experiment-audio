function make_slides(f) {
  var slides = {};

  // set up initial slide
  slides.i0 = slide({
    name: "i0",
    start: function() {
      exp.startT = Date.now();
    }
  });


  slides.example1 = slide({
  name: "example1",

  start: function() {
    $("#example1 .err").hide();
    $("input[name='example1_cont']:checked").prop("checked", false);
  },

  button: function() {
    var choice = $("input[name='example1_cont']:checked").val();
    if (!choice) {
      $("#example1 .err").show();
      return;
    }
    $("#example1 .err").hide();
    exp.go();
  }
});



slides.example2 = slide({
  name: "example2",

  start: function() {
    $("#example2 .err").hide();
    $("input[name='example2_cont']:checked").prop("checked", false);
  },

  button: function() {
    var choice = $("input[name='example2_cont']:checked").val();
    if (!choice) {
      $("#example2 .err").show();
      return;
    }
    $("#example2 .err").hide();
    exp.go();
  }
});



  slides.startExp = slide({
    name: "startExp",
    button: function() {
      exp.go();
    }
  });


  slides.trial = slide({
    name: "trial",

    present: exp.stimuli,

    present_handle: function(stim) {
      $(".err").hide();

      $("input[name='cont']:checked").prop("checked", false);
      $("#trial_feedback").val("");

      this.stim = stim;

      $("#trial-sentence").html(stim.Sentence);

      var opts = _.shuffle([
        { key: "C1", text: stim.C1 },
        { key: "C2", text: stim.C2 }
      ]);

      this.opt1_key = opts[0].key;
      this.opt2_key = opts[1].key;

      $("#opt1_text").html(opts[0].text);
      $("#opt2_text").html(opts[1].text);

      this.startTime = Date.now();
    },

    button: function() {
      var choice = $("input[name='cont']:checked").val();

      if (!choice) {
        $(".err").show();
        return;
      }

      var chosen_key = (choice === "opt1") ? this.opt1_key : this.opt2_key;
      var chosen_text = (chosen_key === "C1") ? this.stim.C1 : this.stim.C2;
      var rt_ms = Date.now() - this.startTime;

      exp.data_trials.push({
        "slide_number_in_experiment": exp.phase,
  
        "list_assigned": exp.list,
        "item_list": this.stim.List,
        "type": this.stim.Type,
        "group": this.stim.Group,
        "item": this.stim.ItemID,
        "variant": this.stim.Variant,
  
        "filler_type": this.stim.FillerType || null,
  
        "sentence": this.stim.Sentence,
        "C1": this.stim.C1,
        "C2": this.stim.C2,
  
        "opt1_key": this.opt1_key,
        "opt2_key": this.opt2_key,
  
        "chosen_button": choice,
        "chosen_key": chosen_key,
        "chosen_text": chosen_text,
  
        "rt_ms": rt_ms,
        "item_feedback": $("#trial_feedback").val()
      });

      _stream.apply(this);
    }
  });


  slides.subj_info = slide({
    name: "subj_info",
    submit: function(e) {
      exp.subj_data = {
        language: $("#language").val(),
        enjoyment: $("#enjoyment").val(),
        asses: $('input[name="assess"]:checked').val(),
        age: $("#age").val(),
        gender: $("#gender").val(),
        education: $("#education").val(),
        fairprice: $("#fairprice").val(),
        experiment_about: $("#experiment_about").val(),
        comments: $("#comments").val()
      };
      exp.go();
    }
  });


  slides.thanks = slide({
    name: "thanks",
    start: function() {
      exp.data = {
        "trials": exp.data_trials,
        "catch_trials": exp.catch_trials,
        "system": exp.system,
        "list_assigned": exp.list,
        "subject_information": exp.subj_data,
        "time_in_minutes": (Date.now() - exp.startT) / 60000
      };
      proliferate.submit(exp.data);
    }
  });

  return slides;
}


function init() {

  exp.trials = [];
  exp.catch_trials = [];


  var condition = new URLSearchParams(window.location.search).get("cond");
  condition = condition === null ? NaN : parseInt(condition, 10);

  if (!isNaN(condition) && condition >= 1 && condition <= 15) {
  exp.list = condition;
  } else {
  exp.list = _.sample([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]); // fallback
  }

  var critical = all_stims.filter(function(s) {
    return s.Type === "critical" && Number(s.List) === exp.list;
  });

  var fillers = all_stims.filter(function(s) {
    return s.Type === "filler";
  });

  exp.stimuli = _.shuffle(critical.concat(fillers));
  exp.n_trials = exp.stimuli.length;

  exp.system = {
    Browser: BrowserDetect.browser,
    OS: BrowserDetect.OS,
    screenH: screen.height,
    screenUH: exp.height,
    screenW: screen.width,
    screenUW: exp.width
  };

  exp.structure = [
    "i0",
    "example1",
    "example2",
    "startExp",
    "trial",
    "subj_info",
    "thanks"
  ];

  exp.data_trials = [];

  exp.slides = make_slides(exp);
  exp.nQs = utils.get_exp_length();

  $('.slide').hide();

  $("#start_button").click(function() {
    exp.go();
  });

  exp.go();
}
