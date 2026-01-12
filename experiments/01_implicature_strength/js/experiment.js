// set up experiment logic for each slide
function make_slides(f) {
  var slides = {};

  // set up initial slide
  slides.i0 = slide({
    name: "i0",
    start: function() {
      exp.startT = Date.now();
    }
  });

  // set up the first example slide
  slides.example1 = slide({
    name: "example1",

    // this is executed when the slide is shown
    start: function() {
      // hide error message
      $('.err').hide();
    },

    // this is executed when the participant clicks the "Continue button"
    button: function() {
      // read in the value of the selected radio button
      this.radio = $("input[name='number']:checked").val();
      // check whether the participant selected a reasonable value (i.e, 5, 6, or 7)
      if (this.radio == "5" || this.radio == "6" || this.radio == "7") {
        // log response
        this.log_responses();
        // continue to next slide
        exp.go();
      } else {
        // participant gave non-reasonable response --> show error message
        $('.err').show();
        this.log_responses();
      }
    },

    log_responses: function() {
      // add response to exp.data_trials
      // this data will be submitted at the end of the experiment
      exp.data_trials.push({
        "slide_number_in_experiment": exp.phase,
        "id": "example1",
        "response": this.radio,
        "strangeSentence": "",
        "sentence": "",
      });
    },
  });

  // set up slide for second example trial
  slides.example2 = slide({
    name: "example2",

    start: function() {
      // hide error message
      $(".err").hide();
    },

    // handle button click
    button: function() {
      this.radio = $("input[name='number']:checked").val();
      if (this.radio == "1" || this.radio == "2" || this.radio == "3") {
        this.log_responses();
        exp.go();
      } else {
        $('.err').show();
        this.log_responses();
      }
    },

    log_responses: function() {
      exp.data_trials.push({
        "slide_number_in_experiment": exp.phase,
        "id": "example2",
        "response": this.radio,
        "strangeSentence": "",
        "sentence": "",
      });
    }
  });

  // set up slide with instructions for main experiment
  slides.startExp = slide({
    name: "startExp",
    start: function() {
    },
    button: function() {
      exp.go(); //use exp.go() if and only if there is no "present" data.
    },
  });

  // =========================
  // UPDATED TRIAL SLIDE (binary continuation choice)
  // Requires experiment.html trial slide to contain:
  //   #trial-sentence
  //   radio inputs name="cont" values "opt1"/"opt2"
  //   #opt1_text and #opt2_text
  // =========================
  slides.trial = slide({
    name: "trial",

    // rotate through stimulus list
    present: exp.stimuli,

    // runs once per stimulus
    present_handle: function(stim) {

      // hide error message
      $(".err").hide();

      // clear previous selection
      $("input[name='cont']:checked").prop("checked", false);

      // store stimulus
      this.stim = stim;

      // show top sentence
      $("#trial-sentence").html(stim.Sentence);

      // randomize order of continuations
      var opts = _.shuffle([
        { key: "C1", text: stim.C1 },
        { key: "C2", text: stim.C2 }
      ]);

      // remember which continuation is in which slot
      this.opt1_key = opts[0].key;   // "C1" or "C2"
      this.opt2_key = opts[1].key;

      // render continuation texts
      $("#opt1_text").html(opts[0].text);
      $("#opt2_text").html(opts[1].text);

      // optional response time
      this.startTime = Date.now();
    },

    // handle click on "Continue" button
    button: function() {
      var choice = $("input[name='cont']:checked").val(); // "opt1" or "opt2"

      if (!choice) {
        $(".err").show();
        return;
      }

      // map choice to underlying continuation
      var chosen_key = (choice === "opt1") ? this.opt1_key : this.opt2_key;
      var chosen_text = (chosen_key === "C1") ? this.stim.C1 : this.stim.C2;

      // optional response time
      var rt_ms = Date.now() - this.startTime;

      // log trial
      exp.data_trials.push({
        "slide_number_in_experiment": exp.phase,

        // item metadata (make sure stimuli have these keys)
        "item": this.stim.ItemID,
        "variant": this.stim.Variant,

        // presented material
        "sentence": this.stim.Sentence,
        "C1": this.stim.C1,
        "C2": this.stim.C2,

        // randomized display order
        "opt1_key": this.opt1_key,
        "opt2_key": this.opt2_key,

        // response
        "chosen_button": choice,   // opt1 / opt2
        "chosen_key": chosen_key,  // C1 / C2
        "chosen_text": chosen_text,

        // timing
        "rt_ms": rt_ms
      });

      // advance within the stimulus list
      _stream.apply(this);
    }
  });

  // slide to collect subject information
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
        comments: $("#comments").val()
      };
      exp.go(); //use exp.go() if and only if there is no "present" data.
    }
  });

  // final submission slide
  slides.thanks = slide({
    name: "thanks",
    start: function() {
      exp.data = {
        "trials": exp.data_trials,
        "catch_trials": exp.catch_trials,
        "system": exp.system,
        "condition": exp.condition,
        "subject_information": exp.subj_data,
        "time_in_minutes": (Date.now() - exp.startT) / 60000
      };
      proliferate.submit(exp.data);
    }
  });

  return slides;
}

/// initialize experiment
function init() {

  exp.trials = [];
  exp.catch_trials = [];
  var stimuli = all_stims;

  // randomize trial order per participant
  exp.stimuli = _.shuffle(stimuli);
  exp.n_trials = exp.stimuli.length;

  // exp.condition = _.sample(["context", "no-context"]); //can randomize between subjects conditions here

  exp.system = {
    Browser: BrowserDetect.browser,
    OS: BrowserDetect.OS,
    screenH: screen.height,
    screenUH: exp.height,
    screenW: screen.width,
    screenUW: exp.width
  };

  //blocks of the experiment:
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

  //make corresponding slides:
  exp.slides = make_slides(exp);

  exp.nQs = utils.get_exp_length();
  //this does not work if there are stacks of stims (but does work for an experiment with this structure)
  //relies on structure and slides being defined

  $('.slide').hide(); //hide everything

  $("#start_button").click(function() {
    exp.go();
  });

  exp.go(); //show first slide
}
