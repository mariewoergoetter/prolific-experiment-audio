function make_slides(f) {
  var slides = {};


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
      $("input[name='example1_cont']").prop("checked", false);
    },

    button: function() {
      var choice = $("input[name='example1_cont']:checked").val();

      if (!choice) {
        $("#example1 .err")
          .text("Please select an option before continuing.")
          .show();
        return;
      }

      // Restriction: only the "right" continuation lets them proceed
      if (choice !== "opt1") {
        $("#example1 .err")
          .text("Not quite — the other continuation is more appropriate in this context.")
          .css("color", "red")
          .show();
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
      $("input[name='example2_cont']").prop("checked", false);
    },

    button: function() {
      var choice = $("input[name='example2_cont']:checked").val();

      if (!choice) {
        $("#example2 .err")
          .text("Please select an option before continuing.")
          .show();
        return;
      }

      if (choice !== "opt1") {
        $("#example2 .err")
          .text("Not quite — the other continuation is more appropriate in this context.")
          .css("color", "red")
          .show();
        return;
      }

      $("#example2 .err").hide();
      exp.go();
    }
  });

  // -------------------------
  // Start experiment slide
  // -------------------------
  slides.startExp = slide({
    name: "startExp",
    button: function() {
      exp.go();
    }
  });

  // -------------------------
  // Main trial slide (binary choice between two continuations)
  // -------------------------
  slides.trial = slide({
    name: "trial",

    present: exp.stimuli,

    present_handle: function(stim) {
      // Hide any error messages on the slide
      $(".err").hide();

      // Reset choice + optional comments field
      $("input[name='cont']").prop("checked", false);
      $("#trial_feedback").val("");

      this.stim = stim;

      // Insert sentence
      $("#trial-sentence").html(stim.Sentence);

      // Shuffle which continuation appears on top
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

      // Advance to next stimulus / slide
      _stream.apply(this);
    }
  });

  // -------------------------
  // Subject info slide
  // -------------------------
  slides.subj_info = slide({
    name: "subj_info",

    start: function() {
      $("#language").val("");
      $("#experiment_about").val("");
      $("#comments").val("");
      $("#enjoyment").val("-1");
      $("#fairprice").val("-1");
      $('input[name="assess"]').prop("checked", false);
    },
    submit: function(e) {
      exp.subj_data = {
        language: $("#language").val(),
        enjoyment: $("#enjoyment").val(),
        assess: $('input[name="assess"]:checked').val(),
        fairprice: $("#fairprice").val(),
        experiment_about: $("#experiment_about").val(),
        comments: $("#comments").val()
      };
      exp.go();
    }
  });

  // -------------------------
  // Thanks + submit
  // -------------------------
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

  // --- list assignment via URL param "cond", else random fallback
  var condition = new URLSearchParams(window.location.search).get("cond");
  condition = condition === null ? NaN : parseInt(condition, 10);

  // NOTE: You currently have 15 lists in your code. Adjust if needed.
  if (!isNaN(condition) && condition >= 1 && condition <= 15) {
    exp.list = condition;
  } else {
    exp.list = _.sample([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]);
  }

  // --- select stims for assigned list
  var critical = all_stims.filter(function(s) {
    return s.Type === "critical" && Number(s.List) === exp.list;
  });

  var fillers = all_stims.filter(function(s) {
    return s.Type === "filler";
  });

  // --- shuffle order
  exp.stimuli = _.shuffle(critical.concat(fillers));
  exp.n_trials = exp.stimuli.length;

  // --- system info
  exp.system = {
    Browser: BrowserDetect.browser,
    OS: BrowserDetect.OS,
    screenH: screen.height,
    screenUH: exp.height,
    screenW: screen.width,
    screenUW: exp.width
  };

  // --- experiment flow
  exp.structure = [
    "i0",
    "example1",
    "example2",
    "startExp",
    "trial",
    "subj_info",
    "thanks"
  ];

  // --- data
  exp.data_trials = [];

  // --- build slides
  exp.slides = make_slides(exp);
  exp.nQs = utils.get_exp_length();

  // hide all slides at start
  $(".slide").hide();

  // start button (if you have one on the first screen)
  $("#start_button").click(function() {
    exp.go();
  });

  // auto-start (template behavior)
  exp.go();
}
